import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, RefreshCw, Building2, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardApi, aiApi, integrationsApi } from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import AIInsightCard from '../components/ui/AIInsightCard.jsx';
import { useAuthStore } from '../store/authStore.js';

const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-300 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function BankBalancesCard({ data }) {
  if (!data?.accounts?.length) return null;
  const bankAccounts = data.accounts.filter(a => a.type !== 'CREDIT');
  const creditAccounts = data.accounts.filter(a => a.type === 'CREDIT');
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Building2 size={16} className="text-primary" /> Saldo no Banco
        </h2>
        <span className="text-[11px] text-gray-500 bg-dark-50 px-2 py-0.5 rounded-full">via Pluggy</span>
      </div>
      <div className="space-y-2">
        {bankAccounts.map((acc, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={14} className="text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{acc.name}</p>
                <p className="text-[11px] text-gray-500">{acc.subtype || 'Conta'}{acc.number ? ` · ${acc.number}` : ''}</p>
              </div>
            </div>
            <span className={`text-sm font-bold ml-3 shrink-0 ${acc.balance >= 0 ? 'text-primary' : 'text-red-400'}`}>
              {fmt(acc.balance)}
            </span>
          </div>
        ))}
        {creditAccounts.map((acc, i) => (
          <div key={`c${i}`} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard size={14} className="text-yellow-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{acc.name}</p>
                <p className="text-[11px] text-gray-500">Cartão de Crédito</p>
              </div>
            </div>
            <span className={`text-sm font-bold ml-3 shrink-0 ${acc.balance <= 0 ? 'text-red-400' : 'text-gray-300'}`}>
              {fmt(Math.abs(acc.balance))}
            </span>
          </div>
        ))}
      </div>
      {bankAccounts.length > 0 && (
        <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
          <span className="text-sm text-gray-400 font-medium">Total disponível</span>
          <span className={`text-sm font-bold ${data.total >= 0 ? 'text-primary' : 'text-red-400'}`}>
            {fmt(data.total)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState([]);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankBalances, setBankBalances] = useState(null);

  const nome = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'usuário';

  useEffect(() => {
    loadData();
    loadBankBalances();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([dashboardApi.summary(), dashboardApi.monthlyChart()]);
      setSummary(s);
      setChart(c.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadBankBalances() {
    try {
      const res = await integrationsApi.pluggyBalances();
      if (res.accounts?.length) setBankBalances(res);
    } catch { /* Pluggy not connected — hide silently */ }
  }

  async function loadInsight() {
    setLoadingInsight(true);
    try {
      const res = await aiApi.dashboardInsight();
      setInsight(res.insight);
    } catch (err) {
      setInsight('Erro ao gerar análise. Tente novamente.');
    } finally {
      setLoadingInsight(false);
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-dark-200" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Olá, {nome} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Saldo do Mês" value={fmt(summary?.saldo)} icon={Wallet}
          color={summary?.saldo >= 0 ? 'primary' : 'red'} />
        <StatCard title="Receitas" value={fmt(summary?.receitas)} icon={TrendingUp} color="primary" />
        <StatCard title="Despesas" value={fmt(summary?.despesas)} icon={TrendingDown} color="red" />
        <StatCard title="Investido" value={fmt(summary?.investimentos?.totalInvestido)} icon={PieChart} color="blue"
          subtitle={`Rentab. ${summary?.investimentos?.rentabilidade?.toFixed(1) || 0}%`} />
      </div>

      <BankBalancesCard data={bankBalances} />

      <AIInsightCard insight={insight} onRefresh={loadInsight} loading={loadingInsight} />

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Receitas x Despesas (6 meses)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
            <Bar dataKey="receitas" name="Receitas" fill="#00C853" radius={[6, 6, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4">Últimas Transações</h2>
        {!summary?.transacoesRecentes?.length ? (
          <p className="text-gray-500 text-sm text-center py-6">Nenhuma transação ainda.</p>
        ) : (
          <div className="space-y-3">
            {summary.transacoesRecentes.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{t.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{t.categoria}</span>
                  </div>
                </div>
                <span className={`text-sm font-bold ml-3 shrink-0 ${t.tipo === 'receita' ? 'text-primary' : 'text-red-400'}`}>
                  {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
