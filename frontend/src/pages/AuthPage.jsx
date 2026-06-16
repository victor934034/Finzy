import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', nome: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
      } else {
        await signUp(form.email, form.password, form.nome);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Faça login ou redefina sua senha.');
        setMode('login');
      } else {
        setError(msg || 'Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 glow">
            <Sparkles size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">FinanceIA</h1>
          <p className="text-gray-400 mt-2">Inteligência financeira ao seu alcance</p>
        </div>

        <div className="card">
          <div className="flex gap-1 bg-dark-50 rounded-xl p-1 mb-6">
            <button onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-dark-300 text-white shadow' : 'text-gray-400'}`}>
              Entrar
            </button>
            <button onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'bg-dark-300 text-white shadow' : 'text-gray-400'}`}>
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Nome completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-3 text-gray-500" />
                  <input type="text" placeholder="Seu nome" value={form.nome}
                    onChange={e => set('nome', e.target.value)}
                    className="input pl-10" required={mode === 'register'} />
                </div>
              </div>
            )}

            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3 text-gray-500" />
                <input type="email" placeholder="seu@email.com" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="input pl-10" required />
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="input pl-10 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Seus dados financeiros são criptografados e seguros.
        </p>
      </div>
    </div>
  );
}
