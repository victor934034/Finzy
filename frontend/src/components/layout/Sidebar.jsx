import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, TrendingUp, Briefcase, MessageCircle, Plug, LogOut, Sparkles, CalendarClock, Target, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/gastos-fixos', icon: CalendarClock, label: 'Gastos Fixos' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/investimentos', icon: TrendingUp, label: 'Investimentos' },
  { to: '/negocio', icon: Briefcase, label: 'Negócio' },
  { to: '/chat', icon: MessageCircle, label: 'Chat IA' },
  { to: '/integracoes', icon: Plug, label: 'Integrações' },
];

export default function Sidebar() {
  const { signOut, user } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-dark-300 border-r border-white/5 p-4">
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none">
            <span className="text-primary">Finzy</span><span className="text-white">AI</span>
          </h1>
          <p className="text-xs text-gray-500">Inteligência Financeira</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/5 w-full transition-all duration-200"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}
