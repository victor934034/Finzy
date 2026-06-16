import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TOOL_DEFINITIONS, executeTool, toClaudeTools, toOpenAITools, toGeminiTools } from './toolsService.js';

const SYSTEM_PROMPT = `Você é FinIA, assistente financeira pessoal inteligente e empática brasileira.
Analise dados financeiros reais e forneça insights precisos, conselhos práticos e previsões realistas.
Responda SEMPRE em português brasileiro de forma clara e amigável.
Use markdown quando apropriado. Seja direto — use os dados fornecidos.
Valores monetários: formato R$ X.XXX,XX.

Você tem controle total sobre as finanças do usuário e pode usar ferramentas para:
- Criar transações quando o usuário mencionar gastos ou receitas
- Listar transações para encontrar o que o usuário quer editar
- Atualizar data, valor, descrição ou categoria de qualquer transação
- Excluir transações quando solicitado

Seja proativo: se o usuário disser "gastei 50 reais no mercado hoje", crie a transação automaticamente sem perguntar.
Se o usuário quiser corrigir algo, liste as transações relevantes primeiro, depois atualize.`;

const PROVIDER_MODELS = {
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-1.5-flash',
};

const MAX_TOOL_ROUNDS = 5;

function isKeySet(k) { return !!k && k !== 'cole_sua_chave_aqui'; }

function getAvailableProviders() {
  return ['claude', 'openai', 'gemini'].filter(p => {
    if (p === 'claude') return isKeySet(process.env.ANTHROPIC_API_KEY);
    if (p === 'openai') return isKeySet(process.env.OPENAI_API_KEY);
    if (p === 'gemini') return isKeySet(process.env.GEMINI_API_KEY);
  });
}

function isQuotaError(provider, err) {
  if (provider === 'claude') return err.status === 529 || err.status === 429 || err.error?.type === 'overloaded_error';
  if (provider === 'openai') return err.status === 429;
  if (provider === 'gemini') return err.status === 429 || err.status === 503;
  return false;
}

// ── Claude ────────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, messages, maxTokens, tools, userId) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const claudeTools = tools ? toClaudeTools(tools) : undefined;
  const actions = [];
  let currentMessages = [...messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const params = { model: PROVIDER_MODELS.claude, max_tokens: maxTokens, messages: currentMessages };
    if (systemPrompt) params.system = systemPrompt;
    if (claudeTools) params.tools = claudeTools;

    const response = await client.messages.create(params);

    if (response.stop_reason !== 'tool_use' || !claudeTools) {
      const text = response.content.find(b => b.type === 'text')?.text || '';
      return { text, actions };
    }

    // Execute tool calls
    const toolResults = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(block.name, block.input, userId);
        actions.push({ tool: block.name, args: block.input, result });
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
    }

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  // Max rounds reached — get final text without tools
  const final = await client.messages.create({ model: PROVIDER_MODELS.claude, max_tokens: maxTokens, ...(systemPrompt ? { system: systemPrompt } : {}), messages: currentMessages });
  return { text: final.content[0]?.text || '', actions };
}

// ── OpenAI ────────────────────────────────────────────────────────────────────
async function callOpenAI(systemPrompt, messages, maxTokens, tools, userId) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const oaiTools = tools ? toOpenAITools(tools) : undefined;
  const actions = [];

  const baseMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;
  let currentMessages = [...baseMessages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const params = { model: PROVIDER_MODELS.openai, max_tokens: maxTokens, messages: currentMessages };
    if (oaiTools) params.tools = oaiTools;

    const response = await client.chat.completions.create(params);
    const msg = response.choices[0].message;

    if (!msg.tool_calls?.length) return { text: msg.content || '', actions };

    // Execute tool calls
    currentMessages.push(msg);
    for (const call of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(call.function.arguments); } catch {}
      const result = await executeTool(call.function.name, args, userId);
      actions.push({ tool: call.function.name, args, result });
      currentMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  const final = await client.chat.completions.create({ model: PROVIDER_MODELS.openai, max_tokens: maxTokens, messages: currentMessages });
  return { text: final.choices[0].message.content || '', actions };
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(systemPrompt, messages, maxTokens, tools, userId) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const actions = [];

  const modelConfig = { model: PROVIDER_MODELS.gemini, generationConfig: { maxOutputTokens: maxTokens } };
  if (systemPrompt) modelConfig.systemInstruction = systemPrompt;
  if (tools) modelConfig.tools = toGeminiTools(tools);

  const model = genAI.getGenerativeModel(modelConfig);

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const chat = model.startChat({ history });
  let result = await chat.sendMessage(messages[messages.length - 1].content);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const calls = result.response.functionCalls?.() || [];
    if (!calls.length) break;

    const functionResponses = [];
    for (const call of calls) {
      const toolResult = await executeTool(call.name, call.args, userId);
      actions.push({ tool: call.name, args: call.args, result: toolResult });
      functionResponses.push({ functionResponse: { name: call.name, response: toolResult } });
    }
    result = await chat.sendMessage(functionResponses);
  }

  return { text: result.response.text(), actions };
}

