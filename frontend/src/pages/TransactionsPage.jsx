import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import { transactionsApi } from '../services/api.js';
import Modal from '../components/ui/Modal.jsx';
import TransactionForm from '../components/ui/TransactionForm.jsx';
import { useToast, ToastContainer } from '../components/ui/Toast.jsx';

const CATEGORIAS = ['Todos', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'];
const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ periodo: 'mes', categoria: '', tipo: '' });
  const { show } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list(filters);
      setTransactions(res.data || []);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(form) {
    setFormLoading(true);
    try {
      const res = await transactionsApi.create(form);
      show(`Transação salva! Categoria: ${res.categoria_sugerida || form.categoria}`, 'success');
      setShowModal(false);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta transação?')) return;
    try {
      await transactionsApi.remove(id);
      show('Transação excluída.', 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  }

  const receitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

  return (
    <div className="space-y-6">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-gray-400 text-sm mt-0.5">Controle de receitas e despesas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Receitas</p>
          <p className="text-lg font-bold text-primary">{fmt(receitas)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Despesas</p>
          <p className="text-lg font-bold text-red-400">{fmt(despesas)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Saldo</p>
          <p className={`text-lg font-bold ${receitas - despesas >= 0 ? 'text-primary' : 'text-red-400'}`}>
            {fmt(receitas - despesas)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-400">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <select value={filters.periodo} onChange={e => setFilters(f => ({ ...f, periodo: e.target.value }))} className="input text-sm">
            <option value="mes">Este mês</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="">Todos</option>
          </select>
          <select value={filters.tipo} onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))} className="input text-sm">
            <option value="">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
          <select value={filters.categoria} onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))} className="input text-sm">
            {CATEGORIAS.map(c => <option key={c} value={c === 'Todos' ? '' : c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-dark-200 rounded-xl animate-pulse" />)}
          </div>
        ) : !transactions.length ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">Nenhuma transação encontrada.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Adicionar primeira transação</button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center py-3.5 gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.tipo === 'receita' ? 'bg-primary' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{t.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.tipo === 'receita' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'}`}>
                      {t.categoria}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ${t.tipo === 'receita' ? 'text-primary' : 'text-red-400'}`}>
                  {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                </span>
                <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Transação">
        <TransactionForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>
    </div>
  );
}
