import { supabase } from '../services/supabase.js';

export async function getTrends(req, res) {
  try {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    }

    const results = await Promise.all(
      months.map(({ start, end }) =>
        supabase.from('transactions').select('tipo, valor')
          .eq('user_id', req.user.id).gte('data', start).lte('data', end)
      )
    );

    const data = months.map(({ label }, i) => {
      const rows = results[i].data || [];
      return {
        mes: label,
        receitas: rows.filter(r => r.tipo === 'receita').reduce((s, r) => s + r.valor, 0),
        despesas: rows.filter(r => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0),
      };
    });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCategories(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('categoria, valor, tipo')
      .eq('user_id', req.user.id)
      .eq('tipo', 'despesa')
      .gte('data', start)
      .lte('data', end);

    if (error) throw error;

    const cats = {};
    (data || []).forEach(t => {
      cats[t.categoria] = (cats[t.categoria] || 0) + t.valor;
    });

    const categorias = Object.entries(cats)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);

    res.json({ categorias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getForecast(req, res) {
  try {
    const now = new Date();
    const historico = [];

    for (let i = 3; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data } = await supabase.from('transactions').select('tipo, valor')
        .eq('user_id', req.user.id).gte('data', start).lte('data', end);
      const rows = data || [];
      historico.push({
        receitas: rows.filter(r => r.tipo === 'receita').reduce((s, r) => s + r.valor, 0),
        despesas: rows.filter(r => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0),
      });
    }

    const mediaReceitas = historico.reduce((s, h) => s + h.receitas, 0) / 3;
    const mediaDespesas = historico.reduce((s, h) => s + h.despesas, 0) / 3;
    const saldoPrevisto = mediaReceitas - mediaDespesas;

    const mesAtualStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const mesAtualEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data: atual } = await supabase.from('transactions').select('tipo, valor')
      .eq('user_id', req.user.id).gte('data', mesAtualStart).lte('data', mesAtualEnd);
    const atualRows = atual || [];
    const receitasAtuais = atualRows.filter(r => r.tipo === 'receita').reduce((s, r) => s + r.valor, 0);
    const despesasAtuais = atualRows.filter(r => r.tipo === 'despesa').reduce((s, r) => s + r.valor, 0);

    const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const diaAtual = now.getDate();
    const proporcao = diaAtual / diasNoMes;
    const despesasProjetadas = proporcao > 0 ? despesasAtuais / proporcao : mediaDespesas;

    res.json({
      mediaReceitas: Math.round(mediaReceitas * 100) / 100,
      mediaDespesas: Math.round(mediaDespesas * 100) / 100,
      saldoPrevisto: Math.round(saldoPrevisto * 100) / 100,
      mesAtual: {
        receitas: Math.round(receitasAtuais * 100) / 100,
        despesas: Math.round(despesasAtuais * 100) / 100,
        despesasProjetadas: Math.round(despesasProjetadas * 100) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
