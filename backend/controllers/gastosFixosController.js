import { supabase } from '../services/supabase.js';

export async function list(req, res) {
  try {
    const { data, error } = await supabase
      .from('gastos_fixos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('dia_vencimento', { ascending: true });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const { descricao, valor, categoria, dia_vencimento, frequencia, ativo } = req.body;

    if (!descricao || !valor || !dia_vencimento) {
      return res.status(400).json({ error: 'Campos obrigatórios: descricao, valor, dia_vencimento.' });
    }

    const diaNum = Number(dia_vencimento);
    if (diaNum < 1 || diaNum > 31) {
      return res.status(400).json({ error: 'dia_vencimento deve estar entre 1 e 31.' });
    }

    const { data, error } = await supabase
      .from('gastos_fixos')
      .insert({
        user_id: req.user.id,
        descricao: String(descricao).slice(0, 255),
        valor: Math.abs(Number(valor)),
        categoria: categoria || 'Outros',
        dia_vencimento: diaNum,
        frequencia: frequencia || 'mensal',
        ativo: ativo !== undefined ? Boolean(ativo) : true,
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
    const { descricao, valor, categoria, dia_vencimento, frequencia, ativo } = req.body;

    const updates = {};
    if (descricao !== undefined) updates.descricao = String(descricao).slice(0, 255);
    if (valor !== undefined) updates.valor = Math.abs(Number(valor));
    if (categoria !== undefined) updates.categoria = categoria;
    if (dia_vencimento !== undefined) {
      const diaNum = Number(dia_vencimento);
      if (diaNum < 1 || diaNum > 31) return res.status(400).json({ error: 'dia_vencimento deve estar entre 1 e 31.' });
      updates.dia_vencimento = diaNum;
    }
    if (frequencia !== undefined) updates.frequencia = frequencia;
    if (ativo !== undefined) updates.ativo = Boolean(ativo);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    const { data, error } = await supabase
      .from('gastos_fixos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Gasto fixo não encontrado.' });

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('gastos_fixos')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Gasto fixo excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
