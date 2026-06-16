import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
};

const colors = {
  success: 'border-primary/30 bg-primary/10 text-primary',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
};

let addToast = null;

export function useToast() {
  const show = useCallback((message, type = 'success') => {
    addToast?.({ message, type, id: Date.now() });
  }, []);
  return { show };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  addToast = (toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 4000);
  };

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full">
      {toasts.map(({ id, message, type }) => {
        const Icon = icons[type];
        return (
          <div key={id} className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg animate-in slide-in-from-right ${colors[type]}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-white flex-1">{message}</p>
            <button onClick={() => remove(id)} className="text-gray-400 hover:text-white"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}