// ── dispatcher ────────────────────────────────────────────────────────────────
async function dispatchProvider(provider, systemPrompt, messages, maxTokens, tools, userId) {
  if (provider === 'claude') return callClaude(systemPrompt, messages, maxTokens, tools, userId);
  if (provider === 'openai') return callOpenAI(systemPrompt, messages, maxTokens, tools, userId);
  if (provider === 'gemini') return callGemini(systemPrompt, messages, maxTokens, tools, userId);
  throw new Error(`Provedor desconhecido: ${provider}`);
}

async function callAI(systemPrompt, messages, maxTokens = 1000, options = {}) {
  const { tools = null, userId = null } = options;
  const available = getAvailableProviders();
  if (!available.length) throw new Error('Nenhuma chave de API de IA configurada. Adicione ANTHROPIC_API_KEY, OPENAI_API_KEY ou GEMINI_API_KEY no backend/.env');

  let lastError;
  for (const provider of available) {
    try {
      const result = await dispatchProvider(provider, systemPrompt, messages, maxTokens, tools, userId);
      return { ...result, provider };
    } catch (err) {
      if (isQuotaError(provider, err)) { lastError = err; continue; }
      throw err;
    }
  }
  throw lastError || new Error('Todos os provedores de IA indisponíveis.');
}

// ── Exports ───────────────────────────────────────────────────────────────────
export function getProvidersStatus() {
  return {
    claude: { configured: isKeySet(process.env.ANTHROPIC_API_KEY), model: PROVIDER_MODELS.claude },
    openai: { configured: isKeySet(process.env.OPENAI_API_KEY), model: PROVIDER_MODELS.openai },
    gemini: { configured: isKeySet(process.env.GEMINI_API_KEY), model: PROVIDER_MODELS.gemini },
  };
}

export async function categorizeTransaction(descricao) {
  const categorias = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'];
  const { text } = await callAI(null, [{
    role: 'user',
    content: `Categorize esta transação em UMA categoria: ${categorias.join(', ')}.\nTransação: "${descricao}"\nResponda APENAS com o nome da categoria.`,
  }], 50);
  const cat = text.trim();
  return categorias.includes(cat) ? cat : 'Outros';
}

export async function generateDashboardInsight(dados) {
  const { saldo, receitas, despesas, topCategorias } = dados;
  return callAI(SYSTEM_PROMPT, [{
    role: 'user',
    content: `Analise a situação financeira (máx 3 parágrafos curtos):\n- Saldo: R$ ${saldo?.toFixed(2)}\n- Receitas: R$ ${receitas?.toFixed(2)}\n- Despesas: R$ ${despesas?.toFixed(2)}\n- Top gastos: ${topCategorias?.map(c => `${c.categoria} R$ ${c.total?.toFixed(2)}`).join(', ')}\n\nInsight direto, ponto de atenção e 1 dica prática.`,
  }], 400);
}

