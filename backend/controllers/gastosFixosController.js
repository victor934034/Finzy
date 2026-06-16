import { supabase } from '../services/supabase.js';
import { validMoney, validStr, validEnum, validInt } from '../utils/validate.js';

const CATEGORIAS = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Negócio', 'Outros'];
const FREQUENCIAS = ['semanal', 'quinzenal', 'mensal', 'trimestral', 'semestral', 'anual'];

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

    const erros = [];

    const descricaoVal = validStr(descricao, 255);
    if (!descricaoVal) erros.push('descricao é obrigatória (máx 255 caracteres)');

    if (!validMoney(valor) || Number(valor) <= 0) erros.push('valor deve ser um número positivo');

    const diaVal = validInt(dia_vencimento, 1, 31);
    if (!diaVal) erros.push('dia_vencimento deve ser um número entre 1 e 31');

    const freqVal = validEnum(frequencia || 'mensal', FREQUENCIAS);
    if (!freqVal) erros.push(`frequencia inválida. Opções: ${FREQUENCIAS.join(', ')}`);

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });

    const categoriaVal = CATEGORIAS.includes(categoria) ? categoria : 'Outros';

    const { data, error } = await supabase
      .from('gastos_fixos')
      .insert({
        user_id: req.user.id,
        descricao: descricaoVal,
        valor: Number(valor),
        categoria: categoriaVal,
        dia_vencimento: diaVal,
        frequencia: freqVal,
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
    const erros = [];

    if (descricao !== undefined) {
      const v = validStr(descricao, 255);
      if (!v) erros.push('descricao inválida');
      else updates.descricao = v;
    }
    if (valor !== undefined) {
      if (!validMoney(valor) || Number(valor) <= 0) erros.push('valor inválido');
      else updates.valor = Number(valor);
    }
    if (categoria !== undefined) {
      updates.categoria = CATEGORIAS.includes(categoria) ? categoria : 'Outros';
    }
    if (dia_vencimento !== undefined) {
      const v = validInt(dia_vencimento, 1, 31);
      if (!v) erros.push('dia_vencimento deve ser entre 1 e 31');
      else updates.dia_vencimento = v;
    }
    if (frequencia !== undefined) {
      const v = validEnum(frequencia, FREQUENCIAS);
      if (!v) erros.push(`frequencia inválida`);
      else updates.frequencia = v;
    }
    if (ativo !== undefined) updates.ativo = Boolean(ativo);

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

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
