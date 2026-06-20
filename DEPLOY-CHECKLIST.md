# 🚀 Checklist Deploy - Notícias Importadas

## URLs e Portas

### Desenvolvimento (AGORA)
```
Portal:    http://localhost:8000
Painel:    http://localhost:3000
API Painel: http://localhost:3000/api
```

### Produção (DEPLOY)
```
Portal:    https://seu-dominio.com.br
Painel:    https://painel.seu-dominio.com.br OU /painel/
API Painel: https://seu-dominio.com.br/api OU https://painel.seu-dominio.com.br/api
```

---

## Arquivos a Verificar/Ajustar

### 1. **painel-dm/public/noticias-importadas.html**
- ✓ Link de título: `/noticia.html?slug=...`
- ✓ Link de edição: `/painel/noticias.html?id=...`
- **DEPLOY:** Verificar se `/painel/` e `/noticia.html` apontam corretos

### 2. **js/data.js**
- Busca função `getApiBase()`
- **DEPLOY:** Garantir que retorna URL correta da API em produção

### 3. **painel-dm/api/portal.js**
- Endpoint: `GET /portal/noticia/:slug`
- ✓ Busca flexível (slug → normalizado → ID)
- **DEPLOY:** Nenhuma mudança necessária (usa fallbacks)

### 4. **noticia.html**
- ✓ Lê slug da query string
- ✓ Chama `fetchNoticiaCompleta(slug)`
- **DEPLOY:** Verificar carregamento de recursos CSS/JS

---

## Testes a Fazer em Produção

- [ ] Clicar título em painel → abre notícia no portal (nova aba)
- [ ] Link portal funciona com slug correto
- [ ] Views incrementam corretamente
- [ ] Modo dark/light sincronizado
- [ ] Cache funcionando (Cache-Control: 120s)

---

## Fluxo Validado ✅

```
PAINEL (noticias-importadas)
  │
  ├─ Clica TÍTULO
  │  └─ status='publicado' ? portal : painel
  │     └─ Portal: /noticia.html?slug=...
  │
  ├─ Clica EDITAR
  │  └─ /painel/noticias.html?id=...
  │
  └─ Clica REMOVER
     └─ Deleta notícia
```

---

## Campos Implementados ✅

### Painel (noticias-importadas.html)
- ✓ titulo
- ✓ capa (miniatura 100x100)
- ✓ lide (resumo 2-3 linhas)
- ✓ fonte (badge)
- ✓ categoria (badge)
- ✓ feed (badge origem RSS)
- ✓ importada (badge ✓)
- ✓ status (publicado/rascunho/agendado)
- ✓ data (com hora)
- ✓ autor
- ✓ Filtros (titulo, descricao, autor, fonte, status)
- ✓ Métricas KPI (total, importadas, pendentes, feeds)

### Portal (noticia.html)
- ✓ titulo
- ✓ capa (imagem responsiva WebP+JPEG)
- ✓ lide
- ✓ conteudo (completo)
- ✓ categoria
- ✓ data
- ✓ autor
- ✓ views (incrementa)

---

## URLs Geradas Dinamicamente

```javascript
// Painel → Portal
slug = "verdinhos-garantem-limpeza-e-organizacao"
url = "/noticia.html?slug=verdinhos-garantem-limpeza-e-organizacao"

// Em produção:
// http://seu-dominio.com.br/noticia.html?slug=verdinhos-garantem-limpeza-e-organizacao
```

---

**Quando fizer deploy, testar fluxo completo e ajustar URLs conforme infraestrutura!** 🚀
