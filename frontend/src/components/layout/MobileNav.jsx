import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart2, Target, MessageCircle } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Gastos' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/chat', icon: MessageCircle, label: 'Chat IA' },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-300 border-t border-white/5 px-2 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
