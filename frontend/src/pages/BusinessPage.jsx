import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, BarChart3, TrendingUp } from 'lucide-react';
import { businessApi, aiApi } from '../services/api.js';
import Modal from '../components/ui/Modal.jsx';
import TransactionForm from '../components/ui/TransactionForm.jsx';
import AIInsightCard from '../components/ui/AIInsightCard.jsx';
import { useToast, ToastContainer } from '../components/ui/Toast.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#00C853', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function BusinessPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [insight, setInsight] = useState('');
  const [cashflow, setCashflow] = useState('');
  const [loadings, setLoadings] = useState({ report: true, insight: false, cashflow: false, form: false });
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('lancamentos');
  const { show } = useToast();

  const setL = (key, val) => setLoadings(p => ({ ...p, [key]: val }));

  const loadReport = useCallback(async () => {
    setL('report', true);
    try {
      const res = await businessApi.monthlyReport({ mes, ano });
      setReport(res);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setL('report', false);
    }
  }, [mes, ano]);

  useEffect(() => { loadReport(); }, [loadReport]);

  async function handleCreate(form) {
    setL('form', true);
    try {
      await businessApi.create(form);
      show('Lançamento salvo!', 'success');
      setShowModal(false);
      loadReport();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setL('form', false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este lançamento?')) return;
    try {
      await businessApi.remove(id);
      show('Excluído.', 'success');
      loadReport();
    } catch (err) {
      show(err.message, 'error');
    }
  }

  async function loadInsight() {
    setL('insight', true);
    try {
      const res = await aiApi.businessInsight({ mes, ano });
      setInsight(res.insight);
    } catch (err) {
      show('Erro ao gerar análise.', 'error');
    } finally {
      setL('insight', false);
    }
  }

  async function loadCashflow() {
    setL('cashflow', true);
    try {
      const res = await aiApi.predictCashFlow();
      setCashflow(res.insight);
    } catch (err) {
      show('Erro ao gerar previsão.', 'error');
    } finally {
      setL('cashflow', false);
    }
  }

  const pieData = (report?.categorias || []).map((c, i) => ({ name: c.categoria, value: c.total, color: COLORS[i % COLORS.length] }));
  const margem = report?.receitas > 0 ? (report.lucro / report.receitas * 100) : 0;

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão do Negócio</h1>
          <p className="text-gray-400 text-sm mt-0.5">Finanças separadas do pessoal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input w-auto text-sm">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })}
            </option>
          ))}
        </select>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} className="input w-auto text-sm">
          {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {loadings.report ? (
        <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-dark-200" />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-400 mb-1">Receitas</p>
            <p className="text-lg font-bold text-primary">{fmt(report?.receitas)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-400 mb-1">Despesas</p>
            <p className="text-lg font-bold text-red-400">{fmt(report?.despesas)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-400 mb-1">Lucro</p>
            <p className={`text-lg font-bold ${report?.lucro >= 0 ? 'text-primary' : 'text-red-400'}`}>{fmt(report?.lucro)}</p>
            <p className="text-xs text-gray-500">{margem.toFixed(1)}% margem</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['lancamentos', 'relatorio', 'previsao'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-dark-300 text-gray-400 hover:text-white'}`}>
            {tab === 'lancamentos' ? 'Lançamentos' : tab === 'relatorio' ? 'Relatório IA' : 'Previsão 30 dias'}
          </button>
        ))}
      </div>

      {activeTab === 'lancamentos' && (
        <div className="card">
          {loadings.report ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-dark-200 rounded-xl animate-pulse" />)}</div>
          ) : !report?.entries?.length ? (
            <div className="text-center py-10">
              <p className="text-gray-400">Nenhum lançamento neste mês.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Adicionar lançamento</button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {report.entries.map(e => (
                <div key={e.id} className="flex items-center py-3 gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${e.tipo === 'receita' ? 'bg-primary' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{e.categoria}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{new Date(e.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${e.tipo === 'receita' ? 'text-primary' : 'text-red-400'}`}>
                    {e.tipo === 'receita' ? '+' : '-'}{fmt(e.valor)}
                  </span>
                  <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'relatorio' && (
        <div className="space-y-4">
          <AIInsightCard insight={insight} onRefresh={loadInsight} loading={loadings.insight} />
          {pieData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Despesas por Categoria</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#1A2332', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'previsao' && (
        <AIInsightCard insight={cashflow} onRefresh={loadCashflow} loading={loadings.cashflow} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Lançamento do Negócio">
        <TransactionForm onSubmit={handleCreate} loading={loadings.form} tableType="business" />
      </Modal>
    </div>
  );
}
