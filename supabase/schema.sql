-- FinanceIA - Schema do Banco de Dados Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================
-- TABELA: transactions (Transações pessoais)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(12, 2) NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'Outros',
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- TABELA: investments (Investimentos)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  valor_investido DECIMAL(12, 2) NOT NULL,
  valor_atual DECIMAL(12, 2),
  data_inicio DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- TABELA: business_entries (Lançamentos do negócio)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.business_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor DECIMAL(12, 2) NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'Outros',
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- TABELA: ai_insights (Insights gerados pela IA)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'geral',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- TABELA: chat_messages (Histórico do chat com IA)
-- ===================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
CREATE POLICY "Usuários veem apenas suas transações"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para investments
CREATE POLICY "Usuários veem apenas seus investimentos"
  ON public.investments FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para business_entries
CREATE POLICY "Usuários veem apenas seus lançamentos de negócio"
  ON public.business_entries FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para ai_insights
CREATE POLICY "Usuários veem apenas seus insights"
  ON public.ai_insights FOR ALL
  USING (auth.uid() = user_id);

-- Políticas para chat_messages
CREATE POLICY "Usuários veem apenas suas mensagens"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id);

-- ===================================================
-- ÍNDICES para performance
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_data ON public.transactions(data);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON public.transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_business_entries_user_id ON public.business_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_business_entries_data ON public.business_entries(data);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
