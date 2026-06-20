@echo off
REM ============================================
REM Script para iniciar os servidores do Portal
REM ============================================

echo.
echo ===== PORTAL JACARE TUCUCU - INICIALIZACAO =====
echo.

REM Kill any existing Node processes
echo [1/4] Limpando processos Node anteriores...
taskkill /F /IM node.exe >nul 2>&1

timeout /t 2 /nobreak

REM Start painel-dm on port 3000
echo [2/4] Iniciando painel-dm (porta 3000)...
cd /d "%~dp0painel-dm"
start "Painel-DM" cmd /k npm start

timeout /t 5 /nobreak

REM Start portal on port 8000
echo [3/4] Iniciando portal (porta 8000)...
cd /d "%~dp0"
python -m http.server 8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Tentando com python3...
    python3 -m http.server 8000 >nul 2>&1
)

echo [4/4] Servidores iniciados!
echo.
echo ✅ Painel-DM: http://localhost:3000
echo ✅ Portal: http://localhost:8000
echo.
echo Pressione CTRL+C para parar os servidores
echo.

pause
