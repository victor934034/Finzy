import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { investmentsApi, aiApi } from '../services/api.js';
import Modal from '../components/ui/Modal.jsx';
import AIInsightCard from '../components/ui/AIInsightCard.jsx';
import { useToast, ToastContainer } from '../components/ui/Toast.jsx';

const TIPOS = ['Renda Fixa', 'Tesouro Direto', 'CDB', 'LCI/LCA', 'Ações', 'FIIs', 'Criptomoedas', 'Previdência', 'Poupança', 'Outros'];
const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function InvestmentForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ nome: '', tipo: 'Renda Fixa', valor_investido: '', valor_atual: '', data_inicio: new Date().toISOString().split('T')[0] });
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({ nome: '', tipo: 'Renda Fixa', valor_investido: '', valor_atual: '', data_inicio: new Date().toISOString().split('T')[0] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome do investimento</label>
        <input type="text" placeholder="Ex: Tesouro IPCA+ 2029" value={form.nome} onChange={e => set('nome', e.target.value)} className="input" required />
      </div>
      <div>
        <label className="label">Tipo</label>
        <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Valor investido (R$)</label>
          <input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor_investido} onChange={e => set('valor_investido', e.target.value)} className="input" required />
        </div>
        <div>
          <label className="label">Valor atual (R$)</label>
          <input type="number" step="0.01" min="0" placeholder="Opcional" value={form.valor_atual} onChange={e => set('valor_atual', e.target.value)} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Data de início</label>
        <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" required />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Salvando...' : 'Adicionar Investimento'}
      </button>
    </form>
  );
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { show } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await investmentsApi.list();
      setInvestments(res.data || []);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(form) {
    setFormLoading(true);
    try {
      await investmentsApi.create(form);
      show('Investimento adicionado!', 'success');
      setShowModal(false);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este investimento?')) return;
    try {
      await investmentsApi.remove(id);
      show('Investimento excluído.', 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  }

  async function loadInsight() {
    setInsightLoading(true);
    try {
      const res = await aiApi.investmentsInsight();
      setInsight(res.insight);
    } catch (err) {
      show('Erro ao gerar análise.', 'error');
    } finally {
      setInsightLoading(false);
    }
  }

  const totalInvestido = investments.reduce((s, i) => s + i.valor_investido, 0);
  const totalAtual = investments.reduce((s, i) => s + (i.valor_atual || i.valor_investido), 0);
  const rentabilidade = totalInvestido > 0 ? ((totalAtual - totalInvestido) / totalInvestido * 100) : 0;

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investimentos</h1>
          <p className="text-gray-400 text-sm mt-0.5">Acompanhe sua carteira</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Total investido</p>
          <p className="text-lg font-bold text-white">{fmt(totalInvestido)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Valor atual</p>
          <p className="text-lg font-bold text-primary">{fmt(totalAtual)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Rentabilidade</p>
          <div className="flex items-center justify-center gap-1">
            {rentabilidade >= 0 ? <TrendingUp size={16} className="text-primary" /> : <TrendingDown size={16} className="text-red-400" />}
            <p className={`text-lg font-bold ${rentabilidade >= 0 ? 'text-primary' : 'text-red-400'}`}>
              {rentabilidade.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <AIInsightCard insight={insight} onRefresh={loadInsight} loading={insightLoading} />

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Minha Carteira</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-dark-200 rounded-xl animate-pulse" />)}</div>
        ) : !investments.length ? (
          <div className="text-center py-10">
            <p className="text-gray-400">Nenhum investimento cadastrado.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Adicionar primeiro</button>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.map(inv => {
              const rentab = inv.valor_investido > 0 ? ((inv.valor_atual || inv.valor_investido) - inv.valor_investido) / inv.valor_investido * 100 : 0;
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 bg-dark-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{inv.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{inv.tipo}</span>
                      <span className="text-xs text-gray-500">{new Date(inv.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{fmt(inv.valor_atual || inv.valor_investido)}</p>
                    <p className={`text-xs font-medium ${rentab >= 0 ? 'text-primary' : 'text-red-400'}`}>
                      {rentab >= 0 ? '+' : ''}{rentab.toFixed(2)}%
                    </p>
                  </div>
                  <button onClick={() => handleDelete(inv.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Investimento">
        <InvestmentForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>
    </div>
  );
}
