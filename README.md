# Finzy IA — Gestão Financeira com Inteligência Artificial

Sistema completo de gestão financeira pessoal, com IA conversacional, análise de dados, gráficos e app Android nativo.

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express (ESM) |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| IA | Claude (Anthropic) → OpenAI → Gemini (fallback automático) |
| App Android | Kotlin + Jetpack Compose + Retrofit |
| Deploy | Docker + Easypanel |

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| Autenticação | Login e cadastro com Supabase Auth (JWT) |
| Dashboard | Resumo financeiro do mês com gráfico de barras e insight da IA |
| Transações | CRUD completo com categorização automática por IA |
| Gastos Fixos | Cadastro de despesas recorrentes (aluguel, assinaturas, etc.) |
| Metas | Criação e acompanhamento de metas financeiras com barra de progresso |
| **Analytics** | **Tendência 6 meses, despesa por categoria e previsão de saldo** |
| Investimentos | Carteira de investimentos com análise de rentabilidade |
| Chat IA | Chat com memória por usuário — cria/edita transações por linguagem natural |
| Notificações | Alertas automáticos (meta atingida, despesa alta, etc.) |
| App Android | App nativo Kotlin conectado ao mesmo backend |

---

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Pelo menos uma chave de IA: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` ou `GEMINI_API_KEY`

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

Os scripts instalam dependências e abrem o navegador automaticamente.

---

## Configuração Manual — Passo a Passo

### 1. Banco de dados (Supabase)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com)
2. Abra **SQL Editor** e execute o arquivo **`supabase/setup_completo.sql`**
   - Cria todas as tabelas, índices e políticas de segurança (RLS)
3. Em **Authentication → Providers → Email** → desmarque **"Confirm email"**
4. Anote a **URL do projeto** e as chaves **anon** e **service_role** (em Project Settings → API)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas chaves (veja seção abaixo)
npm run dev
# Servidor rodando em http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edite .env com suas chaves
npm run dev
# Acesse http://localhost:5173
```

---

## Variáveis de Ambiente

### `backend/.env`

```env
# Pelo menos uma chave de IA é obrigatória
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# Supabase
SUPABASE_URL=https://SEU_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # chave service_role (NÃO a anon)

# Servidor
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_SUPABASE_URL=https://SEU_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # chave anon (pública)
VITE_API_URL=http://localhost:3001
```

---

## Dados de Demonstração

Para popular o banco com dados realistas antes de uma apresentação:

```bash
# 1. Abra o Supabase SQL Editor
# 2. Execute: supabase/demo_data.sql
# (Requer que um usuário já exista — crie a conta primeiro e anote o UUID)
```

O script insere 6 meses de transações, investimentos, gastos fixos e metas,
deixando os gráficos do Analytics visualmente completos.

---

## Deploy com Docker

```bash
# Preencha backend/.env com as chaves de produção
docker-compose up --build -d
```

- Frontend: `http://localhost` (porta 80)
- Backend: `http://localhost:3001`
- O nginx faz proxy de `/api` para o backend automaticamente

Para parar: `docker-compose down`

---

## API — Endpoints Principais

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Status do servidor |
| `GET` | `/api/dashboard/summary` | Resumo financeiro do mês |
| `GET/POST/PUT/DELETE` | `/api/transactions` | CRUD de transações |
| `GET/POST/PUT/DELETE` | `/api/gastos-fixos` | CRUD de gastos fixos |
| `GET/POST/PUT/DELETE` | `/api/metas` | CRUD de metas |
| `GET/POST/PUT/DELETE` | `/api/investments` | CRUD de investimentos |
| `GET` | `/api/analytics/trends` | Tendência receitas/despesas (6 meses) |
| `GET` | `/api/analytics/categories` | Despesas por categoria (mês atual) |
| `GET` | `/api/analytics/forecast` | Previsão de saldo baseada em média histórica |
| `GET` | `/api/ai/chat/history` | Histórico do chat por usuário |
| `POST` | `/api/ai/chat` | Mensagem para a IA (com memória por usuário) |
| `GET` | `/api/notificacoes` | Lista de notificações |

---

## Estrutura do Projeto

```
finzy/
├── iniciar.ps1              # script de início — Windows
├── iniciar.sh               # script de início — Linux/Mac
├── docker-compose.yml
├── supabase/
│   ├── setup_completo.sql   # EXECUTE ESTE para criar o banco
│   └── demo_data.sql        # dados de demonstração para apresentação
├── backend/
│   ├── index.js             # servidor Express
│   ├── .env.example
│   ├── routes/              # ai, analytics, dashboard, transactions,
│   │                        # investments, gastos-fixos, metas, notificacoes
│   ├── controllers/         # lógica de negócio + analyticsController
│   ├── middleware/           # autenticação JWT (Supabase)
│   └── services/            # supabase, aiService (multi-provider), alertsService
├── frontend/
│   ├── .env.example
│   └── src/
│       ├── pages/           # Dashboard, Transações, Analytics, Chat, Metas...
│       ├── components/      # Layout (Sidebar, MobileNav), UI
│       └── services/        # api.js (axios), supabase.js
└── app/                     # App Android (Kotlin + Jetpack Compose)
    └── src/main/java/com/example/finzy/
        ├── data/            # models, network (Retrofit), repository, preferences
        └── ui/              # screens, viewmodels, theme, components
```

---

## Análise de Dados — Como Funciona

O módulo Analytics implementa três análises sobre os dados do usuário:

**1. Tendência de 6 meses** (`/api/analytics/trends`)
Agrega receitas e despesas mês a mês nos últimos 6 meses. Permite identificar padrões de comportamento financeiro — meses com mais gastos, sazonalidade de receitas.

**2. Distribuição por categoria** (`/api/analytics/categories`)
Soma todas as despesas do mês atual agrupadas por categoria. Evidencia onde o dinheiro é mais gasto (alimentação, transporte, lazer, etc.).

**3. Previsão de saldo** (`/api/analytics/forecast`)
Calcula a média de receitas e despesas dos últimos 3 meses. Projeta as despesas do mês atual com base na proporção de dias transcorridos, estimando o saldo ao final do mês.

Esses dados são exibidos no frontend em:
- **Gráfico de barras** (Recharts) — comparação mensal receitas vs despesas
- **Gráfico de pizza** — distribuição de gastos por categoria
- **Cards de previsão** — saldo previsto e alertas de tendência

---

## Considerações Finais

O projeto Finzy IA integra as três frentes do trabalho:

- **Desenvolvimento Web (Front-end + Back-end):** aplicação React com API REST Express, autenticação JWT via Supabase, deploy Docker em nuvem (Easypanel).
- **Banco de Dados:** PostgreSQL gerenciado pelo Supabase com Row Level Security garantindo isolamento total dos dados por usuário. Cada usuário acessa apenas seus próprios registros.
- **Ciência de Dados / IA:** módulo Analytics com agregações históricas e modelo preditivo simples (média móvel de 3 meses); assistente IA com fallback multi-provider (Claude → OpenAI → Gemini) e memória persistente por usuário no banco de dados.

O maior desafio técnico foi garantir a segurança dos dados com RLS e a consistência da memória da IA por usuário, evitando que conversas de um usuário influenciassem respostas de outro.
