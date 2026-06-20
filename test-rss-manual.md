# 🧪 TESTE MANUAL DO FLUXO COMPLETO

## Acesso
```
URL: http://localhost:3000/painel/noticias/importadas/
```

## PASSO 1: Abrir Modal
✓ Clique no botão **"Novo Feed"** no topo direito
✓ Modal com borda laranja deve aparecer (animação slide-up)

## PASSO 2: Inserir URL
✓ Clique no campo **"URL do Feed"**
✓ Cole uma URL de feed RSS válida, ex:
   ```
   http://feeds.reuters.com/reuters/businessNews
   ```

## PASSO 3: Validar Feed
✓ Clique no botão **"Validar Feed"**
✓ Aguarde 3-5 segundos
✓ **Preview deve aparecer** com:
   - ✓ Título do feed
   - ✓ Descrição
   - ✓ Número de artigos encontrados

### Resultado Esperado:
```
Preview do Feed
├─ Título: [Nome do Feed]
├─ Descrição: [Descrição]
└─ Artigos: 42

Status: "✓ Feed validado com sucesso!"
```

## PASSO 4: Preencher Formulário
✓ Campo **"Nome do Feed"** (auto-preenchido com título)
✓ Dropdown **"Categoria"** (deve ter opções como: Política, Saúde, etc)
✓ Dropdown **"Intervalo"** (selecione "A cada 6 horas")
✓ Checkbox **"Ativar feed automaticamente"** (já marcado)

## PASSO 5: Criar Feed
✓ Clique no botão **"Criar Feed"** (verde)
✓ Aguarde 2-3 segundos
✓ Status deve mudar para: **"✓ Feed criado com sucesso!"**
✓ Modal fecha automaticamente
✓ Página recarrega com novo feed na lista

### Resultado Esperado:
```
✓ Feed criado com sucesso!

Modal fecha
↓
Página atualiza
↓
Novo feed aparece na lista de notícias importadas
```

---

## URLs de Teste (RSS Válidas)

Se o primeiro não funcionar, tente estes:

1. **Reuters Business News**
   ```
   http://feeds.reuters.com/reuters/businessNews
   ```

2. **BBC News**
   ```
   http://feeds.bbc.co.uk/news/rss.xml
   ```

3. **BBC World**
   ```
   http://feeds.bbc.co.uk/news/world/rss.xml
   ```

4. **Feed Local (de teste)**
   ```
   http://localhost:3000/test-feed.xml
   ```

---

## O que testar

- [ ] Modal abre ao clicar "Novo Feed"
- [ ] Campo URL aceita input
- [ ] Botão "Validar Feed" funciona
- [ ] Preview aparece após validação
- [ ] Categoria dropdown tem opções
- [ ] Intervalo dropdown tem opções
- [ ] Botão "Criar Feed" envia POST
- [ ] Status messages aparecem (✓ ou ❌)
- [ ] Modal fecha após sucesso
- [ ] Nova feed aparece na lista

---

## Logs do Console (F12)

Abra o DevTools (F12) e veja a aba **Console** para debug:

```javascript
✅ Categorias carregadas: 10
✓ Feed validado com sucesso!
POST /api/rss-feeds/validate 200
POST /api/rss-feeds 200
```

Se ver erros, reportar:
```
❌ Erro ao validar feed: ...
❌ Erro ao criar feed: ...
```
