import { supabase } from '../services/supabase.js';
import { categorizeTransaction } from '../services/aiService.js';
import { validDate, validMoney, validStr, validEnum } from '../utils/validate.js';

const TIPOS = ['receita', 'despesa'];
const CATEGORIAS = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Moradia', 'Educação', 'Outros'];

export async function getTransactions(req, res) {
  try {
    const { periodo, categoria, tipo, limit = 50, offset = 0 } = req.query;

    const lim = Math.min(Math.max(1, Number(limit) || 50), 200);
    const off = Math.max(0, Number(offset) || 0);

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false })
      .range(off, off + lim - 1);

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

    if (categoria && CATEGORIAS.includes(categoria)) query = query.eq('categoria', categoria);
    if (tipo && TIPOS.includes(tipo)) query = query.eq('tipo', tipo);

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

    const erros = [];
    const tipoVal = validEnum(tipo, TIPOS);
    if (!tipoVal) erros.push('tipo deve ser "receita" ou "despesa"');

    const valorVal = validMoney(valor);
    if (!validMoney(valor) || Number(valor) <= 0) erros.push('valor deve ser um número positivo até R$ 999.999.999,99');

    const descricaoVal = validStr(descricao, 255);
    if (!descricaoVal) erros.push('descricao é obrigatória e deve ter no máximo 255 caracteres');

    const dataVal = data ? (validDate(data) ? data : null) : new Date().toISOString().split('T')[0];
    if (data && !validDate(data)) erros.push('data inválida — use o formato YYYY-MM-DD com ano de 4 dígitos, mês e dia com 2 dígitos');

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });

    let categoriaFinal = categoria && CATEGORIAS.includes(categoria) ? categoria : null;
    if (!categoriaFinal || categoria === 'auto') {
      categoriaFinal = await categorizeTransaction(descricaoVal);
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: req.user.id,
        tipo: tipoVal,
        valor: Math.abs(Number(valor)),
        categoria: categoriaFinal || 'Outros',
        descricao: descricaoVal,
        data: dataVal,
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
    const { tipo, valor, categoria, descricao, data } = req.body;

    const updates = {};
    const erros = [];

    if (tipo !== undefined) {
      const v = validEnum(tipo, TIPOS);
      if (!v) erros.push('tipo deve ser "receita" ou "despesa"');
      else updates.tipo = v;
    }
    if (valor !== undefined) {
      if (!validMoney(valor) || Number(valor) <= 0) erros.push('valor inválido');
      else updates.valor = Math.abs(Number(valor));
    }
    if (categoria !== undefined) {
      const v = validEnum(categoria, CATEGORIAS);
      if (!v) erros.push(`categoria inválida. Opções: ${CATEGORIAS.join(', ')}`);
      else updates.categoria = v;
    }
    if (descricao !== undefined) {
      const v = validStr(descricao, 255);
      if (!v) erros.push('descricao inválida');
      else updates.descricao = v;
    }
    if (data !== undefined) {
      if (!validDate(data)) erros.push('data inválida — use YYYY-MM-DD com ano de 4 dígitos, mês e dia com 2 dígitos');
      else updates.data = data;
    }

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

    const { data: result, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!result) return res.status(404).json({ error: 'Transação não encontrada.' });

    res.json({ data: result });
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
