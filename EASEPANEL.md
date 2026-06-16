# Deploy no EasePanel

## 1. Crie dois serviços no EasePanel

### Serviço 1 — Backend

| Campo | Valor |
|---|---|
| Nome | `financeia-backend` |
| Tipo | **App** |
| Fonte | GitHub → `victor934034/Finzy` |
| Branch | `main` |
| Root directory | `backend` |
| Porta | `3001` |

**Variáveis de Ambiente:**
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://SEU-DOMINIO-FRONTEND.easepanel.host
SUPABASE_URL=https://SEU_ID.supabase.co
SUPABASE_SERVICE_KEY=sua_service_role_key
OPENAI_API_KEY=sua_chave_openai        # ou ANTHROPIC / GEMINI
PLUGGY_CLIENT_ID=                      # opcional
PLUGGY_CLIENT_SECRET=                  # opcional
```

---

### Serviço 2 — Frontend

| Campo | Valor |
|---|---|
| Nome | `financeia-frontend` |
| Tipo | **App** |
| Fonte | GitHub → `victor934034/Finzy` |
| Branch | `main` |
| Root directory | `frontend` |
| Porta | `80` |

**Variáveis de Ambiente:**
```
SUPABASE_URL=https://SEU_ID.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_publica
API_URL=https://SEU-DOMINIO-BACKEND.easepanel.host
```

> A variável `API_URL` aponta para o domínio do backend no EasePanel.
> Se deixar vazio, o nginx tenta proxy interno (só funciona se frontend e backend estão no mesmo container).

---

## 2. Banco de Dados (Supabase)

Execute `supabase/setup_completo.sql` no SQL Editor do Supabase (uma única vez).

No painel do Supabase:
- **Authentication > Providers > Email** → desmarque "Confirm email" (opcional para dev)
- **Authentication > URL Configuration > Redirect URLs** → adicione o domínio do frontend no EasePanel

---

## 3. Segurança multi-usuário

Já garantida em duas camadas:

1. **Supabase RLS** — cada tabela tem política `auth.uid() = user_id`; mesmo com acesso direto ao banco, um usuário só vê seus dados

2. **Backend JWT** — o middleware `auth.js` valida o token com Supabase antes de qualquer operação; todos os controllers filtram explicitamente por `req.user.id`

Nenhum dado de um usuário aparece para outro.
