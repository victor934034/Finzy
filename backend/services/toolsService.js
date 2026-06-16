import { supabase } from './supabase.js';
import { getAccountBalances } from './pluggyService.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'criar_transacao',
    description: 'Cria uma nova transação financeira (gasto ou receita) para o usuário. Use quando o usuário mencionar que gastou ou recebeu algo.',
    parameters: {
      descricao: { type: 'string', description: 'Descrição do gasto ou receita (ex: "Almoço", "Salário")' },
      valor: { type: 'number', description: 'Valor em reais, sempre positivo' },
      tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'despesa para gastos, receita para entradas de dinheiro' },
      categoria: { type: 'string', enum: ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'], description: 'Categoria mais adequada' },
      data: { type: 'string', description: 'Data no formato YYYY-MM-DD. Omita para usar hoje.' },
    },
    required: ['descricao', 'valor', 'tipo'],
  },
  {
    name: 'listar_transacoes',
    description: 'Lista transações do usuário. Use sempre antes de atualizar ou excluir para obter o ID correto.',
    parameters: {
      limite: { type: 'number', description: 'Máximo de resultados (padrão 20)' },
      tipo: { type: 'string', enum: ['receita', 'despesa'] },
      categoria: { type: 'string' },
      data_inicio: { type: 'string', description: 'YYYY-MM-DD' },
      data_fim: { type: 'string', description: 'YYYY-MM-DD' },
      busca: { type: 'string', description: 'Texto para buscar na descrição' },
    },
    required: [],
  },
  {
    name: 'atualizar_transacao',
    description: 'Atualiza descrição, valor, data, tipo ou categoria de uma transação existente.',
    parameters: {
      id: { type: 'string', description: 'ID da transação (use listar_transacoes para encontrar)' },
      descricao: { type: 'string' },
      valor: { type: 'number', description: 'Novo valor em reais' },
      tipo: { type: 'string', enum: ['receita', 'despesa'] },
      categoria: { type: 'string', enum: ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'] },
      data: { type: 'string', description: 'Nova data YYYY-MM-DD' },
    },
    required: ['id'],
  },
  {
    name: 'consultar_saldo_bancario',
    description: 'Consulta o saldo real nas contas bancárias conectadas via Pluggy Open Finance. Use quando o usuário perguntar quanto tem no banco, qual o saldo bancário, quanto de dinheiro tem disponível na conta, etc.',
    parameters: {},
    required: [],
  },
  {
    name: 'excluir_transacao',
    description: 'Exclui permanentemente uma transação. Confirme com o usuário antes de usar.',
    parameters: {
      id: { type: 'string', description: 'ID da transação a excluir' },
    },
    required: ['id'],
  },
  {
    name: 'listar_gastos_fixos',
    description: 'Lista os gastos fixos (despesas recorrentes) do usuário, como aluguel, assinaturas, mensalidades.',
    parameters: {},
    required: [],
  },
  {
    name: 'listar_metas',
    description: 'Lista as metas financeiras do usuário com progresso atual.',
    parameters: {},
    required: [],
  },
  {
    name: 'criar_meta',
    description: 'Cria uma nova meta financeira para o usuário.',
    parameters: {
      titulo: { type: 'string', description: 'Nome da meta (ex: "Viagem para Europa")' },
      tipo: { type: 'string', enum: ['poupança', 'quitar_dívida', 'compra', 'investimento', 'viagem', 'emergência', 'outros'], description: 'Tipo da meta' },
      valor_alvo: { type: 'number', description: 'Valor total a ser atingido em reais' },
      prazo: { type: 'string', description: 'Data limite no formato YYYY-MM-DD (opcional)' },
      descricao: { type: 'string', description: 'Descrição adicional (opcional)' },
    },
    required: ['titulo', 'valor_alvo'],
  },
  {
    name: 'atualizar_progresso_meta',
    description: 'Adiciona um valor ao progresso de uma meta financeira existente.',
    parameters: {
      id: { type: 'string', description: 'ID da meta (use listar_metas para encontrar)' },
      valor: { type: 'number', description: 'Valor a adicionar ao progresso em reais' },
    },
    required: ['id', 'valor'],
  },
  {
    name: 'criar_notificacao',
    description: 'Cria uma notificação personalizada para lembrar o usuário de algo importante.',
    parameters: {
      titulo: { type: 'string', description: 'Título curto da notificação' },
      mensagem: { type: 'string', description: 'Mensagem detalhada' },
      tipo: { type: 'string', enum: ['alerta', 'meta', 'gasto_fixo', 'info'], description: 'Tipo da notificação' },
    },
    required: ['titulo', 'mensagem'],
  },
];

