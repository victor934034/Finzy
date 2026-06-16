# ============================================================
# FinanceIA — Script de Inicialização (Windows)
# Uso: .\iniciar.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FinanceIA — Iniciando servidores     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se node_modules estão instalados
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "[1/2] Instalando dependencias do backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[2/2] Instalando dependencias do frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Verificar arquivos .env
if (-not (Test-Path "backend\.env")) {
    Write-Host ""
    Write-Host "[AVISO] backend\.env nao encontrado!" -ForegroundColor Red
    Write-Host "  Copie backend\.env.example para backend\.env e preencha as chaves." -ForegroundColor Yellow
    Write-Host ""
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host ""
    Write-Host "[AVISO] frontend\.env nao encontrado!" -ForegroundColor Red
    Write-Host "  Copie frontend\.env.example para frontend\.env e preencha as chaves." -ForegroundColor Yellow
    Write-Host ""
}

# Iniciar backend em nova janela
Write-Host "Iniciando Backend (porta 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'BACKEND' -ForegroundColor Green; Set-Location '$PWD\backend'; node index.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# Iniciar frontend em nova janela
Write-Host "Iniciando Frontend (porta 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'FRONTEND' -ForegroundColor Cyan; Set-Location '$PWD\frontend'; npx vite --port 5173" -WindowStyle Normal

Start-Sleep -Seconds 4

# Abrir no navegador
Write-Host ""
Write-Host "Abrindo no navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173       " -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001       " -ForegroundColor White
Write-Host "  Saude:    http://localhost:3001/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
