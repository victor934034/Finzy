import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import transactionsRouter from './routes/transactions.js';
import investmentsRouter from './routes/investments.js';
import businessRouter from './routes/business.js';
import aiRouter from './routes/ai.js';
import dashboardRouter from './routes/dashboard.js';
import integrationsRouter from './routes/integrations.js';
import gastosFixosRouter from './routes/gastosFixos.js';
import metasRouter from './routes/metas.js';
import notificacoesRouter from './routes/notificacoes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const STATIC_DIR = join(__dirname, 'public');
const hasStatic = fs.existsSync(join(STATIC_DIR, 'index.html'));

app.use(helmet({
  contentSecurityPolicy: false, // React SPA com assets externos
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' } });
app.use('/api/', limiter);

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Limite de requisições de IA atingido. Aguarde 1 minuto.' } });

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/transactions', transactionsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/business', businessRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/gastos-fixos', gastosFixosRouter);
app.use('/api/metas', metasRouter);
app.use('/api/notificacoes', notificacoesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Variáveis de ambiente para o frontend (injetadas em runtime) ──────────────
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(`window.__ENV__ = {
  SUPABASE_URL: ${JSON.stringify(process.env.SUPABASE_URL || '')},
  SUPABASE_ANON_KEY: ${JSON.stringify(process.env.SUPABASE_ANON_KEY || '')},
  API_URL: "",
};`);
});

// ── Servir frontend estático (quando buildado junto no Docker) ────────────────
if (hasStatic) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && req.path !== '/health') {
      res.sendFile(join(STATIC_DIR, 'index.html'));
    }
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => console.log(`🚀 FinanceIA rodando na porta ${PORT} ${hasStatic ? '(frontend + API)' : '(apenas API)'}`));
