import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart2, PieChart as PieIcon, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { analyticsApi } from '../services/api.js';

const COLORS = ['#00C853', '#2979FF', '#FF6D00', '#AA00FF', '#FF1744', '#00BCD4', '#FFD600', '#76FF03'];

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, positive }) {
  return (
    <div className="bg-dark-300 rounded-2xl p-5 border border-white/5">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${positive === undefined ? 'text-white' : positive ? 'text-green-400' : 'text-red-400'}`}>
        {fmt(value)}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.trends(), analyticsApi.categories(), analyticsApi.forecast()])
      .then(([t, c, f]) => {
        setTrends(t.data || []);
        setCategories(c.categorias || []);
        setForecast(f);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const saldoPositivo = forecast ? forecast.saldoPrevisto >= 0 : true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">Análise detalhada das suas finanças</p>
      </div>

      {forecast && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Receita média (3m)" value={forecast.mediaReceitas} positive={true} />
          <StatCard label="Despesa média (3m)" value={forecast.mediaDespesas} positive={false} />
          <StatCard label="Saldo previsto" value={forecast.saldoPrevisto} positive={saldoPositivo} />
          <StatCard label="Despesa proj. mês" value={forecast.mesAtual?.despesasProjetadas} positive={false} />
        </div>
      )}

      <div className="bg-dark-300 rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-primary" />
          <h2 className="text-white font-semibold">Receitas vs Despesas — últimos 6 meses</h2>
        </div>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={(v, name) => [fmt(v), name === 'receitas' ? 'Receitas' : 'Despesas']}
              />
              <Legend formatter={v => v === 'receitas' ? 'Receitas' : 'Despesas'} />
              <Bar dataKey="receitas" fill="#00C853" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#FF1744" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">Sem dados para exibir</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-dark-300 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={18} className="text-primary" />
            <h2 className="text-white font-semibold">Despesas por categoria (mês atual)</h2>
          </div>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: 8 }}
                  formatter={v => [fmt(v)]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Sem despesas este mês</p>
          )}
        </div>

        <div className="bg-dark-300 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-white font-semibold">Previsão do mês</h2>
          </div>
          {forecast ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Receitas até agora</span>
                <span className="text-green-400 font-semibold">{fmt(forecast.mesAtual.receitas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Despesas até agora</span>
                <span className="text-red-400 font-semibold">{fmt(forecast.mesAtual.despesas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Despesas projetadas</span>
                <span className="text-orange-400 font-semibold">{fmt(forecast.mesAtual.despesasProjetadas)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400 text-sm">Saldo previsto no fim do mês</span>
                <span className={`font-bold text-lg ${forecast.saldoPrevisto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {forecast.saldoPrevisto >= 0 ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />}
                  {fmt(forecast.saldoPrevisto)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Sem dados suficientes</p>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="bg-dark-300 rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-4">Detalhamento por categoria</h2>
          <div className="space-y-2">
            {categories.map((c, i) => {
              const total = categories.reduce((s, x) => s + x.value, 0);
              const pct = total > 0 ? (c.value / total) * 100 : 0;
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-300 text-sm flex-1">{c.name}</span>
                  <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-gray-400 text-sm w-16 text-right">{fmt(c.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
