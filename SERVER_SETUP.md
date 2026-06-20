# 🚀 Iniciando os Servidores do Portal

## Opção 1: Script PowerShell (Recomendado)

```powershell
.\Start-Servers.ps1
```

Ou no PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\Start-Servers.ps1
```

## Opção 2: Script Batch

Duplo-clique em:
```
START_SERVERS.bat
```

## Opção 3: Manual (Terminal)

### Terminal 1: Painel-DM (Porta 3000)
```bash
cd painel-dm
npm start
```

### Terminal 2: Portal (Porta 8000)
```bash
python -m http.server 8000
# ou python3 -m http.server 8000
```

## ✅ Verificação

Quando os servidores estão rodando:

- **Painel-DM**: http://localhost:3000
- **Portal**: http://localhost:8000

Você deveria ver no console:
```
✅ Painel DM rodando em http://localhost:3000
```

## 🔧 Solução de Problemas

### Erro: "Port 3000 already in use"
```powershell
# Matar processos Node existentes
Get-Process node | Stop-Process -Force
```

### Erro: "Cannot find module"
```bash
cd painel-dm
npm install
```

### Erro: "Python not found"
Instale Python 3 ou use:
```bash
npx http-server
```

## 📝 Notas

- Os dois servidores precisam estar rodando simultaneamente
- O portal (porta 8000) faz requisições para o painel-dm (porta 3000)
- Se o painel-dm ficar offline, o portal usa dados estáticos do cache
- Use `CTRL+C` para parar os servidores

## 🐛 Debug

Se o artigo não carregar, verifique no console do navegador:
```javascript
// No DevTools Console
fetch('http://localhost:3000/api/portal/bootstrap')
  .then(r => r.json())
  .then(d => console.log('API OK:', d.noticias.length, 'notícias'))
  .catch(e => console.error('API Erro:', e.message))
```
