import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const CATEGORIAS = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Negócio', 'Investimentos', 'Outros'];

export default function TransactionForm({ onSubmit, loading, tableType = 'personal' }) {
  const [form, setForm] = useState({
    tipo: 'despesa',
    valor: '',
    categoria: 'auto',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.valor || !form.descricao || !form.data) return;
    await onSubmit(form);
    setForm({ tipo: 'despesa', valor: '', categoria: 'auto', descricao: '', data: new Date().toISOString().split('T')[0] });
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => set('tipo', 'receita')}
          className={`py-3 rounded-xl font-semibold text-sm transition-all ${form.tipo === 'receita' ? 'bg-primary text-white' : 'bg-dark-50 text-gray-400 hover:text-white'}`}>
          + Receita
        </button>
        <button type="button" onClick={() => set('tipo', 'despesa')}
          className={`py-3 rounded-xl font-semibold text-sm transition-all ${form.tipo === 'despesa' ? 'bg-red-500 text-white' : 'bg-dark-50 text-gray-400 hover:text-white'}`}>
          - Despesa
        </button>
      </div>

      <div>
        <label className="label">Valor (R$)</label>
        <input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor}
          onChange={e => set('valor', e.target.value)} className="input" required />
      </div>

      <div>
        <label className="label">Descrição</label>
        <input type="text" placeholder="Ex: Almoço no restaurante" value={form.descricao}
          onChange={e => set('descricao', e.target.value)} className="input" required />
      </div>

      <div>
        <label className="label flex items-center gap-2">
          Categoria
          <span className="text-xs text-primary flex items-center gap-1">
            <Sparkles size={12} /> IA categoriza automaticamente
          </span>
        </label>
        <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input">
          <option value="auto">Automático (IA)</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Data</label>
        <input type="date" value={form.data} onChange={e => set('data', e.target.value)} className="input" required />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Salvando...' : 'Salvar Transação'}
      </button>
    </form>
  );
}
