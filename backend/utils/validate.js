// ── Date ──────────────────────────────────────────────────────────────────────
// Aceita somente YYYY-MM-DD: ano 4 dígitos (1900-2100), mês 2 (01-12), dia 2 (01-31).
export function validDate(str) {
  if (typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  // Checa dia válido para o mês (ex: 30/02 é inválido)
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// ── Money ─────────────────────────────────────────────────────────────────────
// Valor positivo em reais, máximo R$ 999.999.999,99.
export function validMoney(val) {
  const n = Number(val);
  return !isNaN(n) && isFinite(n) && n >= 0 && n <= 999999999.99;
}

// ── String ────────────────────────────────────────────────────────────────────
// Remove null bytes, faz trim, limita tamanho. Retorna null se inválido.
export function validStr(str, max = 255) {
  if (typeof str !== 'string') return null;
  const s = str.replace(/\0/g, '').trim();
  if (s.length === 0 || s.length > max) return null;
  return s;
}

// ── Enum ──────────────────────────────────────────────────────────────────────
export function validEnum(val, allowed) {
  return allowed.includes(val) ? val : null;
}

// ── UUID v4 ───────────────────────────────────────────────────────────────────
export function validUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ── Integer range ─────────────────────────────────────────────────────────────
export function validInt(val, min, max) {
  const n = Math.floor(Number(val));
  return !isNaN(n) && n >= min && n <= max ? n : null;
}
