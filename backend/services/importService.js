export function parseOFX(content) {
  const txns = [];

  // XML-style OFX (with closing tags)
  const xmlRx = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let m;
  while ((m = xmlRx.exec(content)) !== null) {
    const block = m[1];
    const g = (tag) => { const x = block.match(new RegExp(`<${tag}>([^<\n]+)`, 'i')); return x ? x[1].trim() : null; };
    const amount = parseFloat(g('TRNAMT') || '0');
    if (!amount) continue;
    txns.push({ descricao: g('MEMO') || g('NAME') || 'Transação', valor: Math.abs(amount), tipo: amount < 0 ? 'despesa' : 'receita', data: parseOFXDate(g('DTPOSTED')), categoria: 'Outros', fonte: 'ofx' });
  }
  if (txns.length) return txns;

  // SGML-style OFX (no closing tags)
  let cur = null;
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (t === '<STMTTRN>') { cur = {}; continue; }
    if (cur && (t === '</STMTTRN>' || t.startsWith('<STMTTRN'))) {
      if (cur.TRNAMT) {
        const amount = parseFloat(cur.TRNAMT);
        txns.push({ descricao: cur.MEMO || cur.NAME || 'Transação', valor: Math.abs(amount), tipo: amount < 0 ? 'despesa' : 'receita', data: parseOFXDate(cur.DTPOSTED), categoria: 'Outros', fonte: 'ofx' });
      }
      cur = t.startsWith('<STMTTRN') ? {} : null;
      continue;
    }
    if (cur) {
      const fx = t.match(/^<([^>]+)>(.+)$/);
      if (fx) cur[fx[1]] = fx[2].trim();
    }
  }

  return txns;
}

function parseOFXDate(raw) {
  if (!raw) return new Date().toISOString().split('T')[0];
  const s = raw.slice(0, 8);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export function parseCSV(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.replace(/["']/g, '').toLowerCase().trim());

  const idx = (keys) => {
    for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i !== -1) return i; }
    return -1;
  };
  const dateIdx = idx(['data', 'date', 'lançamento', 'lancamento', 'dt']);
  const descIdx = idx(['descrição', 'descricao', 'histórico', 'historico', 'estabelecimento', 'title', 'nome', 'description']);
  const amtIdx = idx(['valor', 'amount', 'value', 'quantia']);
  if (amtIdx === -1) return [];

  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(c => c.replace(/["']/g, '').trim());
    const raw = cols[amtIdx]?.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.') || '0';
    const amount = parseFloat(raw);
    if (isNaN(amount) || amount === 0) return null;
    return {
      descricao: descIdx !== -1 ? cols[descIdx] || 'Importado' : 'Importado',
      valor: Math.abs(amount),
      tipo: amount < 0 ? 'despesa' : 'receita',
      data: parseCSVDate(dateIdx !== -1 ? cols[dateIdx] : ''),
      categoria: 'Outros',
      fonte: 'csv',
    };
  }).filter(Boolean);
}

function parseCSVDate(raw) {
  if (!raw) return new Date().toISOString().split('T')[0];
  // DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // DD-MM-YYYY
  const dmd = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmd) return `${dmd[3]}-${dmd[2].padStart(2,'0')}-${dmd[1].padStart(2,'0')}`;
  return new Date().toISOString().split('T')[0];
}
