import { supabase } from '../services/supabase.js';

export async function getSummary(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [transResult, invResult, recentResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('tipo, valor, categoria')
        .eq('user_id', req.user.id)
        .gte('data', start)
        .lte('data', end),
      supabase
        .from('investments')
        .select('valor_investido, valor_atual')
        .eq('user_id', req.user.id),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', req.user.id)
        .order('data', { ascending: false })
        .limit(10),
    ]);

    if (transResult.error) throw transResult.error;
    if (invResult.error) throw invResult.error;
    if (recentResult.error) throw recentResult.error;

    const transactions = transResult.data;
    const receitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

    const categorias = {};
    transactions.filter(t => t.tipo === 'despesa').forEach(t => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });
    const topCategorias = Object.entries(categorias)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const totalInvestido = invResult.data.reduce((s, i) => s + i.valor_investido, 0);
    const totalAtual = invResult.data.reduce((s, i) => s + (i.valor_atual || i.valor_investido), 0);

    res.json({
      receitas,
      despesas,
      saldo: receitas - despesas,
      topCategorias,
      transacoesRecentes: recentResult.data,
      investimentos: { totalInvestido, totalAtual, rentabilidade: totalInvestido > 0 ? ((totalAtual - totalInvestido) / totalInvestido * 100) : 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMonthlyChart(req, res) {
  try {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('tipo, valor')
        .eq('user_id', req.user.id)
        .gte('data', start)
        .lte('data', end);

      if (error) throw error;

      const receitas = data.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
      const despesas = data.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

      months.push({
        mes: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas,
        despesas,
      });
    }

    res.json({ data: months });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
