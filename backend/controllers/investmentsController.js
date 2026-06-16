import { supabase } from '../services/supabase.js';
import { validDate, validMoney, validStr } from '../utils/validate.js';

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

    const erros = [];

    const nomeVal = validStr(nome, 100);
    if (!nomeVal) erros.push('nome é obrigatório (máx 100 caracteres)');

    const tipoVal = validStr(tipo, 50);
    if (!tipoVal) erros.push('tipo é obrigatório (máx 50 caracteres)');

    if (!validMoney(valor_investido) || Number(valor_investido) <= 0)
      erros.push('valor_investido deve ser um número positivo');

    if (valor_atual !== undefined && !validMoney(valor_atual))
      erros.push('valor_atual inválido');

    if (!data_inicio || !validDate(data_inicio))
      erros.push('data_inicio inválida — use YYYY-MM-DD com ano de 4 dígitos, mês e dia com 2 dígitos');

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });

    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: req.user.id,
        nome: nomeVal,
        tipo: tipoVal,
        valor_investido: Number(valor_investido),
        valor_atual: valor_atual !== undefined ? Number(valor_atual) : Number(valor_investido),
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
    const { nome, tipo, valor_investido, valor_atual, data_inicio } = req.body;

    const updates = {};
    const erros = [];

    if (nome !== undefined) {
      const v = validStr(nome, 100);
      if (!v) erros.push('nome inválido');
      else updates.nome = v;
    }
    if (tipo !== undefined) {
      const v = validStr(tipo, 50);
      if (!v) erros.push('tipo inválido');
      else updates.tipo = v;
    }
    if (valor_investido !== undefined) {
      if (!validMoney(valor_investido) || Number(valor_investido) <= 0) erros.push('valor_investido inválido');
      else updates.valor_investido = Number(valor_investido);
    }
    if (valor_atual !== undefined) {
      if (!validMoney(valor_atual)) erros.push('valor_atual inválido');
      else updates.valor_atual = Number(valor_atual);
    }
    if (data_inicio !== undefined) {
      if (!validDate(data_inicio)) erros.push('data_inicio inválida — use YYYY-MM-DD com ano de 4 dígitos');
      else updates.data_inicio = data_inicio;
    }

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

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
