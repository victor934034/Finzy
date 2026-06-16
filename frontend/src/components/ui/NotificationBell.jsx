import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Target, CalendarClock, Info } from 'lucide-react';
import { notificacoesApi } from '../../services/api.js';

const tipoIcon = {
  alerta: AlertTriangle,
  meta: Target,
  gasto_fixo: CalendarClock,
  info: Info,
};
const tipoColor = {
  alerta: 'text-yellow-400',
  meta: 'text-primary',
  gasto_fixo: 'text-orange-400',
  info: 'text-blue-400',
};

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function load() {
    try {
      const res = await notificacoesApi.list();
      setNotifs(res.data || []);
    } catch (_) {}
  }

  async function markRead(id) {
    try {
      await notificacoesApi.markRead(id);
      setNotifs(p => p.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (_) {}
  }

  async function markAllRead() {
    try {
      await notificacoesApi.markAllRead();
      setNotifs(p => p.map(n => ({ ...n, lida: true })));
    } catch (_) {}
  }

  async function remove(id) {
    try {
      await notificacoesApi.remove(id);
      setNotifs(p => p.filter(n => n.id !== id));
    } catch (_) {}
  }

  const naoLidas = notifs.filter(n => !n.lida).length;

  // Strip the internal [ref:uuid] suffix from messages
  const cleanMsg = (msg) => msg.replace(/\s*\[ref:[^\]]+\]/g, '');

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-dark-400 flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-dark-300 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Notificações</h3>
            {naoLidas > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                <CheckCheck size={14} /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : (
              notifs.map(n => {
                const Icon = tipoIcon[n.tipo] || Info;
                const color = tipoColor[n.tipo] || 'text-gray-400';
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.lida && markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.lida ? 'bg-white/[0.03]' : ''}`}
                  >
                    <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${n.lida ? 'text-gray-400' : 'text-white'}`}>{n.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{cleanMsg(n.mensagem)}</p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.lida && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    <button
                      onClick={e => { e.stopPropagation(); remove(n.id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
