import { supabase } from '../services/supabase.js';

export async function list(req, res) {
  try {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const { titulo, descricao, tipo, valor_alvo, valor_atual, prazo, concluida } = req.body;

    if (!titulo || !valor_alvo || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios: titulo, valor_alvo, tipo.' });
    }

    const { data, error } = await supabase
      .from('metas')
      .insert({
        user_id: req.user.id,
        titulo: String(titulo).slice(0, 100),
        descricao: descricao || null,
        tipo: tipo || 'outros',
        valor_alvo: Math.abs(Number(valor_alvo)),
        valor_atual: valor_atual !== undefined ? Math.abs(Number(valor_atual)) : 0,
        prazo: prazo || null,
        concluida: concluida !== undefined ? Boolean(concluida) : false,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates = {};
    if (body.titulo !== undefined) updates.titulo = String(body.titulo).slice(0, 255);
    if (body.descricao !== undefined) updates.descricao = body.descricao;
    if (body.tipo !== undefined) updates.tipo = body.tipo;
    if (body.valor_alvo !== undefined) updates.valor_alvo = Math.abs(Number(body.valor_alvo));
    if (body.valor_atual !== undefined) updates.valor_atual = Math.abs(Number(body.valor_atual));
    if (body.prazo !== undefined) updates.prazo = body.prazo;
    if (body.concluida !== undefined) updates.concluida = Boolean(body.concluida);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    const { data, error } = await supabase
      .from('metas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Meta não encontrada.' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Meta excluída com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addProgress(req, res) {
  try {
    const { id } = req.params;
    const { valor } = req.body;
    if (!valor || Number(valor) <= 0) return res.status(400).json({ error: 'Valor inválido.' });

    const { data: meta, error: fetchErr } = await supabase
      .from('metas')
      .select('valor_atual, valor_alvo')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    if (fetchErr || !meta) return res.status(404).json({ error: 'Meta não encontrada.' });

    const novoValor = Math.min(Number(meta.valor_atual) + Number(valor), Number(meta.valor_alvo));
    const concluida = novoValor >= Number(meta.valor_alvo);

    const { data, error } = await supabase
      .from('metas')
      .update({ valor_atual: novoValor, concluida })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
