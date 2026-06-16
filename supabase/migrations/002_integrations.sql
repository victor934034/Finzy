-- Coluna para rastrear origem das transações
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'manual';

-- Tokens de integração (Gmail OAuth, Pluggy item IDs)
CREATE TABLE IF NOT EXISTS integration_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  token_expiry  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integration tokens"
  ON integration_tokens FOR ALL
  USING (auth.uid() = user_id);
