import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Building2, Upload, CheckCircle, AlertCircle, RefreshCw, Trash2, FileText, X } from 'lucide-react';
import { PluggyConnect } from 'react-pluggy-connect';
import { integrationsApi } from '../services/api.js';

const CATEGORIES = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'];

// ── helpers ──────────────────────────────────────────────────────────
function StatusBadge({ connected }) {
  return connected ? (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
      <CheckCircle size={12} /> Conectado
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
      <AlertCircle size={12} /> Não conectado
    </span>
  );
}

// ── Gmail ─────────────────────────────────────────────────────────────
function GmailTab() {
  const [status, setStatus] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadStatus();
    if (searchParams.get('gmail') === 'connected') setResult({ message: 'Gmail conectado com sucesso!' });
    if (searchParams.get('error')) setError(decodeURIComponent(searchParams.get('error')));
  }, []);

  async function loadStatus() {
    try { setStatus(await integrationsApi.gmailStatus()); } catch { setStatus({ connected: false }); }
  }

  async function connect() {
    try { const { url } = await integrationsApi.gmailAuthUrl(); window.location.href = url; }
    catch (e) { setError(e.message); }
  }

  async function sync() {
    setLoading(true); setError(''); setResult(null);
    try { const r = await integrationsApi.gmailSync(days); setResult(r); loadStatus(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function disconnect() {
    if (!confirm('Desconectar Gmail?')) return;
    try { await integrationsApi.gmailDisconnect(); setStatus({ connected: false }); setResult(null); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center"><Mail size={20} className="text-red-400" /></div>
            <div>
              <p className="font-semibold text-white">Google Gmail</p>
              <p className="text-xs text-gray-500">Lê notificações de e-mail dos seus bancos</p>
            </div>
          </div>
          <StatusBadge connected={status?.connected} />
        </div>
        {status?.lastSync && <p className="text-xs text-gray-500">Última sync: {new Date(status.lastSync).toLocaleString('pt-BR')}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          {!status?.connected ? (
            <button onClick={connect} className="btn-primary text-sm px-4 py-2">Conectar Gmail</button>
          ) : (
            <>
              <label className="text-sm text-gray-400">Últimos</label>
              <select value={days} onChange={e => setDays(Number(e.target.value))} className="input text-sm py-1.5 px-3 w-28">
                {[7, 15, 30, 60, 90].map(d => <option key={d} value={d}>{d} dias</option>)}
              </select>
              <button onClick={sync} disabled={loading} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button onClick={disconnect} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-400/10 transition-all">
                <Trash2 size={14} /> Desconectar
              </button>
            </>
          )}
        </div>
        {result && <div className="p-3 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 text-sm">{result.message || `✓ ${result.imported} transação(ões) importada(s) de ${result.emailsRead} e-mail(s)`}</div>}
        {error && <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">{error}</div>}
      </div>
      <div className="card p-4 bg-dark-200/50">
        <p className="text-xs text-gray-500 font-medium mb-2">Bancos suportados via e-mail</p>
        <div className="flex flex-wrap gap-2">
          {['Nubank', 'Itaú', 'Bradesco', 'Santander', 'C6 Bank', 'Inter', 'Caixa', 'Banco do Brasil', 'XP', 'BTG', 'PicPay', 'Mercado Pago'].map(b => (
            <span key={b} className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-lg">{b}</span>
          ))}
        </div>
      </div>
      <div className="card p-4 bg-dark-200/50 space-y-2">
        <p className="text-xs font-semibold text-gray-400">Como configurar</p>
        <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
          <li>Acesse <span className="text-primary">console.cloud.google.com</span></li>
          <li>Crie um projeto e ative a <strong className="text-gray-300">Gmail API</strong></li>
          <li>Em "Credenciais", crie um <strong className="text-gray-300">ID do cliente OAuth 2.0</strong> (Aplicativo Web)</li>
          <li>Adicione URI de redirecionamento: <code className="text-green-400">http://localhost:3001/api/integrations/gmail/callback</code></li>
          <li>Copie Client ID e Secret para o <code className="text-green-400">backend/.env</code></li>
        </ol>
      </div>
    </div>
  );
}

// ── Pluggy (Banco Direto) ─────────────────────────────────────────────
function BancoTab() {
  const [status, setStatus] = useState(null);
  const [connectToken, setConnectToken] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [days, setDays] = useState(30);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try { setStatus(await integrationsApi.pluggyStatus()); } catch { setStatus({ connected: false, itemCount: 0 }); }
  }

  async function openConnect() {
    setError('');
    try {
      const { token } = await integrationsApi.pluggyConnectToken();
      setConnectToken(token);
    } catch (e) { setError(e.message); }
  }

  async function onSuccess({ itemData }) {
    setConnectToken(null);
    try {
      await integrationsApi.pluggySaveItem(itemData.item.id);
      await loadStatus();
      setResult({ message: 'Conta bancária conectada com sucesso!' });
    } catch (e) { setError(e.message); }
  }

  async function sync() {
    setSyncing(true); setError(''); setResult(null);
    try { const r = await integrationsApi.pluggySync(days); setResult(r); }
    catch (e) { setError(e.message); }
    finally { setSyncing(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center"><Building2 size={20} className="text-blue-400" /></div>
            <div>
              <p className="font-semibold text-white">Banco Direto — Open Finance</p>
              <p className="text-xs text-gray-500">Extrato direto da conta via Pluggy</p>
            </div>
          </div>
          <StatusBadge connected={status?.connected} />
        </div>

        {status?.connected && <p className="text-xs text-gray-500">{status.itemCount} conta(s) conectada(s){status.lastSync ? ` · Sync: ${new Date(status.lastSync).toLocaleString('pt-BR')}` : ''}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={openConnect} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <Building2 size={14} />
            {status?.connected ? 'Adicionar conta' : 'Conectar banco'}
          </button>
          {status?.connected && (
            <>
              <label className="text-sm text-gray-400">Últimos</label>
              <select value={days} onChange={e => setDays(Number(e.target.value))} className="input text-sm py-1.5 px-3 w-28">
                {[7, 15, 30, 60, 90].map(d => <option key={d} value={d}>{d} dias</option>)}
              </select>
              <button onClick={sync} disabled={syncing} className="flex items-center gap-2 text-sm text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all">
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </>
          )}
        </div>

        {result && <div className="p-3 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 text-sm">{result.message || `✓ ${result.imported} transação(ões) importada(s)`}</div>}
        {error && <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">{error}</div>}
      </div>

      {/* Widget Pluggy Connect — aparece após clicar em "Conectar banco" */}
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={onSuccess}
          onError={({ error: e }) => { setError(e?.message || 'Erro ao conectar banco.'); setConnectToken(null); }}
          onClose={() => setConnectToken(null)}
        />
      )}

      <div className="card p-4 bg-dark-200/50 space-y-2">
        <p className="text-xs font-semibold text-gray-400">Credenciais já configuradas</p>
        <p className="text-xs text-gray-500">Client ID e Client Secret do Pluggy já estão no <code className="text-green-400">backend/.env</code>. Use o sandbox para testar conexões bancárias sem conta real.</p>
      </div>
    </div>
  );
}

// ── Importar Arquivo ──────────────────────────────────────────────────
function ArquivoTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const inputRef = useRef();

  async function handleFile(f) {
    if (!f) return;
    setFile(f); setError(''); setPreview(null); setResult(null);
    setLoading(true);
    try {
      const r = await integrationsApi.importPreview(f);
      setTransactions(r.transactions.map(t => ({ ...t })));
      setPreview(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function confirm() {
    setImporting(true); setError('');
    try {
      const r = await integrationsApi.importConfirm(transactions);
      setResult(r); setPreview(null); setTransactions([]); setFile(null);
    } catch (e) { setError(e.message); }
    finally { setImporting(false); }
  }

  function onDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }

  return (
    <div className="space-y-4">
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center"><Upload size={20} className="text-purple-400" /></div>
          <div>
            <p className="font-semibold text-white">Importar Arquivo</p>
            <p className="text-xs text-gray-500">Suporte a OFX e CSV de qualquer banco</p>
          </div>
        </div>
        <div onClick={() => inputRef.current?.click()} onDrop={onDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
          <Upload size={32} className="mx-auto mb-3 text-gray-600 group-hover:text-primary transition-colors" />
          <p className="text-sm text-gray-400 group-hover:text-white transition-colors">{file ? file.name : 'Arraste um arquivo ou clique para selecionar'}</p>
          <p className="text-xs text-gray-600 mt-1">OFX ou CSV · máx. 10 MB</p>
          <input ref={inputRef} type="file" accept=".ofx,.csv,.txt" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
        {loading && <p className="text-sm text-gray-400 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Processando arquivo...</p>}
        {error && <div className="p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">{error}</div>}
        {result && <div className="p-3 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 text-sm">✓ {result.imported} transação(ões) importada(s)</div>}
      </div>

      {preview && transactions.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{transactions.length} transações{preview.total > transactions.length ? ` (de ${preview.total})` : ''}</p>
            <button onClick={() => { setPreview(null); setTransactions([]); setFile(null); }} className="text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-dark-300">
                <tr className="text-gray-500 text-left">
                  <th className="px-3 py-2">Data</th><th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Valor</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/3">
                    <td className="px-3 py-2 text-gray-400">{t.data}</td>
                    <td className="px-3 py-2 text-white max-w-[180px] truncate">{t.descricao}</td>
                    <td className={`px-3 py-2 font-medium ${t.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>
                      R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2">
                      <select value={t.tipo} onChange={e => setTransactions(p => p.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))}
                        className="bg-transparent text-gray-300 text-xs border border-white/10 rounded px-1 py-0.5">
                        <option value="despesa">Despesa</option><option value="receita">Receita</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={t.categoria} onChange={e => setTransactions(p => p.map((x, j) => j === i ? { ...x, categoria: e.target.value } : x))}
                        className="bg-transparent text-gray-300 text-xs border border-white/10 rounded px-1 py-0.5">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setPreview(null); setTransactions([]); setFile(null); }} className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all">Cancelar</button>
            <button onClick={confirm} disabled={importing} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              {importing ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
              {importing ? 'Importando...' : `Importar ${transactions.length} transações`}
            </button>
          </div>
        </div>
      )}

      <div className="card p-4 bg-dark-200/50 space-y-2">
        <p className="text-xs font-semibold text-gray-400">Como exportar do banco</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li><strong className="text-gray-300">Nubank:</strong> App → Perfil → Exportar extrato → CSV</li>
          <li><strong className="text-gray-300">Itaú:</strong> Internet Banking → Extrato → Exportar → OFX</li>
          <li><strong className="text-gray-300">Bradesco:</strong> App → Extrato → Compartilhar → CSV</li>
          <li><strong className="text-gray-300">Inter:</strong> App → Extrato → Exportar → CSV</li>
        </ul>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'banco', label: 'Banco Direto', icon: Building2 },
  { id: 'arquivo', label: 'Importar Arquivo', icon: Upload },
];

export default function IntegrationsPage() {
  const [tab, setTab] = useState('banco');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('gmail') === 'connected' || searchParams.get('error')) setTab('gmail');
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400 text-sm mt-1">Conecte e-mail, contas bancárias ou importe extratos automaticamente</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === t.id ? 'bg-primary/15 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'gmail' && <GmailTab />}
      {tab === 'banco' && <BancoTab />}
      {tab === 'arquivo' && <ArquivoTab />}
    </div>
  );
}