export async function analyzeInvestments(investimentos) {
  const totalInvestido = investimentos.reduce((s, i) => s + i.valor_investido, 0);
  const totalAtual = investimentos.reduce((s, i) => s + (i.valor_atual || i.valor_investido), 0);
  const rentabilidade = totalInvestido > 0 ? ((totalAtual - totalInvestido) / totalInvestido * 100) : 0;
  return callAI(SYSTEM_PROMPT, [{
    role: 'user',
    content: `Analise a carteira:\n${investimentos.map(i => `- ${i.nome} (${i.tipo}): R$ ${i.valor_investido?.toFixed(2)} → R$ ${(i.valor_atual || i.valor_investido)?.toFixed(2)}`).join('\n')}\n\nTotal: R$ ${totalInvestido.toFixed(2)} | Atual: R$ ${totalAtual.toFixed(2)} | Rentabilidade: ${rentabilidade.toFixed(2)}%\n\nAnalise diversificação e dê 2-3 recomendações.`,
  }], 600);
}

export async function generateBusinessReport(dados) {
  const { receitas, despesas, lucro, categorias, mes } = dados;
  const margem = receitas > 0 ? (lucro / receitas * 100) : 0;
  return callAI(SYSTEM_PROMPT, [{
    role: 'user',
    content: `Relatório executivo ${mes}:\n- Receita: R$ ${receitas?.toFixed(2)}\n- Despesas: R$ ${despesas?.toFixed(2)}\n- Lucro: R$ ${lucro?.toFixed(2)} (margem ${margem.toFixed(1)}%)\n- Categorias: ${categorias?.map(c => `${c.categoria} R$ ${c.total?.toFixed(2)}`).join(', ')}\n\n1) Avaliação 2) Pontos críticos 3) Previsão próximo mês 4) 2 ações.`,
  }], 700);
}

export async function predictCashFlow(dados) {
  const { entradas, saidas, saldoAtual, historico } = dados;
  return callAI(SYSTEM_PROMPT, [{
    role: 'user',
    content: `Previsão fluxo de caixa 30 dias:\n- Saldo: R$ ${saldoAtual?.toFixed(2)}\n- Média entradas: R$ ${entradas?.toFixed(2)}\n- Média saídas: R$ ${saidas?.toFixed(2)}\n- Histórico: ${historico?.map(h => `${h.mes}: R$ ${h.receitas?.toFixed(2)} in / R$ ${h.despesas?.toFixed(2)} out`).join(', ')}\n\nPrevisão realista com alertas e recomendações.`,
  }], 500);
}

export async function chatWithAI(messages, userContext, userId) {
  const { saldo, transacoesRecentes, totalReceitas, totalDespesas, investimentos } = userContext;
  const hoje = new Date().toISOString().split('T')[0];

  const systemWithContext = `${SYSTEM_PROMPT}

CONTEXTO FINANCEIRO DO USUÁRIO (dados atuais):
- Data de hoje: ${hoje}
- Saldo do mês: R$ ${saldo?.toFixed(2) || '0,00'}
- Receitas do mês: R$ ${totalReceitas?.toFixed(2) || '0,00'}
- Despesas do mês: R$ ${totalDespesas?.toFixed(2) || '0,00'}
- Total investido: R$ ${investimentos?.reduce((s, i) => s + i.valor_investido, 0)?.toFixed(2) || '0,00'}
- Últimas transações: ${transacoesRecentes?.slice(0, 5).map(t => `${t.data} ${t.descricao} R$ ${t.valor} (${t.tipo})`).join(' | ') || 'Nenhuma'}`;

  const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }));
  return callAI(systemWithContext, formattedMessages, 1000, { tools: TOOL_DEFINITIONS, userId });
}

export async function parseEmailsToTransactions(emailSummaries) {
  return callAI(
    'Você é um extrator de transações financeiras de e-mails bancários brasileiros.',
    [{ role: 'user', content: `Extraia transações destes e-mails. Retorne JSON array com campos: descricao, valor (número), tipo ("despesa" ou "receita"), data (YYYY-MM-DD), categoria (Alimentação|Transporte|Saúde|Lazer|Negócio|Investimentos|Outros). Ignore e-mails sem transação. Responda APENAS com o JSON array, sem markdown.\n\n${emailSummaries}` }],
    2000
  );
}
