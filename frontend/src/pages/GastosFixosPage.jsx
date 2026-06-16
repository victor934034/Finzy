import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, CalendarClock } from 'lucide-react';
import { gastosFixosApi } from '../services/api.js';
import Modal from '../components/ui/Modal.jsx';
import { useToast, ToastContainer } from '../components/ui/Toast.jsx';

const CATEGORIAS = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Negócio', 'Outros'];
const FREQUENCIAS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];
const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const EMPTY = { descricao: '', valor: '', categoria: 'Moradia', dia_vencimento: '5', frequencia: 'mensal' };

function GastoForm({ initial, onSubmit, loading, submitLabel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  useEffect(() => { setForm(initial || EMPTY); }, [initial]);

  return (
    <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }} className="space-y-4">
      <div>
        <label className="label">Descrição</label>
        <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)} className="input" placeholder="Ex: Aluguel, Netflix, Academia" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Valor (R$)</label>
          <input type="number" step="0.01" min="0" value={form.valor} onChange={e => set('valor', e.target.value)} className="input" placeholder="0,00" required />
        </div>
        <div>
          <label className="label">Dia do vencimento</label>
          <input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => set('dia_vencimento', e.target.value)} className="input" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Categoria</label>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input">
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Frequência</label>
          <select value={form.frequencia} onChange={e => set('frequencia', e.target.value)} className="input">
            {FREQUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  );
}

export default function GastosFixosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const { show } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await gastosFixosApi.list();
      setItems(res.data || []);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(form) {
    setFormLoading(true);
    try {
      await gastosFixosApi.create(form);
      show('Gasto fixo adicionado!', 'success');
      setShowAdd(false);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(form) {
    setFormLoading(true);
    try {
      await gastosFixosApi.update(editing.id, form);
      show('Atualizado com sucesso!', 'success');
      setEditing(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(item) {
    try {
      await gastosFixosApi.update(item.id, { ativo: !item.ativo });
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este gasto fixo?')) return;
    try {
      await gastosFixosApi.remove(id);
      show('Excluído!', 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  }

  const ativos = items.filter(i => i.ativo);
  const totalMensal = ativos.reduce((s, i) => s + Number(i.valor), 0);

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Gastos Fixos</h1>
            <p className="text-sm text-gray-400 mt-1">Despesas recorrentes e assinaturas</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Adicionar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-dark-300 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">Total mensal (ativos)</p>
            <p className="text-xl font-bold text-red-400 mt-1">{fmt(totalMensal)}</p>
          </div>
          <div className="bg-dark-300 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400">Gastos ativos</p>
            <p className="text-xl font-bold text-white mt-1">{ativos.length}</p>
          </div>
          <div className="bg-dark-300 rounded-xl p-4 border border-white/5 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-400">Total cadastrados</p>
            <p className="text-xl font-bold text-white mt-1">{items.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CalendarClock size={40} className="mx-auto mb-3 opacity-40" />
            <p>Nenhum gasto fixo cadastrado.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">Adicionar primeiro</button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={`bg-dark-300 rounded-xl p-4 border flex items-center gap-4 transition-all ${item.ativo ? 'border-white/5' : 'border-white/5 opacity-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{item.descricao}</p>
                    <span className="text-xs bg-dark-400 text-gray-400 px-2 py-0.5 rounded-full shrink-0">{item.categoria}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dia {item.dia_vencimento} · {FREQUENCIAS.find(f => f.value === item.frequencia)?.label || item.frequencia}
                  </p>
                </div>
                <p className="font-bold text-red-400 shrink-0">{fmt(item.valor)}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(item)} className="text-gray-400 hover:text-primary transition-colors" title={item.ativo ? 'Desativar' : 'Ativar'}>
                    {item.ativo ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => setEditing(item)} className="text-gray-400 hover:text-white transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Novo Gasto Fixo">
        <GastoForm onSubmit={handleCreate} loading={formLoading} submitLabel="Adicionar" />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Gasto Fixo">
        <GastoForm
          initial={editing ? { descricao: editing.descricao, valor: String(editing.valor), categoria: editing.categoria, dia_vencimento: String(editing.dia_vencimento), frequencia: editing.frequencia } : null}
          onSubmit={handleUpdate}
          loading={formLoading}
          submitLabel="Salvar"
        />
      </Modal>
    </>
  );
}
