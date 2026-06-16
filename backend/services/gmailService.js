import { google } from 'googleapis';
import { supabase } from './supabase.js';

const BANK_DOMAINS = [
  'nubank.com.br', 'itau.com.br', 'itau-unibanco.com.br', 'bradesco.com.br',
  'santander.com.br', 'c6bank.com.br', 'bancointer.com.br', 'caixa.gov.br',
  'bb.com.br', 'xpi.com.br', 'btgpactual.com', 'original.com.br',
  'picpay.com', 'mercadopago.com', 'pagseguro.uol.com.br', 'sicoob.com.br',
];

function oAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/integrations/gmail/callback'
  );
}

export function getAuthUrl(userId) {
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  return oAuth2().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state,
  });
}

export function decodeState(state) {
  try { return JSON.parse(Buffer.from(state, 'base64url').toString()); }
  catch { throw new Error('Estado OAuth inválido.'); }
}

export async function exchangeAndStore(code, userId) {
  const client = oAuth2();
  const { tokens } = await client.getToken(code);
  await supabase.from('integration_tokens').upsert({
    user_id: userId,
    provider: 'gmail',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    metadata: {},
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });
}

async function authorizedClient(userId) {
  const { data } = await supabase
    .from('integration_tokens').select('*')
    .eq('user_id', userId).eq('provider', 'gmail').single();
  if (!data) throw new Error('Gmail não conectado. Clique em "Conectar Gmail" primeiro.');
  const client = oAuth2();
  client.setCredentials({ access_token: data.access_token, refresh_token: data.refresh_token });
  client.on('tokens', async (t) => {
    if (t.access_token) {
      await supabase.from('integration_tokens').update({
        access_token: t.access_token,
        token_expiry: t.expiry_date ? new Date(t.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('provider', 'gmail');
    }
  });
  return client;
}

function decodeBody(payload) {
  const fromParts = (parts) => {
    if (!parts) return '';
    for (const p of parts) {
      if (p.mimeType === 'text/plain' && p.body?.data)
        return Buffer.from(p.body.data, 'base64').toString('utf-8');
      const sub = fromParts(p.parts);
      if (sub) return sub;
      if (p.mimeType === 'text/html' && p.body?.data)
        return Buffer.from(p.body.data, 'base64').toString('utf-8').replace(/<[^>]+>/g, ' ');
    }
    return '';
  };
  if (payload.body?.data) {
    const t = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    return payload.mimeType === 'text/html' ? t.replace(/<[^>]+>/g, ' ') : t;
  }
  return fromParts(payload.parts || []);
}

export async function fetchBankEmails(userId, daysBack = 30) {
  const auth = await authorizedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth });
  const fromQ = BANK_DOMAINS.map(d => `from:@${d}`).join(' OR ');
  const since = Math.floor((Date.now() - daysBack * 864e5) / 1000);
  const list = await gmail.users.messages.list({ userId: 'me', q: `(${fromQ}) after:${since}`, maxResults: 50 });
  if (!list.data.messages?.length) return [];
  return Promise.all(list.data.messages.map(async (msg) => {
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
    const h = full.data.payload.headers || [];
    return {
      id: msg.id,
      subject: h.find(x => x.name === 'Subject')?.value || '',
      from: h.find(x => x.name === 'From')?.value || '',
      date: h.find(x => x.name === 'Date')?.value || '',
      body: decodeBody(full.data.payload).slice(0, 2000),
    };
  }));
}

export async function getStatus(userId) {
  const { data } = await supabase.from('integration_tokens').select('updated_at,metadata')
    .eq('user_id', userId).eq('provider', 'gmail').single();
  return { connected: !!data, lastSync: data?.metadata?.lastSync || null };
}

export async function disconnect(userId) {
  await supabase.from('integration_tokens').delete().eq('user_id', userId).eq('provider', 'gmail');
}
