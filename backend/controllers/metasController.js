import { supabase } from '../services/supabase.js';
import { validDate, validMoney, validStr, validEnum } from '../utils/validate.js';

const TIPOS = ['poupança', 'quitar_dívida', 'compra', 'investimento', 'viagem', 'emergência', 'outros'];

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
    const { titulo, descricao, tipo, valor_alvo, valor_atual, prazo } = req.body;

    const erros = [];

    const tituloVal = validStr(titulo, 100);
    if (!tituloVal) erros.push('titulo é obrigatório (máx 100 caracteres)');

    if (!validMoney(valor_alvo) || Number(valor_alvo) <= 0) erros.push('valor_alvo deve ser um número positivo');

    const tipoVal = validEnum(tipo || 'outros', TIPOS);
    if (!tipoVal) erros.push(`tipo inválido. Opções: ${TIPOS.join(', ')}`);

    if (prazo && !validDate(prazo)) erros.push('prazo inválido — use YYYY-MM-DD com ano de 4 dígitos, mês e dia com 2 dígitos');

    if (valor_atual !== undefined && !validMoney(valor_atual)) erros.push('valor_atual inválido');

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });

    const { data, error } = await supabase
      .from('metas')
      .insert({
        user_id: req.user.id,
        titulo: tituloVal,
        descricao: descricao ? validStr(descricao, 500) : null,
        tipo: tipoVal,
        valor_alvo: Number(valor_alvo),
        valor_atual: valor_atual !== undefined ? Math.abs(Number(valor_atual)) : 0,
        prazo: prazo || null,
        concluida: false,
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
    const { titulo, descricao, tipo, valor_alvo, valor_atual, prazo, concluida } = req.body;

    const updates = {};
    const erros = [];

    if (titulo !== undefined) {
      const v = validStr(titulo, 100);
      if (!v) erros.push('titulo inválido');
      else updates.titulo = v;
    }
    if (descricao !== undefined) {
      updates.descricao = descricao ? (validStr(descricao, 500) || null) : null;
    }
    if (tipo !== undefined) {
      const v = validEnum(tipo, TIPOS);
      if (!v) erros.push(`tipo inválido`);
      else updates.tipo = v;
    }
    if (valor_alvo !== undefined) {
      if (!validMoney(valor_alvo) || Number(valor_alvo) <= 0) erros.push('valor_alvo inválido');
      else updates.valor_alvo = Number(valor_alvo);
    }
    if (valor_atual !== undefined) {
      if (!validMoney(valor_atual)) erros.push('valor_atual inválido');
      else updates.valor_atual = Number(valor_atual);
    }
    if (prazo !== undefined) {
      if (prazo && !validDate(prazo)) erros.push('prazo inválido — use YYYY-MM-DD com ano de 4 dígitos');
      else updates.prazo = prazo || null;
    }
    if (concluida !== undefined) updates.concluida = Boolean(concluida);

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

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

    if (!validMoney(valor) || Number(valor) <= 0)
      return res.status(400).json({ error: 'valor deve ser um número positivo.' });

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
