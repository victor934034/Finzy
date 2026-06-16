import { PluggyClient } from 'pluggy-sdk';
import { supabase } from './supabase.js';

function client() {
  return new PluggyClient({
    clientId: process.env.PLUGGY_CLIENT_ID,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET,
  });
}

export async function createConnectToken(userId) {
  const token = await client().createConnectToken(undefined, { clientUserId: userId });
  return token.accessToken;
}

export async function saveItem(userId, itemId) {
  const { data } = await supabase.from('integration_tokens').select('metadata')
    .eq('user_id', userId).eq('provider', 'pluggy').single();
  const items = [...new Set([...(data?.metadata?.items || []), itemId])];
  await supabase.from('integration_tokens').upsert({
    user_id: userId, provider: 'pluggy',
    access_token: null, refresh_token: null,
    metadata: { ...(data?.metadata || {}), items },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });
}

export async function fetchTransactions(userId, daysBack = 30) {
  const { data } = await supabase.from('integration_tokens').select('metadata')
    .eq('user_id', userId).eq('provider', 'pluggy').single();
  if (!data?.metadata?.items?.length) throw new Error('Nenhuma conta conectada via Pluggy.');

  const pluggy = client();
  const from = new Date(Date.now() - daysBack * 864e5).toISOString().split('T')[0];
  const all = [];

  for (const itemId of data.metadata.items) {
    const accounts = await pluggy.fetchAccounts(itemId);
    for (const acc of accounts.results || []) {
      const txPage = await pluggy.fetchTransactions(acc.id, { from, pageSize: 100 });
      for (const tx of txPage.results || []) {
        all.push({
          descricao: tx.description || tx.merchant?.name || 'Transação',
          valor: Math.abs(tx.amount),
          tipo: tx.amount < 0 ? 'despesa' : 'receita',
          data: (tx.date || '').split('T')[0] || new Date().toISOString().split('T')[0],
          categoria: mapCategory(tx.category),
          fonte: 'pluggy',
        });
      }
    }
  }
  return all;
}

function mapCategory(c) {
  if (!c) return 'Outros';
  const l = c.toLowerCase();
  if (l.includes('food') || l.includes('restaurant') || l.includes('alimenta')) return 'Alimentação';
  if (l.includes('transport') || l.includes('auto') || l.includes('fuel') || l.includes('gas')) return 'Transporte';
  if (l.includes('health') || l.includes('saude') || l.includes('medical') || l.includes('farm')) return 'Saúde';
  if (l.includes('entertain') || l.includes('leisure') || l.includes('lazer') || l.includes('gym')) return 'Lazer';
  if (l.includes('invest') || l.includes('saving')) return 'Investimentos';
  if (l.includes('business') || l.includes('service') || l.includes('negoc')) return 'Negócio';
  return 'Outros';
}

export async function getAccountBalances(userId) {
  const { data } = await supabase.from('integration_tokens').select('metadata')
    .eq('user_id', userId).eq('provider', 'pluggy').single();
  if (!data?.metadata?.items?.length) return [];

  const pluggy = client();
  const accounts = [];

  for (const itemId of data.metadata.items) {
    try {
      const result = await pluggy.fetchAccounts(itemId);
      for (const acc of result.results || []) {
        accounts.push({
          itemId,
          id: acc.id,
          name: acc.name,
          type: acc.type,         // 'BANK' | 'CREDIT'
          subtype: acc.subtype,
          number: acc.number,
          balance: acc.balance || 0,
          currencyCode: acc.currencyCode || 'BRL',
        });
      }
    } catch { /* item may be expired — skip silently */ }
  }
  return accounts;
}

export async function getStatus(userId) {
  const { data } = await supabase.from('integration_tokens').select('metadata,updated_at')
    .eq('user_id', userId).eq('provider', 'pluggy').single();
  return {
    connected: !!(data?.metadata?.items?.length),
    itemCount: data?.metadata?.items?.length || 0,
    lastSync: data?.metadata?.lastSync || null,
  };
}

export async function removeItem(userId, itemId) {
  const { data } = await supabase.from('integration_tokens').select('metadata')
    .eq('user_id', userId).eq('provider', 'pluggy').single();
  if (!data) return;
  const items = (data.metadata?.items || []).filter(id => id !== itemId);
  await supabase.from('integration_tokens').update({
    metadata: { ...data.metadata, items },
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', 'pluggy');
}
