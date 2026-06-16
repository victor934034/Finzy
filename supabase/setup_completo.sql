-- ============================================================
-- FinanceIA — Setup Completo do Banco de Dados
-- Execute este arquivo uma única vez no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

-- Transações pessoais
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo        VARCHAR(10)  NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor       DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
  categoria   VARCHAR(50)  NOT NULL DEFAULT 'Outros',
  descricao   TEXT         NOT NULL,
  data        DATE         NOT NULL,
  fonte       TEXT         DEFAULT 'manual',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Investimentos
CREATE TABLE IF NOT EXISTS public.investments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome            VARCHAR(100)  NOT NULL,
  tipo            VARCHAR(50)   NOT NULL,
  valor_investido DECIMAL(12,2) NOT NULL CHECK (valor_investido >= 0),
  valor_atual     DECIMAL(12,2),
  data_inicio     DATE          NOT NULL,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- Lançamentos do negócio
CREATE TABLE IF NOT EXISTS public.business_entries (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo        VARCHAR(10)   NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  valor       DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
  categoria   VARCHAR(50)   NOT NULL DEFAULT 'Outros',
  descricao   TEXT          NOT NULL,
  data        DATE          NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Insights gerados pela IA
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight     TEXT        NOT NULL,
  tipo        VARCHAR(50) NOT NULL DEFAULT 'geral',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico do chat com IA
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens de integração (Gmail OAuth, Pluggy item IDs)
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider      TEXT        NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  token_expiry  TIMESTAMPTZ,
  metadata      JSONB       DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Gastos fixos (despesas recorrentes)
CREATE TABLE IF NOT EXISTS public.gastos_fixos (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  descricao        TEXT          NOT NULL,
  valor            DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
  categoria        VARCHAR(50)   NOT NULL DEFAULT 'Outros',
  dia_vencimento   INT           NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  frequencia       VARCHAR(20)   NOT NULL DEFAULT 'mensal'
                     CHECK (frequencia IN ('semanal','quinzenal','mensal','trimestral','semestral','anual')),
  ativo            BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- Metas financeiras
CREATE TABLE IF NOT EXISTS public.metas (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo       VARCHAR(100)  NOT NULL,
  descricao    TEXT,
  tipo         VARCHAR(50)   NOT NULL DEFAULT 'outros'
                 CHECK (tipo IN ('poupança','quitar_dívida','compra','investimento','viagem','emergência','outros')),
  valor_alvo   DECIMAL(12,2) NOT NULL CHECK (valor_alvo > 0),
  valor_atual  DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (valor_atual >= 0),
  prazo        DATE,
  concluida    BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- Notificações do sistema / IA
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo     VARCHAR(100) NOT NULL,
  mensagem   TEXT         NOT NULL,
  tipo       VARCHAR(30)  NOT NULL DEFAULT 'info'
               CHECK (tipo IN ('alerta','meta','gasto_fixo','info')),
  lida       BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — cada usuário vê só os seus dados
-- ============================================================

ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_fixos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes       ENABLE ROW LEVEL SECURITY;

-- Políticas (DROP IF EXISTS antes de criar, para rodar idempotente)
DO $$ BEGIN
  DROP POLICY IF EXISTS "rls_transactions"       ON public.transactions;
  DROP POLICY IF EXISTS "rls_investments"        ON public.investments;
  DROP POLICY IF EXISTS "rls_business_entries"   ON public.business_entries;
  DROP POLICY IF EXISTS "rls_ai_insights"        ON public.ai_insights;
  DROP POLICY IF EXISTS "rls_chat_messages"      ON public.chat_messages;
  DROP POLICY IF EXISTS "rls_integration_tokens" ON public.integration_tokens;
  DROP POLICY IF EXISTS "rls_gastos_fixos"       ON public.gastos_fixos;
  DROP POLICY IF EXISTS "rls_metas"              ON public.metas;
  DROP POLICY IF EXISTS "rls_notificacoes"       ON public.notificacoes;
END $$;

CREATE POLICY "rls_transactions"
  ON public.transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_investments"
  ON public.investments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_business_entries"
  ON public.business_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_ai_insights"
  ON public.ai_insights FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_chat_messages"
  ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_integration_tokens"
  ON public.integration_tokens FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_gastos_fixos"
  ON public.gastos_fixos FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_metas"
  ON public.metas FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "rls_notificacoes"
  ON public.notificacoes FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES — performance em buscas frequentes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tx_user_data      ON public.transactions(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_tx_tipo           ON public.transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_tx_categoria      ON public.transactions(categoria);
CREATE INDEX IF NOT EXISTS idx_inv_user          ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_biz_user_data     ON public.business_entries(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user_date    ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user     ON public.ai_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_user_prov  ON public.integration_tokens(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_gastos_user       ON public.gastos_fixos(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_metas_user        ON public.metas(user_id, concluida);
CREATE INDEX IF NOT EXISTS idx_notif_user_lida   ON public.notificacoes(user_id, lida, created_at DESC);

-- ============================================================
-- DADOS DE TESTE (opcional — remova os comentários para inserir)
-- ============================================================
-- Para testar sem precisar cadastrar manualmente, substitua
-- '00000000-0000-0000-0000-000000000000' pelo seu user_id real
-- (disponível em Authentication > Users no painel do Supabase)

/*
DO $$
DECLARE v_user UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO public.transactions (user_id, tipo, valor, categoria, descricao, data) VALUES
    (v_user, 'receita', 5000.00, 'Negócio',     'Salário',             CURRENT_DATE - 15),
    (v_user, 'despesa',  250.00, 'Alimentação', 'Supermercado',        CURRENT_DATE - 10),
    (v_user, 'despesa',  150.00, 'Transporte',  'Combustível',         CURRENT_DATE - 8),
    (v_user, 'despesa',  800.00, 'Outros',      'Aluguel',             CURRENT_DATE - 5),
    (v_user, 'receita', 1200.00, 'Negócio',     'Freelance projeto X', CURRENT_DATE - 3),
    (v_user, 'despesa',   89.90, 'Lazer',       'Streaming + gym',     CURRENT_DATE - 2),
    (v_user, 'despesa',   45.00, 'Saúde',       'Farmácia',            CURRENT_DATE - 1);

  INSERT INTO public.investments (user_id, nome, tipo, valor_investido, valor_atual, data_inicio) VALUES
    (v_user, 'Tesouro Selic 2027', 'Renda Fixa',  3000.00, 3180.00, CURRENT_DATE - 180),
    (v_user, 'BOVA11',             'FII/ETF',     2000.00, 2240.00, CURRENT_DATE - 90),
    (v_user, 'CDB Banco Inter',    'Renda Fixa',  5000.00, 5350.00, CURRENT_DATE - 60);
END $$;
*/

-- ============================================================
-- CONFIGURAÇÃO DO SUPABASE (faça no painel, não via SQL)
-- ============================================================
-- 1. Authentication > Providers > Email
--    ✅ Enable Email Provider
--    ☐ Confirm email (DESMARQUE para dev local sem e-mail)
--
-- 2. Authentication > URL Configuration > Redirect URLs
--    Adicione: http://localhost:5173
--    Adicione: http://localhost:5173/**
--
-- 3. (Produção) Adicione também a URL do seu domínio final.
-- ============================================================

SELECT 'Setup concluído com sucesso!' AS status;
