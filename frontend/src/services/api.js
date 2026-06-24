import axios from 'axios';
import { supabase } from './supabase.js';

// Docker: API_URL vazio = mesma origem (Express serve front + API)
// Dev local: aponta para localhost:3001
const API_URL = window.__ENV__?.API_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Erro ao conectar com o servidor.';
    return Promise.reject(new Error(message));
  }
);

export const transactionsApi = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  remove: (id) => api.delete(`/transactions/${id}`),
  monthlySummary: () => api.get('/transactions/summary/monthly'),
};

export const investmentsApi = {
  list: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  remove: (id) => api.delete(`/investments/${id}`),
};

export const businessApi = {
  list: (params) => api.get('/business', { params }),
  create: (data) => api.post('/business', data),
  update: (id, data) => api.put(`/business/${id}`, data),
  remove: (id) => api.delete(`/business/${id}`),
  monthlyReport: (params) => api.get('/business/report/monthly', { params }),
};

export const aiApi = {
  chat: (message) => api.post('/ai/chat', { message }),
  history: () => api.get('/ai/chat/history'),
  categorize: (descricao) => api.post('/ai/categorize', { descricao }),
  dashboardInsight: () => api.get('/ai/insight/dashboard'),
  investmentsInsight: () => api.get('/ai/insight/investments'),
  businessInsight: (params) => api.get('/ai/insight/business', { params }),
  predictCashFlow: () => api.get('/ai/cashflow/predict'),
  providers: () => api.get('/ai/providers'),
};

export const analyticsApi = {
  trends: () => api.get('/analytics/trends'),
  categories: () => api.get('/analytics/categories'),
  forecast: () => api.get('/analytics/forecast'),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  monthlyChart: () => api.get('/dashboard/chart/monthly'),
};

export const gastosFixosApi = {
  list: () => api.get('/gastos-fixos'),
  create: (data) => api.post('/gastos-fixos', data),
  update: (id, data) => api.put(`/gastos-fixos/${id}`, data),
  remove: (id) => api.delete(`/gastos-fixos/${id}`),
};

export const metasApi = {
  list: () => api.get('/metas'),
  create: (data) => api.post('/metas', data),
  update: (id, data) => api.put(`/metas/${id}`, data),
  remove: (id) => api.delete(`/metas/${id}`),
  addProgress: (id, data) => api.post(`/metas/${id}/progress`, data),
};

export const notificacoesApi = {
  list: () => api.get('/notificacoes'),
  markRead: (id) => api.patch(`/notificacoes/${id}/read`),
  markAllRead: () => api.patch('/notificacoes/read-all'),
  remove: (id) => api.delete(`/notificacoes/${id}`),
};

export const integrationsApi = {
  // Gmail
  gmailAuthUrl: () => api.get('/integrations/gmail/auth-url'),
  gmailStatus: () => api.get('/integrations/gmail/status'),
  gmailSync: (daysBack = 30) => api.post('/integrations/gmail/sync', { daysBack }),
  gmailDisconnect: () => api.delete('/integrations/gmail'),

  // Pluggy
  pluggyConnectToken: () => api.get('/integrations/pluggy/connect-token'),
  pluggySaveItem: (itemId) => api.post('/integrations/pluggy/item', { itemId }),
  pluggyStatus: () => api.get('/integrations/pluggy/status'),
  pluggySync: (daysBack = 30) => api.post('/integrations/pluggy/sync', { daysBack }),
  pluggyRemoveItem: (itemId) => api.delete('/integrations/pluggy/item', { data: { itemId } }),
  pluggyBalances: () => api.get('/integrations/pluggy/balances'),

  // Import
  importPreview: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/integrations/import/preview', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importConfirm: (transactions) => api.post('/integrations/import/confirm', { transactions }),
};
