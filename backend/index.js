import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import transactionsRouter from './routes/transactions.js';
import investmentsRouter from './routes/investments.js';
import businessRouter from './routes/business.js';
import aiRouter from './routes/ai.js';
import dashboardRouter from './routes/dashboard.js';
import integrationsRouter from './routes/integrations.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' } });
app.use('/api/', limiter);

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Limite de requisições de IA atingido. Aguarde 1 minuto.' } });

app.use('/api/transactions', transactionsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/business', businessRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/integrations', integrationsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => console.log(`🚀 FinanceIA Backend rodando na porta ${PORT}`));
