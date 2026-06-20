# ============================================
# Script para iniciar os servidores do Portal
# ============================================

Write-Host ""
Write-Host "===== PORTAL JACARE TUCUCU - INICIALIZACAO =====" -ForegroundColor Cyan
Write-Host ""

# Kill any existing Node processes
Write-Host "[1/3] Limpando processos Node anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start painel-dm on port 3000
Write-Host "[2/3] Iniciando painel-dm (porta 3000)..." -ForegroundColor Yellow
$painel_path = Join-Path $PSScriptRoot "painel-dm"
Push-Location $painel_path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
Pop-Location
Start-Sleep -Seconds 8

# Start portal on port 8000
Write-Host "[3/3] Iniciando portal (porta 8000)..." -ForegroundColor Yellow
Push-Location $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m http.server 8000" -WindowStyle Normal
Pop-Location

Write-Host ""
Write-Host "✅ Painel-DM: http://localhost:3000" -ForegroundColor Green
Write-Host "✅ Portal: http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Abra seu navegador e acesse: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar os servidores, feche as janelas do PowerShell" -ForegroundColor Yellow
Write-Host ""
