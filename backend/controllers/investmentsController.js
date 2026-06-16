import { supabase } from '../services/supabase.js';

export async function getInvestments(req, res) {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createInvestment(req, res) {
  try {
    const { nome, tipo, valor_investido, valor_atual, data_inicio } = req.body;

    if (!nome || !tipo || !valor_investido || !data_inicio) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, tipo, valor_investido, data_inicio.' });
    }

    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: req.user.id,
        nome,
        tipo,
        valor_investido: Number(valor_investido),
        valor_atual: valor_atual ? Number(valor_atual) : Number(valor_investido),
        data_inicio,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateInvestment(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('investments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Investimento não encontrado.' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteInvestment(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Investimento excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
