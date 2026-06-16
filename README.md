# FinanceIA

Aplicativo completo de gestão financeira com Inteligência Artificial.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + PWA |
| Backend | Node.js + Express |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| IA | Claude (Anthropic) → OpenAI → Gemini (fallback automático) |
| Open Finance | Pluggy SDK (conexão bancária) |
| Deploy | Docker + docker-compose |

---

## Início Rápido (Dev Local)

### Windows

```powershell
.\iniciar.ps1
```

### Linux / Mac

```bash
chmod +x iniciar.sh && ./iniciar.sh
```

Ambos os scripts instalam dependências automaticamente e abrem o navegador.

---

## Configuração Manual

### 1. Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Abra **SQL Editor** e execute **`supabase/setup_completo.sql`** (contém tudo: tabelas, RLS e índices)
3. Em **Authentication > Providers > Email** → desmarque **"Confirm email"** (para dev local)
4. Em **Authentication > URL Configuration** → adicione `http://localhost:5173` em Redirect URLs

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # edite com suas chaves
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # edite com suas chaves
npx vite --port 5173
```

---

## Variáveis de Ambiente

### `backend/.env`
```env
OPENAI_API_KEY=            # ou ANTHROPIC_API_KEY / GEMINI_API_KEY
SUPABASE_URL=https://SEU_ID.supabase.co
SUPABASE_SERVICE_KEY=...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`
```env
VITE_SUPABASE_URL=https://SEU_ID.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:3001
```

---

## Deploy com Docker

```bash
# Preencha backend/.env com as chaves de produção
# Substitua FRONTEND_URL pelo domínio real

docker-compose up --build -d
```

Após o build:
- Frontend: `http://localhost` (porta 80)
- Backend: `http://localhost:3001`
- O nginx do frontend já faz proxy de `/api` para o backend

Para parar: `docker-compose down`

---

## Deploy em Nuvem

| Serviço | Para quê | Plano gratuito |
|---|---|---|
| [Railway](https://railway.app) | Backend Node.js | 500 h/mês |
| [Vercel](https://vercel.com) | Frontend React | Ilimitado |
| [Render](https://render.com) | Backend Node.js | 750 h/mês |

**Vercel (frontend):**
```bash
cd frontend && npx vercel --prod
# Defina VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL nas env vars do projeto
```

**Railway (backend):**
1. Conecte o repositório no Railway
2. Aponte o root directory para `/backend`
3. Adicione todas as variáveis de `backend/.env.example`

---

## Funcionalidades

- **Autenticação** — Login/cadastro com Supabase Auth
- **Dashboard** — Resumo financeiro + gráficos + saldo bancário real (Pluggy) + análise IA
- **Transações** — CRUD com categorização automática por IA
- **Investimentos** — Carteira com análise e recomendações da IA
- **Negócio** — Financeiro empresarial + previsão de fluxo de caixa
- **Chat IA** — Converse e comande: crie/edite/exclua transações por texto; consulte saldo bancário
- **Integrações** — Gmail (lê e-mails bancários), Pluggy (Open Finance), OFX/CSV import
- **PWA** — Funciona como app no celular, inclusive offline

---

## Estrutura do Projeto

```
finzy/
├── iniciar.ps1              # script Windows
├── iniciar.sh               # script Linux/Mac
├── docker-compose.yml       # deploy Docker
├── supabase/
│   ├── setup_completo.sql   # EXECUTE ESTE no Supabase
│   └── schema.sql           # referência (já incluído no setup_completo)
├── backend/
│   ├── index.js             # servidor Express
│   ├── .env.example
│   ├── Dockerfile
│   ├── routes/              # endpoints da API
│   ├── controllers/         # lógica de negócio
│   ├── middleware/          # autenticação JWT
│   └── services/            # Supabase, IA, Gmail, Pluggy, importações
└── frontend/
    ├── .env.example
    ├── Dockerfile
    ├── nginx.conf           # proxy para Docker
    └── src/
        ├── pages/           # Auth, Dashboard, Transações, Investimentos, Negócio, Chat, Integrações
        ├── components/      # Layout, UI reutilizável
        ├── services/        # API client (axios), Supabase
        └── store/           # Zustand (auth)
```

---

## API — Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Status do servidor |
| `POST` | `/api/ai/chat` | Chat com IA (ferramenta completa) |
| `GET` | `/api/dashboard/summary` | Resumo financeiro |
| `GET/POST/PUT/DELETE` | `/api/transactions` | CRUD transações |
| `GET/POST/PUT/DELETE` | `/api/investments` | CRUD investimentos |
| `GET/POST/PUT/DELETE` | `/api/business` | CRUD negócio |
| `GET` | `/api/integrations/pluggy/balances` | Saldo bancário real |
| `POST` | `/api/integrations/pluggy/sync` | Importar transações do banco |
| `POST` | `/api/integrations/gmail/sync` | Importar via e-mail bancário |
| `POST` | `/api/integrations/import/preview` | Preview OFX/CSV |