export async function executeTool(name, args, userId) {
  switch (name) {
    case 'criar_transacao': {
      const row = {
        user_id: userId,
        descricao: String(args.descricao || '').slice(0, 255),
        valor: Math.abs(Number(args.valor) || 0),
        tipo: args.tipo === 'receita' ? 'receita' : 'despesa',
        categoria: args.categoria || 'Outros',
        data: args.data || new Date().toISOString().split('T')[0],
      };
      if (!row.valor) return { sucesso: false, erro: 'Valor inválido.' };
      const { data, error } = await supabase.from('transactions').insert(row).select('id').single();
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, id: data.id, mensagem: `Transação criada: "${row.descricao}" R$ ${row.valor.toFixed(2)} (${row.tipo}) em ${row.data}` };
    }

    case 'listar_transacoes': {
      let q = supabase.from('transactions')
        .select('id, descricao, valor, tipo, categoria, data')
        .eq('user_id', userId)
        .order('data', { ascending: false })
        .limit(args.limite || 20);
      if (args.tipo) q = q.eq('tipo', args.tipo);
      if (args.categoria) q = q.eq('categoria', args.categoria);
      if (args.data_inicio) q = q.gte('data', args.data_inicio);
      if (args.data_fim) q = q.lte('data', args.data_fim);
      if (args.busca) q = q.ilike('descricao', `%${args.busca}%`);
      const { data, error } = await q;
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, total: data.length, transacoes: data };
    }

    case 'atualizar_transacao': {
      const { id, ...fields } = args;
      const updates = {};
      if (fields.descricao !== undefined) updates.descricao = String(fields.descricao).slice(0, 255);
      if (fields.valor !== undefined) updates.valor = Math.abs(Number(fields.valor));
      if (fields.tipo !== undefined) updates.tipo = fields.tipo;
      if (fields.categoria !== undefined) updates.categoria = fields.categoria;
      if (fields.data !== undefined) updates.data = fields.data;
      if (!Object.keys(updates).length) return { sucesso: false, erro: 'Nenhum campo para atualizar.' };
      const { error } = await supabase.from('transactions').update(updates).eq('id', id).eq('user_id', userId);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, mensagem: `Transação ${id} atualizada.` };
    }

    case 'excluir_transacao': {
      const { error } = await supabase.from('transactions').delete().eq('id', args.id).eq('user_id', userId);
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, mensagem: 'Transação excluída.' };
    }

    case 'listar_gastos_fixos': {
      const { data, error } = await supabase
        .from('gastos_fixos')
        .select('id, descricao, valor, categoria, dia_vencimento, frequencia, ativo')
        .eq('user_id', userId)
        .order('dia_vencimento', { ascending: true });
      if (error) return { sucesso: false, erro: error.message };
      const ativos = (data || []).filter(g => g.ativo);
      const totalMensal = ativos.reduce((s, g) => s + Number(g.valor), 0);
      const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      return { sucesso: true, total: data.length, ativos: ativos.length, totalMensalAtivos: totalMensal, totalMensalAtivosFormatado: fmt(totalMensal), gastos: data };
    }

    case 'listar_metas': {
      const { data, error } = await supabase
        .from('metas')
        .select('id, titulo, tipo, valor_alvo, valor_atual, prazo, concluida')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return { sucesso: false, erro: error.message };
      const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const metas = (data || []).map(m => ({
        ...m,
        progresso_pct: Math.round((Number(m.valor_atual) / Number(m.valor_alvo)) * 100),
        falta: fmt(Math.max(0, Number(m.valor_alvo) - Number(m.valor_atual))),
      }));
      return { sucesso: true, total: metas.length, metas };
    }

    case 'criar_meta': {
      const row = {
        user_id: userId,
        titulo: String(args.titulo || '').slice(0, 100),
        tipo: args.tipo || 'outros',
        valor_alvo: Math.abs(Number(args.valor_alvo) || 0),
        valor_atual: 0,
        descricao: args.descricao || null,
        prazo: args.prazo || null,
      };
      if (!row.valor_alvo) return { sucesso: false, erro: 'Valor alvo inválido.' };
      const { data, error } = await supabase.from('metas').insert(row).select('id').single();
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, id: data.id, mensagem: `Meta criada: "${row.titulo}" — alvo: R$ ${row.valor_alvo.toFixed(2)}` };
    }

    case 'atualizar_progresso_meta': {
      const { data: meta, error: fetchErr } = await supabase
        .from('metas').select('valor_atual, valor_alvo').eq('id', args.id).eq('user_id', userId).single();
      if (fetchErr || !meta) return { sucesso: false, erro: 'Meta não encontrada.' };
      const novoValor = Math.min(Number(meta.valor_atual) + Number(args.valor), Number(meta.valor_alvo));
      const concluida = novoValor >= Number(meta.valor_alvo);
      const { error } = await supabase.from('metas').update({ valor_atual: novoValor, concluida }).eq('id', args.id).eq('user_id', userId);
      if (error) return { sucesso: false, erro: error.message };
      const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      return { sucesso: true, mensagem: concluida ? `Meta concluída! Valor: ${fmt(novoValor)}` : `Progresso atualizado: ${fmt(novoValor)} de ${fmt(meta.valor_alvo)} (${Math.round((novoValor / Number(meta.valor_alvo)) * 100)}%)` };
    }

    case 'criar_notificacao': {
      const { error } = await supabase.from('notificacoes').insert({
        user_id: userId,
        titulo: String(args.titulo || '').slice(0, 100),
        mensagem: String(args.mensagem || ''),
        tipo: args.tipo || 'info',
      });
      if (error) return { sucesso: false, erro: error.message };
      return { sucesso: true, mensagem: 'Notificação criada.' };
    }

    case 'consultar_saldo_bancario': {
      try {
        const accounts = await getAccountBalances(userId);
        if (!accounts.length) return { sucesso: true, mensagem: 'Nenhuma conta bancária conectada. Vá em Integrações > Banco Direto para conectar.', contas: [] };
        const totalEmConta = accounts.filter(a => a.type !== 'CREDIT').reduce((s, a) => s + (a.balance || 0), 0);
        const fmtBRL = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const linhas = accounts.map(a => `${a.name} (${a.type === 'CREDIT' ? 'Cartão' : 'Conta'}): ${fmtBRL(a.balance)}`).join('; ');
        return { sucesso: true, mensagem: `${linhas}. Total em conta corrente/poupança: ${fmtBRL(totalEmConta)}`, contas: accounts, totalEmConta };
      } catch (e) { return { sucesso: false, erro: e.message }; }
    }

    default:
      return { sucesso: false, erro: `Ferramenta desconhecida: ${name}` };
  }
}

// Convert neutral tool defs to provider-specific formats
export function toClaudeTools(defs) {
  return defs.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object',
      properties: t.parameters,
      required: t.required,
    },
  }));
}

export function toOpenAITools(defs) {
  return defs.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: { type: 'object', properties: t.parameters, required: t.required },
    },
  }));
}

export function toGeminiTools(defs) {
  const toGeminiType = (t) => ({ number: 'NUMBER', string: 'STRING', boolean: 'BOOLEAN' }[t] || 'STRING');
  return [{
    functionDeclarations: defs.map(t => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: 'OBJECT',
        properties: Object.fromEntries(Object.entries(t.parameters).map(([k, v]) => [k, {
          type: toGeminiType(v.type),
          description: v.description || '',
          ...(v.enum ? { enum: v.enum } : {}),
        }])),
        required: t.required,
      },
    })),
  }];
}
