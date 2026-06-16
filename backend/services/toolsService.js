import { supabase } from './supabase.js';
import { getAccountBalances } from './pluggyService.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'criar_transacao',
    description: 'Cria uma nova transação financeira (gasto ou receita) para o usuário. Use quando o usuário mencionar que gastou ou recebeu algo.',
    parameters: {
      descricao: { type: 'string', description: 'Descrição do gasto ou receita (ex: "Almoço", "Salário")' },
      valor: { type: 'number', description: 'Valor em reais, sempre positivo' },
      tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'despesa para gastos, receita para entradas de dinheiro' },
      categoria: { type: 'string', enum: ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'], description: 'Categoria mais adequada' },
      data: { type: 'string', description: 'Data no formato YYYY-MM-DD. Omita para usar hoje.' },
    },
    required: ['descricao', 'valor', 'tipo'],
  },
  {
    name: 'listar_transacoes',
    description: 'Lista transações do usuário. Use sempre antes de atualizar ou excluir para obter o ID correto.',
    parameters: {
      limite: { type: 'number', description: 'Máximo de resultados (padrão 20)' },
      tipo: { type: 'string', enum: ['receita', 'despesa'] },
      categoria: { type: 'string' },
      data_inicio: { type: 'string', description: 'YYYY-MM-DD' },
      data_fim: { type: 'string', description: 'YYYY-MM-DD' },
      busca: { type: 'string', description: 'Texto para buscar na descrição' },
    },
    required: [],
  },
  {
    name: 'atualizar_transacao',
    description: 'Atualiza descrição, valor, data, tipo ou categoria de uma transação existente.',
    parameters: {
      id: { type: 'string', description: 'ID da transação (use listar_transacoes para encontrar)' },
      descricao: { type: 'string' },
      valor: { type: 'number', description: 'Novo valor em reais' },
      tipo: { type: 'string', enum: ['receita', 'despesa'] },
      categoria: { type: 'string', enum: ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'] },
      data: { type: 'string', description: 'Nova data YYYY-MM-DD' },
    },
    required: ['id'],
  },
  {
    name: 'consultar_saldo_bancario',
    description: 'Consulta o saldo real nas contas bancárias conectadas via Pluggy Open Finance. Use quando o usuário perguntar quanto tem no banco, qual o saldo bancário, quanto de dinheiro tem disponível na conta, etc.',
    parameters: {},
    required: [],
  },
  {
    name: 'excluir_transacao',
    description: 'Exclui permanentemente uma transação. Confirme com o usuário antes de usar.',
    parameters: {
      id: { type: 'string', description: 'ID da transação a excluir' },
    },
    required: ['id'],
  },
];

export async function executeTool(name, args, userId) {
  switch (name) {
    case 'criar_transacao': {
      const row = {
        user_id: userId,
        descricao: String(args.descricao || '').slice(0, 255),
        valor: Math.abs(Number(args.valor) || 0),
        tipo: args.tipo === 'receita' ? 'receita' : 'despesa',
        categoria: args.categoria || 'Outros',
        data: args.data || new Date().toISOString().split('T')[0],
      };
      if (!row.valor) return { sucesso: false, erro: 'Valor inválido.' };
      const { data, error } = await supabase.from('transactions').insert(row).select('id').single();
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, id: data.id, mensagem: `Transação criada: "${row.descricao}" R$ ${row.valor.toFixed(2)} (${row.tipo}) em ${row.data}` };
    }

    case 'listar_transacoes': {
      let q = supabase.from('transactions')
        .select('id, descricao, valor, tipo, categoria, data')
        .eq('user_id', userId)
        .order('data', { ascending: false })
        .limit(args.limite || 20);
      if (args.tipo) q = q.eq('tipo', args.tipo);
      if (args.categoria) q = q.eq('categoria', args.categoria);
      if (args.data_inicio) q = q.gte('data', args.data_inicio);
      if (args.data_fim) q = q.lte('data', args.data_fim);
      if (args.busca) q = q.ilike('descricao', `%${args.busca}%`);
      const { data, error } = await q;
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, total: data.length, transacoes: data };
    }

    case 'atualizar_transacao': {
      const { id, ...fields } = args;
      const updates = {};
      if (fields.descricao !== undefined) updates.descricao = String(fields.descricao).slice(0, 255);
      if (fields.valor !== undefined) updates.valor = Math.abs(Number(fields.valor));
      if (fields.tipo !== undefined) updates.tipo = fields.tipo;
      if (fields.categoria !== undefined) updates.categoria = fields.categoria;
      if (fields.data !== undefined) updates.data = fields.data;
      if (!Object.keys(updates).length) return { sucesso: false, erro: 'Nenhum campo para atualizar.' };
      const { error } = await supabase.from('transactions').update(updates).eq('id', id).eq('user_id', userId);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, mensagem: `Transação ${id} atualizada.` };
    }

    case 'excluir_transacao': {
      const { error } = await supabase.from('transactions').delete().eq('id', args.id).eq('user_id', userId);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, mensagem: 'Transação excluída.' };
    }

    case 'consultar_saldo_bancario': {
      try {
        const accounts = await getAccountBalances(userId);
        if (!accounts.length) return { sucesso: true, mensagem: 'Nenhuma conta bancária conectada. Vá em Integrações > Banco Direto para conectar.', contas: [] };
        const totalEmConta = accounts.filter(a => a.type !== 'CREDIT').reduce((s, a) => s + (a.balance || 0), 0);
        const fmtBRL = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const linhas = accounts.map(a => `${a.name} (${a.type === 'CREDIT' ? 'Cartão' : 'Conta'}): ${fmtBRL(a.balance)}`).join('; ');
        return { sucesso: true, mensagem: `${linhas}. Total em conta corrente/poupança: ${fmtBRL(totalEmConta)}`, contas: accounts, totalEmConta };
      } catch (e) { return { sucesso: false, erro: e.message }; }
    }

    default:
      return { sucesso: false, erro: `Ferramenta desconhecida: ${name}` };
  }
}

// Convert neutral tool defs to provider-specific formats
export function toClaudeTools(defs) {
  return defs.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object',
      properties: t.parameters,
      required: t.required,
    },
  }));
}

export function toOpenAITools(defs) {
  return defs.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: { type: 'object', properties: t.parameters, required: t.required },
    },
  }));
}

export function toGeminiTools(defs) {
  const toGeminiType = (t) => ({ number: 'NUMBER', string: 'STRING', boolean: 'BOOLEAN' }[t] || 'STRING');
  return [{
    functionDeclarations: defs.map(t => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: 'OBJECT',
        properties: Object.fromEntries(Object.entries(t.parameters).map(([k, v]) => [k, {
          type: toGeminiType(v.type),
          description: v.description || '',
          ...(v.enum ? { enum: v.enum } : {}),
        }])),
        required: t.required,
      },
    })),
  }];
}
