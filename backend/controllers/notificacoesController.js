import { supabase } from '../services/supabase.js';

export async function list(req, res) {
  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const naoLidas = (data || []).filter(n => !n.lida).length;
    res.json({ data, naoLidas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function markRead(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', req.user.id)
      .eq('lida', false);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
