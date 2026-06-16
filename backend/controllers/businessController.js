import { supabase } from '../services/supabase.js';

export async function getBusinessEntries(req, res) {
  try {
    const { mes, ano, tipo } = req.query;
    let query = supabase
      .from('business_entries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false });

    if (mes && ano) {
      const start = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const end = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
      query = query.gte('data', start).lte('data', end);
    }

    if (tipo) query = query.eq('tipo', tipo);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBusinessEntry(req, res) {
  try {
    const { tipo, valor, categoria, descricao, data } = req.body;

    if (!tipo || !valor || !descricao || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, descrição, data.' });
    }

    const { data: entry, error } = await supabase
      .from('business_entries')
      .insert({
        user_id: req.user.id,
        tipo,
        valor: Number(valor),
        categoria: categoria || 'Outros',
        descricao,
        data,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data: entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateBusinessEntry(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('business_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lançamento não encontrado.' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteBusinessEntry(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('business_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Lançamento excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMonthlyReport(req, res) {
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
    const lucro = receitas - despesas;

    const cats = {};
    data.filter(e => e.tipo === 'despesa').forEach(e => {
      cats[e.categoria] = (cats[e.categoria] || 0) + e.valor;
    });
    const categorias = Object.entries(cats)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);

    res.json({ receitas, despesas, lucro, categorias, entries: data, mes, ano });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
