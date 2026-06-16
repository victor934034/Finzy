import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, RefreshCw, CheckCircle2, Search, Pencil, Trash2, Building2 } from 'lucide-react';
import { aiApi } from '../services/api.js';
import { useToast, ToastContainer } from '../components/ui/Toast.jsx';

const SUGESTOES = [
  'Quanto tenho no banco?',
  'Quanto gastei esse mês?',
  'Estou no lucro ou prejuízo?',
  'O que posso cortar nos gastos?',
  'Como está minha carteira de investimentos?',
  'Me dê dicas para economizar mais.',
];

const ACTION_ICONS = {
  criar_transacao: CheckCircle2,
  listar_transacoes: Search,
  atualizar_transacao: Pencil,
  excluir_transacao: Trash2,
  consultar_saldo_bancario: Building2,
};

const ACTION_LABELS = {
  criar_transacao: 'Criou transação',
  listar_transacoes: 'Buscou transações',
  atualizar_transacao: 'Atualizou transação',
  excluir_transacao: 'Excluiu transação',
  consultar_saldo_bancario: 'Consultou saldo bancário',
};

function ActionChips({ actions }) {
  if (!actions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {actions.map((a, i) => {
        const Icon = ACTION_ICONS[a.tool] || CheckCircle2;
        const ok = a.result?.sucesso !== false;
        return (
          <span key={i} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${ok ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
            <Icon size={10} />
            {ACTION_LABELS[a.tool] || a.tool}
            {a.result?.mensagem ? `: ${a.result.mensagem.slice(0, 60)}` : ''}
          </span>
        );
      })}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-1">
          <Sparkles size={16} className="text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? '' : 'space-y-1'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-dark-300 text-gray-200 border border-white/5 rounded-bl-md'
        }`}>
          <p className="whitespace-pre-line">{msg.content}</p>
        </div>
        {!isUser && <ActionChips actions={msg.actions} />}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-dark-50 flex items-center justify-center shrink-0 mt-1">
          <User size={16} className="text-gray-400" />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Sou a FinIA, sua assistente financeira com IA. Tenho acesso aos seus dados financeiros e posso responder perguntas sobre seus gastos, receitas, investimentos e muito mais. Como posso ajudar?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { show } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const messagesToSend = newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0);
      const res = await aiApi.chat(messagesToSend);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response, actions: res.actions || [] }]);
    } catch (err) {
      const msg = err.message?.includes('chave de API') || err.message?.includes('API key')
        ? 'Nenhuma chave de IA configurada. Adicione ANTHROPIC_API_KEY, OPENAI_API_KEY ou GEMINI_API_KEY no backend/.env e reinicie o servidor.'
        : err.message || 'Erro ao enviar mensagem. Tente novamente.';
      show(msg, 'error');
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: 'Conversa reiniciada. Como posso ajudar?' }]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <ToastContainer />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Chat com FinIA</h1>
          <p className="text-gray-400 text-sm mt-0.5">Pergunte qualquer coisa sobre suas finanças</p>
        </div>
        <button onClick={clearChat} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={16} /> Limpar
        </button>
      </div>

      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Sugestões de perguntas:</p>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="text-xs bg-dark-300 hover:bg-primary/10 hover:text-primary border border-white/5 hover:border-primary/20 text-gray-400 px-3 py-1.5 rounded-full transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-primary animate-pulse" />
            </div>
            <div className="bg-dark-300 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-3">
        <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Pergunte sobre seus gastos, investimentos..."
          className="input flex-1"
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 disabled:opacity-50">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
