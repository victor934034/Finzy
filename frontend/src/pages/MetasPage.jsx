import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Target, CheckCircle2, PlusCircle } from 'lucide-react';
import { metasApi } from '../services/api.js';
import Modal from '../components/ui/Modal.jsx';
import { useToast, ToastContainer } from '../components/ui/Toast.jsx';

const TIPOS = [
  { value: 'poupança', label: 'Poupança' },
  { value: 'quitar_dívida', label: 'Quitar dívida' },
  { value: 'compra', label: 'Compra' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'viagem', label: 'Viagem' },
  { value: 'emergência', label: 'Emergência' },
  { value: 'outros', label: 'Outros' },
];
const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const EMPTY = { titulo: '', tipo: 'poupança', valor_alvo: '', prazo: '', descricao: '' };

const tipoColor = {
  'poupança': 'text-green-400',
  'quitar_dívida': 'text-red-400',
  compra: 'text-blue-400',
  investimento: 'text-yellow-400',
  viagem: 'text-purple-400',
  'emergência': 'text-orange-400',
  outros: 'text-gray-400',
};

function MetaForm({ initial, onSubmit, loading, submitLabel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  useEffect(() => { setForm(initial || EMPTY); }, [initial]);

  return (
    <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }} className="space-y-4">
      <div>
        <label className="label">Título</label>
        <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)} className="input" placeholder="Ex: Reserva de emergência" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Valor alvo (R$)</label>
          <input type="number" step="0.01" min="0.01" value={form.valor_alvo} onChange={e => set('valor_alvo', e.target.value)} className="input" placeholder="0,00" required />
        </div>
      </div>
      <div>
        <label className="label">Prazo (opcional)</label>
        <input type="date" value={form.prazo} onChange={e => set('prazo', e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">Descrição (opcional)</label>
        <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} className="input resize-none" rows={2} placeholder="Detalhes da meta..." />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  );
}

function AddProgressModal({ meta, onSubmit, loading, onClose }) {
  const [valor, setValor] = useState('');
  if (!meta) return null;
  return (
    <form onSubmit={async e => { e.preventDefault(); await onSubmit(valor); }} className="space-y-4">
      <p className="text-sm text-gray-400">Adicionar progresso para: <span className="text-white font-medium">{meta.titulo}</span></p>
      <div>
        <label className="label">Valor a adicionar (R$)</label>
        <input type="number" step="0.01" min="0.01" value={valor} onChange={e => setValor(e.target.value)} className="input" placeholder="0,00" required />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Salvando...' : 'Adicionar'}</button>
      </div>
    </form>
  );
}

export default function MetasPage() {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addingProgress, setAddingProgress] = useState(null);
  const { show } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await metasApi.list();
      setMetas(res.data || []);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(form) {
    setFormLoading(true);
    try {
      await metasApi.create(form);
      show('Meta criada!', 'success');
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
      await metasApi.update(editing.id, form);
      show('Meta atualizada!', 'success');
      setEditing(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleAddProgress(valor) {
    setFormLoading(true);
    try {
      await metasApi.addProgress(addingProgress.id, { valor });
      show('Progresso atualizado!', 'success');
      setAddingProgress(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir esta meta?')) return;
    try {
      await metasApi.remove(id);
      show('Meta excluída!', 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  }

  const ativas = metas.filter(m => !m.concluida);
  const concluidas = metas.filter(m => m.concluida);

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Metas Financeiras</h1>
            <p className="text-sm text-gray-400 mt-1">Acompanhe seus objetivos</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nova Meta
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : metas.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Target size={40} className="mx-auto mb-3 opacity-40" />
            <p>Nenhuma meta cadastrada ainda.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">Criar primeira meta</button>
          </div>
        ) : (
          <div className="space-y-6">
            {ativas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Em andamento</h2>
                {ativas.map(meta => {
                  const pct = Math.min(100, Math.round((Number(meta.valor_atual) / Number(meta.valor_alvo)) * 100));
                  const falta = Math.max(0, Number(meta.valor_alvo) - Number(meta.valor_atual));
                  const vencida = meta.prazo && new Date(meta.prazo) < new Date();
                  return (
                    <div key={meta.id} className="bg-dark-300 rounded-xl p-5 border border-white/5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white">{meta.titulo}</p>
                            <span className={`text-xs font-medium ${tipoColor[meta.tipo] || 'text-gray-400'}`}>
                              {TIPOS.find(t => t.value === meta.tipo)?.label || meta.tipo}
                            </span>
                          </div>
                          {meta.prazo && (
                            <p className={`text-xs mt-0.5 ${vencida ? 'text-red-400' : 'text-gray-500'}`}>
                              {vencida ? 'Prazo vencido: ' : 'Prazo: '}{new Date(meta.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setAddingProgress(meta)} className="text-primary hover:text-primary/80 transition-colors" title="Adicionar progresso">
                            <PlusCircle size={18} />
                          </button>
                          <button onClick={() => setEditing(meta)} className="text-gray-400 hover:text-white transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => handleDelete(meta.id)} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{fmt(meta.valor_atual)}</span>
                          <span className="text-white font-medium">{fmt(meta.valor_alvo)}</span>
                        </div>
                        <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{pct}% concluído</span>
                          <span>Faltam {fmt(falta)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {concluidas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Concluídas</h2>
                {concluidas.map(meta => (
                  <div key={meta.id} className="bg-dark-300 rounded-xl p-4 border border-primary/20 opacity-70 flex items-center gap-4">
                    <CheckCircle2 size={20} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{meta.titulo}</p>
                      <p className="text-xs text-gray-500">{fmt(meta.valor_alvo)} atingido</p>
                    </div>
                    <button onClick={() => handleDelete(meta.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Nova Meta">
        <MetaForm onSubmit={handleCreate} loading={formLoading} submitLabel="Criar Meta" />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar Meta">
        <MetaForm
          initial={editing ? { titulo: editing.titulo, tipo: editing.tipo, valor_alvo: String(editing.valor_alvo), prazo: editing.prazo || '', descricao: editing.descricao || '' } : null}
          onSubmit={handleUpdate}
          loading={formLoading}
          submitLabel="Salvar"
        />
      </Modal>

      <Modal isOpen={!!addingProgress} onClose={() => setAddingProgress(null)} title="Adicionar Progresso">
        <AddProgressModal meta={addingProgress} onSubmit={handleAddProgress} loading={formLoading} onClose={() => setAddingProgress(null)} />
      </Modal>
    </>
  );
}
