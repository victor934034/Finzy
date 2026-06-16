#!/bin/bash
# ============================================================
# FinanceIA — Script de Inicialização (Linux/Mac)
# Uso: chmod +x iniciar.sh && ./iniciar.sh
# ============================================================

echo ""
echo "========================================"
echo "   FinanceIA — Iniciando servidores     "
echo "========================================"
echo ""

# Verificar node_modules
if [ ! -d "backend/node_modules" ]; then
  echo "[1/2] Instalando dependencias do backend..."
  (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "[2/2] Instalando dependencias do frontend..."
  (cd frontend && npm install)
fi

# Verificar .env
if [ ! -f "backend/.env" ]; then
  echo ""
  echo "[AVISO] backend/.env nao encontrado!"
  echo "  Copie backend/.env.example para backend/.env e preencha as chaves."
  echo ""
fi

if [ ! -f "frontend/.env" ]; then
  echo ""
  echo "[AVISO] frontend/.env nao encontrado!"
  echo "  Copie frontend/.env.example para frontend/.env e preencha as chaves."
  echo ""
fi

# Iniciar backend em background
echo "Iniciando Backend na porta 3001..."
(cd backend && node index.js) &
BACKEND_PID=$!

sleep 2

# Iniciar frontend em background
echo "Iniciando Frontend na porta 5173..."
(cd frontend && npx vite --port 5173) &
FRONTEND_PID=$!

sleep 3

echo ""
echo "========================================"
echo "  Frontend: http://localhost:5173       "
echo "  Backend:  http://localhost:3001       "
echo "  Saude:    http://localhost:3001/health"
echo "========================================"
echo ""
echo "Pressione Ctrl+C para parar os servidores."
echo ""

# Abrir no navegador (Mac)
if command -v open &> /dev/null; then
  open http://localhost:5173
# Abrir no navegador (Linux com xdg-open)
elif command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:5173
fi

# Aguardar encerramento
wait $BACKEND_PID $FRONTEND_PID
