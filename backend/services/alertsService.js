import { supabase } from './supabase.js';

export async function checkAndCreateAlerts(userId) {
  try {
    await Promise.all([
      checkGastosFixos(userId),
      checkMetas(userId),
    ]);
  } catch (_) {}
}

async function checkGastosFixos(userId) {
  const today = new Date();
  const todayDay = today.getDate();

  const { data: gastos } = await supabase
    .from('gastos_fixos')
    .select('id, descricao, valor, dia_vencimento')
    .eq('user_id', userId)
    .eq('ativo', true);

  if (!gastos?.length) return;

  for (const gasto of gastos) {
    const diasAteVencimento = gasto.dia_vencimento - todayDay;
    if (diasAteVencimento < 0 || diasAteVencimento > 5) continue;

    // Avoid duplicate notifications on the same day for the same expense
    const { data: existing } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', 'gasto_fixo')
      .ilike('mensagem', `%${gasto.id}%`)
      .gte('created_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
      .limit(1);

    if (existing?.length) continue;

    const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const texto = diasAteVencimento === 0
      ? `Vence hoje: ${gasto.descricao} — ${fmt(gasto.valor)}`
      : `Vence em ${diasAteVencimento} dia(s): ${gasto.descricao} — ${fmt(gasto.valor)}`;

    await supabase.from('notificacoes').insert({
      user_id: userId,
      titulo: 'Gasto fixo próximo do vencimento',
      mensagem: `${texto} [ref:${gasto.id}]`,
      tipo: 'gasto_fixo',
    });
  }
}

async function checkMetas(userId) {
  const today = new Date();
  const em7Dias = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const hoje = today.toISOString().split('T')[0];

  const { data: metas } = await supabase
    .from('metas')
    .select('id, titulo, valor_alvo, valor_atual, prazo')
    .eq('user_id', userId)
    .eq('concluida', false)
    .not('prazo', 'is', null)
    .lte('prazo', em7Dias)
    .gte('prazo', hoje);

  if (!metas?.length) return;

  for (const meta of metas) {
    const { data: existing } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', 'meta')
      .ilike('mensagem', `%${meta.id}%`)
      .gte('created_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
      .limit(1);

    if (existing?.length) continue;

    const pct = Math.round((Number(meta.valor_atual) / Number(meta.valor_alvo)) * 100);
    const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const diasRestantes = Math.ceil((new Date(meta.prazo) - today) / (1000 * 60 * 60 * 24));

    await supabase.from('notificacoes').insert({
      user_id: userId,
      titulo: 'Meta próxima do prazo',
      mensagem: `"${meta.titulo}" vence em ${diasRestantes} dia(s). Progresso: ${pct}% (${fmt(meta.valor_atual)} de ${fmt(meta.valor_alvo)}) [ref:${meta.id}]`,
      tipo: 'meta',
    });
  }
}
