# 🔥 LIMPEZA COMPLETA DE CACHE

Seu navegador tem cache de uma versão anterior do arquivo. Siga **TODOS** os passos:

## OPÇÃO 1: Chrome/Edge - Limpar Cache Completo

1. Abra DevTools: **F12**
2. Clique em ⚙️ Settings (canto superior direito do DevTools)
3. Procure por "Cache" e marque: **"Disable cache (while DevTools is open)"**
4. Feche DevTools: **F12**
5. Recarregue a página: **CTRL+SHIFT+R** (Windows) ou **CMD+SHIFT+R** (Mac)
6. Abra DevTools novamente: **F12**
7. Vá para "Application" → "Cache Storage"
8. Clique com botão direito e Delete todos
9. Recarregue: **CTRL+SHIFT+R**

---

## OPÇÃO 2: Firefox - Limpar Dados de Site

1. Abra DevTools: **F12**
2. Vá para "Storage"
3. Clique em "Clear All" no canto inferior
4. Feche DevTools: **F12**
5. Recarregue: **CTRL+SHIFT+R**

---

## OPÇÃO 3: Safari (Mac)

1. Safari → Preferências
2. Aba "Privacy"
3. Clique "Gerenciar dados do site..."
4. Procure por "localhost"
5. Clique "Remover"
6. Recarregue: **CMD+SHIFT+R**

---

## OPÇÃO 4: Apagar Pasta de Cache do Sistema

### Windows:
```
C:\Users\[seu usuário]\AppData\Local\Google\Chrome\User Data\Default\Cache
```
1. Feche o Chrome completamente
2. Delete a pasta acima
3. Abra Chrome de novo

### macOS:
```
~/Library/Caches/Google/Chrome
```

---

## ✅ TESTE DEPOIS

1. Abra DevTools (F12) **ANTES** de acessar a página
2. Vá para "Network"
3. Marque "Disable cache"
4. Abra: `http://localhost:3000/painel/noticias/importadas/`
5. Clique "Novo Feed"
6. Na guia Network, procure por:
   ```
   rss-feeds/validate → 200 OK ✅
   ```
   (NÃO deve ser `/painel/api/...`)

---

## Se ainda não funcionar:

Tente acessar uma URL diferente com parâmetro de cache-buster:

```
http://localhost:3000/painel/noticias/importadas/?t=123456
```

Isso força o navegador a ignorar cache para aquela URL.

---

## Último Recurso:

Abra o DevTools e execute no Console:

```javascript
// Limpar todos os dados
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('idb');
caches.keys().then(names => names.forEach(name => caches.delete(name)));
```

Então recarregue a página.
