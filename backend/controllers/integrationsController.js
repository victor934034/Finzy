import { supabase } from '../services/supabase.js';
import * as gmail from '../services/gmailService.js';
import * as pluggy from '../services/pluggyService.js';
import * as importSvc from '../services/importService.js';
import { parseEmailsToTransactions } from '../services/aiService.js';

// ── Gmail ─────────────────────────────────────────────────────────────────────
export function gmailAuthUrl(req, res) {
  try {
    const url = gmail.getAuthUrl(req.user.id);
    res.json({ url });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function gmailCallback(req, res) {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.redirect(`${process.env.FRONTEND_URL}/integracoes?error=oauth_failed`);
    const { userId } = gmail.decodeState(state);
    await gmail.exchangeAndStore(code, userId);
    res.redirect(`${process.env.FRONTEND_URL}/integracoes?gmail=connected`);
  } catch (e) {
    res.redirect(`${process.env.FRONTEND_URL}/integracoes?error=${encodeURIComponent(e.message)}`);
  }
}

export async function gmailStatus(req, res) {
  try { res.json(await gmail.getStatus(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

export async function gmailSync(req, res) {
  try {
    const { daysBack = 30 } = req.body;
    const emails = await gmail.fetchBankEmails(req.user.id, daysBack);
    if (!emails.length) return res.json({ imported: 0, message: 'Nenhum e-mail de banco encontrado.' });

    const summaries = emails.map((e, i) =>
      `[${i}] De: ${e.from}\nAssunto: ${e.subject}\n${e.body.slice(0, 400)}`
    ).join('\n---\n');

    const { text } = await parseEmailsToTransactions(summaries);
    let txns = [];
    try { const j = text.match(/\[[\s\S]*?\]/)?.[0]; if (j) txns = JSON.parse(j); } catch {}

    if (!txns.length) return res.json({ imported: 0, emailsRead: emails.length, message: 'Nenhuma transação detectada nos e-mails.' });

    const rows = txns.map(t => ({
      user_id: req.user.id,
      descricao: String(t.descricao || 'Gmail').slice(0, 255),
      valor: Math.abs(Number(t.valor) || 0),
      tipo: t.tipo === 'receita' ? 'receita' : 'despesa',
      categoria: t.categoria || 'Outros',
      data: t.data || new Date().toISOString().split('T')[0],
      fonte: 'gmail',
    })).filter(t => t.valor > 0);

    if (rows.length) await supabase.from('transactions').insert(rows);

    await supabase.from('integration_tokens').update({
      metadata: { lastSync: new Date().toISOString(), emailsProcessed: emails.length },
      updated_at: new Date().toISOString(),
    }).eq('user_id', req.user.id).eq('provider', 'gmail');

    res.json({ imported: rows.length, emailsRead: emails.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function gmailDisconnect(req, res) {
  try { await gmail.disconnect(req.user.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

// ── Pluggy ────────────────────────────────────────────────────────────────────
export async function pluggyConnectToken(req, res) {
  try { res.json({ token: await pluggy.createConnectToken(req.user.id) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

export async function pluggySaveItem(req, res) {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId obrigatório.' });
    await pluggy.saveItem(req.user.id, itemId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function pluggyStatus(req, res) {
  try { res.json(await pluggy.getStatus(req.user.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

export async function pluggySync(req, res) {
  try {
    const { daysBack = 30 } = req.body;
    const txns = await pluggy.fetchTransactions(req.user.id, daysBack);
    if (!txns.length) return res.json({ imported: 0 });
    await supabase.from('transactions').insert(txns.map(t => ({ ...t, user_id: req.user.id })));
    await supabase.from('integration_tokens').update({ updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id).eq('provider', 'pluggy');
    res.json({ imported: txns.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function pluggyBalances(req, res) {
  try {
    const accounts = await pluggy.getAccountBalances(req.user.id);
    const total = accounts.filter(a => a.type !== 'CREDIT').reduce((s, a) => s + (a.balance || 0), 0);
    res.json({ accounts, total });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function pluggyRemoveItem(req, res) {
  try { await pluggy.removeItem(req.user.id, req.body.itemId); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
}

// ── Import OFX / CSV ──────────────────────────────────────────────────────────
export async function importPreview(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado.' });
    const content = req.file.buffer.toString('utf-8');
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const txns = (ext === 'ofx' || content.includes('<OFX>') || content.includes('OFXHEADER'))
      ? importSvc.parseOFX(content)
      : importSvc.parseCSV(content);
    if (!txns.length) return res.status(422).json({ error: 'Nenhuma transação detectada no arquivo.' });
    res.json({ transactions: txns.slice(0, 500), total: txns.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function importConfirm(req, res) {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || !transactions.length)
      return res.status(400).json({ error: 'Nenhuma transação para importar.' });
    const rows = transactions.map(t => ({
      user_id: req.user.id,
      descricao: String(t.descricao || 'Importado').slice(0, 255),
      valor: Math.abs(Number(t.valor) || 0),
      tipo: t.tipo === 'receita' ? 'receita' : 'despesa',
      categoria: t.categoria || 'Outros',
      data: t.data || new Date().toISOString().split('T')[0],
      fonte: t.fonte || 'importado',
    })).filter(t => t.valor > 0);
    if (rows.length) await supabase.from('transactions').insert(rows);
    res.json({ imported: rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
