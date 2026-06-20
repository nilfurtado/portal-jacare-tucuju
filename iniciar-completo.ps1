# Script para iniciar Portal + Painel + Monitor de Saúde

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Iniciando Sistema Completo: Portal + Painel + Monitor    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Matar processos anteriores
Write-Host "🛑 Parando processos anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$caminhoRaiz = "c:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\site de noticias"

# Iniciar Portal (8000)
Write-Host "🌐 Iniciando Portal (porta 8000)..." -ForegroundColor Green
cd $caminhoRaiz
Start-Process node "server.js" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Iniciar Painel (3000)
Write-Host "📊 Iniciando Painel (porta 3000)..." -ForegroundColor Green
cd "$caminhoRaiz\painel-dm"
Start-Process node "server.js" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Iniciar Monitor (com saída visível)
Write-Host "🔍 Iniciando Monitor de Saúde..." -ForegroundColor Green
cd $caminhoRaiz
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node monitor-saude.js"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ SISTEMA COMPLETO INICIADO!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Endpoints Disponíveis:" -ForegroundColor Cyan
Write-Host "   🌐 Portal: http://localhost:8000" -ForegroundColor White
Write-Host "   📊 Painel: http://localhost:3000/painel/noticias/" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Monitoramento Ativo:" -ForegroundColor Cyan
Write-Host "   • Verifica saúde a cada 5 segundos" -ForegroundColor White
Write-Host "   • Alerta se servidor cair" -ForegroundColor White
Write-Host "   • Verifica integridade do banco" -ForegroundColor White
Write-Host ""
