import { supabase } from '../services/supabase.js';
import { validDate, validMoney, validStr, validEnum, validInt } from '../utils/validate.js';

const TIPOS = ['receita', 'despesa'];
const CATEGORIAS = ['Vendas', 'Serviços', 'Salários', 'Aluguel', 'Marketing', 'Impostos', 'Fornecedores', 'Outros'];

export async function getBusinessEntries(req, res) {
  try {
    const { mes, ano, tipo } = req.query;
    let query = supabase
      .from('business_entries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('data', { ascending: false });

    if (mes && ano) {
      const mesNum = validInt(mes, 1, 12);
      const anoNum = validInt(ano, 1900, 2100);
      if (mesNum && anoNum) {
        const start = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
        const end = new Date(anoNum, mesNum, 0).toISOString().split('T')[0];
        query = query.gte('data', start).lte('data', end);
      }
    }

    if (tipo && TIPOS.includes(tipo)) query = query.eq('tipo', tipo);

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

    const erros = [];

    const tipoVal = validEnum(tipo, TIPOS);
    if (!tipoVal) erros.push('tipo deve ser "receita" ou "despesa"');

    if (!validMoney(valor) || Number(valor) <= 0) erros.push('valor deve ser um número positivo');

    const descricaoVal = validStr(descricao, 255);
    if (!descricaoVal) erros.push('descricao é obrigatória (máx 255 caracteres)');

    if (!data || !validDate(data)) erros.push('data inválida — use YYYY-MM-DD com ano de 4 dígitos, mês e dia com 2 dígitos');

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });

    const categoriaFinal = categoria && CATEGORIAS.includes(categoria) ? categoria : 'Outros';

    const { data: entry, error } = await supabase
      .from('business_entries')
      .insert({
        user_id: req.user.id,
        tipo: tipoVal,
        valor: Number(valor),
        categoria: categoriaFinal,
        descricao: descricaoVal,
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
      else updates.valor = Number(valor);
    }
    if (categoria !== undefined) {
      updates.categoria = CATEGORIAS.includes(categoria) ? categoria : 'Outros';
    }
    if (descricao !== undefined) {
      const v = validStr(descricao, 255);
      if (!v) erros.push('descricao inválida');
      else updates.descricao = v;
    }
    if (data !== undefined) {
      if (!validDate(data)) erros.push('data inválida — use YYYY-MM-DD com ano de 4 dígitos');
      else updates.data = data;
    }

    if (erros.length) return res.status(400).json({ error: erros.join('. ') });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

    const { data: result, error } = await supabase
      .from('business_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!result) return res.status(404).json({ error: 'Lançamento não encontrado.' });

    res.json({ data: result });
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
    const mesNum = validInt(req.query.mes, 1, 12) || (now.getMonth() + 1);
    const anoNum = validInt(req.query.ano, 1900, 2100) || now.getFullYear();

    const start = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
    const end = new Date(anoNum, mesNum, 0).toISOString().split('T')[0];

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

    res.json({ receitas, despesas, lucro, categorias, entries: data, mes: mesNum, ano: anoNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
