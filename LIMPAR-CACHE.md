# 🔄 LIMPAR CACHE DO NAVEGADOR

O navegador está servindo uma versão antiga do arquivo. Siga estes passos:

## Opção 1: Hard Refresh (Mais Rápido)

### Windows/Linux (Chrome, Firefox, Edge):
```
CTRL + SHIFT + R
```

### macOS (Chrome, Firefox, Edge):
```
CMD + SHIFT + R
```

### Safari (macOS):
```
CMD + OPTION + R
```

---

## Opção 2: Limpar Cache Completo

### Chrome:
1. Clique em ⋮ (menu)
2. Mais ferramentas → Limpar dados de navegação
3. Selecione "Todos os períodos"
4. Marque "Cookies e outros dados de site"
5. Clique "Limpar dados"

### Firefox:
1. Clique em ☰ (menu)
2. Histórico → Limpar histórico recente
3. Selecione "Tudo"
4. Clique "Limpar agora"

### Safari:
1. Safari → Preferências
2. Aba "Privacidade"
3. Clique "Gerenciar dados do site"
4. Selecione localhost
5. Clique "Remover"

---

## Opção 3: DevTools (Sem Cache)

1. Abra DevTools (F12)
2. Clique em Settings ⚙️ (canto superior direito)
3. Marque "Disable cache (while DevTools is open)"
4. Recarregue a página (F5)

---

## Teste Depois de Limpar

1. Acesse: `http://localhost:3000/painel/noticias/importadas/`
2. Abra DevTools (F12) → Console
3. Clique em "Novo Feed"
4. Insira URL: `http://feeds.reuters.com/reuters/businessNews`
5. Clique "Validar Feed"

### Esperado:
```
✅ Categorias carregadas: 11
✓ Feed validado com sucesso!
```

### Se ainda der erro:
```
❌ :3000/painel/api/... 404
```
Significa que ainda há cache. Tente Opção 2 (limpar cache completo).

---

## Verificação

No Console (F12), você deve ver:
```
POST /api/rss-feeds/validate 200 OK
```

E NÃO deve ver:
```
404 /painel/api/rss-feeds/validate
```
