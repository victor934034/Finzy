import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import InvestmentsPage from './pages/InvestmentsPage.jsx';
import BusinessPage from './pages/BusinessPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import GastosFixosPage from './pages/GastosFixosPage.jsx';
import MetasPage from './pages/MetasPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import Layout from './components/layout/Layout.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="min-h-screen bg-dark-400 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="transacoes" element={<TransactionsPage />} />
          <Route path="investimentos" element={<InvestmentsPage />} />
          <Route path="negocio" element={<BusinessPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="integracoes" element={<IntegrationsPage />} />
          <Route path="gastos-fixos" element={<GastosFixosPage />} />
          <Route path="metas" element={<MetasPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
