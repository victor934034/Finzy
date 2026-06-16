import { supabase } from '../services/supabase.js';
import { categorizeTransaction } from '../services/aiService.js';

export async function getTransactions(req, res) {
  try {
    const { periodo, categoria, tipo, limit = 50, offset = 0 } = req.query;
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (periodo === '7d') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      query = query.gte('data', date.toISOString().split('T')[0]);
    } else if (periodo === '30d') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      query = query.gte('data', date.toISOString().split('T')[0]);
    } else if (periodo === 'mes') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query = query.gte('data', start).lte('data', end);
    }

    if (categoria) query = query.eq('categoria', categoria);
    if (tipo) query = query.eq('tipo', tipo);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createTransaction(req, res) {
  try {
    const { tipo, valor, categoria, descricao, data } = req.body;

    if (!tipo || !valor || !descricao || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, descrição, data.' });
    }

    let categoriaFinal = categoria;
    if (!categoria || categoria === 'auto') {
      categoriaFinal = await categorizeTransaction(descricao);
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        tipo,
        valor: Number(valor),
        categoria: categoriaFinal,
        descricao,
        data,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data: transaction, categoria_sugerida: categoriaFinal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Transação não encontrada.' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Transação excluída com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMonthlySummary(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transactions')
      .select('tipo, valor, categoria')
      .eq('user_id', req.user.id)
      .gte('data', start)
      .lte('data', end);

    if (error) throw error;

    const receitas = data.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const despesas = data.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

    const categorias = {};
    data.filter(t => t.tipo === 'despesa').forEach(t => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });

    const topCategorias = Object.entries(categorias)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({ receitas, despesas, saldo: receitas - despesas, topCategorias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
