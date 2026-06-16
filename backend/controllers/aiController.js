import { supabase } from '../services/supabase.js';
import * as ai from '../services/aiService.js';
import { getAccountBalances } from '../services/pluggyService.js';
import { checkAndCreateAlerts } from '../services/alertsService.js';

export function getProviders(req, res) {
  res.json(ai.getProvidersStatus());
}

export async function chat(req, res) {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Mensagens inválidas.' });
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    checkAndCreateAlerts(req.user.id).catch(() => {});

    const [transResult, invResult, bankAccounts, gastosResult, metasResult] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', req.user.id)
        .gte('data', start).lte('data', end).order('data', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', req.user.id),
      getAccountBalances(req.user.id).catch(() => []),
      supabase.from('gastos_fixos').select('descricao, valor, categoria, dia_vencimento, frequencia').eq('user_id', req.user.id).eq('ativo', true),
      supabase.from('metas').select('titulo, tipo, valor_alvo, valor_atual, prazo, concluida').eq('user_id', req.user.id).eq('concluida', false),
    ]);

    const transactions = transResult.data || [];
    const totalReceitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

    const saldoBancario = bankAccounts.length ? {
      contas: bankAccounts,
      totalEmConta: bankAccounts.filter(a => a.type !== 'CREDIT').reduce((s, a) => s + (a.balance || 0), 0),
    } : null;

    const userContext = {
      saldo: totalReceitas - totalDespesas,
      totalReceitas,
      totalDespesas,
      transacoesRecentes: transactions.slice(0, 10),
      investimentos: invResult.data || [],
      saldoBancario,
      gastosFixos: gastosResult.data || [],
      metas: metasResult.data || [],
    };

    const { text: response, provider, actions = [] } = await ai.chatWithAI(messages, userContext, req.user.id);

    await supabase.from('chat_messages').insert([
      { user_id: req.user.id, role: 'user', content: messages[messages.length - 1].content },
      { user_id: req.user.id, role: 'assistant', content: response },
    ]);

    res.json({ response, provider, actions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function categorize(req, res) {
  try {
    const { descricao } = req.body;
    if (!descricao) return res.status(400).json({ error: 'Descrição obrigatória.' });

    const categoria = await ai.categorizeTransaction(descricao);
    res.json({ categoria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDashboardInsight(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('tipo, valor, categoria')
      .eq('user_id', req.user.id)
      .gte('data', start)
      .lte('data', end);

    if (error) throw error;

    const receitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

    const cats = {};
    transactions.filter(t => t.tipo === 'despesa').forEach(t => {
      cats[t.categoria] = (cats[t.categoria] || 0) + t.valor;
    });
    const topCategorias = Object.entries(cats)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const { text: insight, provider } = await ai.generateDashboardInsight({
      saldo: receitas - despesas, receitas, despesas, topCategorias, transactions,
    });

    await supabase.from('ai_insights').insert({
      user_id: req.user.id, insight, tipo: 'dashboard',
    });

    res.json({ insight, provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getInvestmentsInsight(req, res) {
  try {
    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    if (!investments.length) {
      return res.json({ insight: 'Você ainda não possui investimentos cadastrados. Comece adicionando seus investimentos para receber análises personalizadas.', provider: null });
    }

    const { text: insight, provider } = await ai.analyzeInvestments(investments);

    await supabase.from('ai_insights').insert({
      user_id: req.user.id, insight, tipo: 'investimentos',
    });

    res.json({ insight, provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBusinessInsight(req, res) {
  try {
    const now = new Date();
    const mes = Number(req.query.mes) || (now.getMonth() + 1);
    const ano = Number(req.query.ano) || now.getFullYear();

    const start = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const end = new Date(ano, mes, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('business_entries')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('data', start)
      .lte('data', end);

    if (error) throw error;

    const receitas = data.filter(e => e.tipo === 'receita').reduce((s, e) => s + e.valor, 0);
    const despesas = data.filter(e => e.tipo === 'despesa').reduce((s, e) => s + e.valor, 0);
    const cats = {};
    data.filter(e => e.tipo === 'despesa').forEach(e => {
      cats[e.categoria] = (cats[e.categoria] || 0) + e.valor;
    });
    const categorias = Object.entries(cats).map(([categoria, total]) => ({ categoria, total }));
    const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const { text: insight, provider } = await ai.generateBusinessReport({
      receitas, despesas, lucro: receitas - despesas, categorias, mes: nomeMes,
    });

    res.json({ insight, provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function predictCashFlow(req, res) {
  try {
    const now = new Date();
    const historico = [];

    for (let i = 3; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from('business_entries')
        .select('tipo, valor')
        .eq('user_id', req.user.id)
        .gte('data', start)
        .lte('data', end);

      const receitas = (data || []).filter(e => e.tipo === 'receita').reduce((s, e) => s + e.valor, 0);
      const despesas = (data || []).filter(e => e.tipo === 'despesa').reduce((s, e) => s + e.valor, 0);
      historico.push({
        mes: date.toLocaleString('pt-BR', { month: 'long', year: '2-digit' }),
        receitas,
        despesas,
      });
    }

    const mediaEntradas = historico.reduce((s, h) => s + h.receitas, 0) / 3;
    const mediaSaidas = historico.reduce((s, h) => s + h.despesas, 0) / 3;

    const startMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data: mesAtual } = await supabase
      .from('business_entries')
      .select('tipo, valor')
      .eq('user_id', req.user.id)
      .gte('data', startMes)
      .lte('data', endMes);

    const saldoAtual = (mesAtual || []).reduce((s, e) => {
      return e.tipo === 'receita' ? s + e.valor : s - e.valor;
    }, 0);

    const { text: insight, provider } = await ai.predictCashFlow({
      entradas: mediaEntradas,
      saidas: mediaSaidas,
      saldoAtual,
      historico,
    });

    res.json({ insight, provider, historico, mediaEntradas, mediaSaidas, saldoAtual });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
