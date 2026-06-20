# Integração Portal ↔ Painel

Documento explicando como o portal estático (HTML/CSS/JS) conversa com o painel administrativo (PHP+MySQL ou Node+JSON).

## Visão geral

```
┌──────────────────┐                ┌──────────────────────────┐
│  Portal estático │   GET fetch    │  Painel-php (Hostinger)  │
│  index.html      ├───────────────►│  /api/portal/bootstrap   │
│  noticia.html    │                │  /api/portal/noticia/:s  │
│  ...             │  ◄─── JSON ────┤  /api/portal/voto/:e/:o  │
└────────┬─────────┘                └──────────────────────────┘
         │
         │ se backend offline →
         ▼
┌──────────────────┐
│  data/*.json     │
│  (fallback)      │
└──────────────────┘
```

## Camadas no [js/data.js](js/data.js)

1. **Cache em memória** — `loadAll()` faz apenas 1 chamada por sessão
2. **Cache em localStorage** — TTL de 60s, revalida em background (stale-while-revalidate)
3. **Backend** — `GET /api/portal/bootstrap` traz tudo em 1 request
4. **Fallback** — se backend falhar/timeout (4s), lê `data/*.json` estáticos

A API pública é **idêntica** à versão anterior. Nenhum outro arquivo do portal precisou mudar — `byCategoria`, `destaques`, `bySlug`, `maisLidas`, etc. continuam funcionando igualzinho.

## Endpoints públicos (sem auth)

| Endpoint | Uso |
|---|---|
| `GET /api/portal/bootstrap` | Pacote completo (notícias, categorias, municípios, vídeos, enquetes, classificados, colunas, config). Substitui os 8 `fetch('data/*.json')`. |
| `GET /api/portal/noticia/:slug` | Notícia individual com conteúdo completo. **Incrementa views** no servidor. |
| `GET /api/portal/categoria/:slug` | Lista paginada de notícias por editoria |
| `GET /api/portal/municipio/:slug` | Lista por município |
| `GET /api/portal/busca?q=...` | Full-text simples em título/lide/tags |
| `POST /api/portal/voto/:enqId/:opcaoId` | Registra voto em enquete |
| `GET /api/anuncios/public` | Slots ativos para `js/ads-loader.js` |
| `GET /api/config/public` | Nome do portal, redes sociais, WhatsApp |
| `GET /api/tema/public` | Tema + layout (para futuras integrações) |

## Configuração da URL base

Cada HTML do portal tem uma **meta-tag**:

```html
<meta name="painel-api" content="/painel/api">
```

### Em produção (Hostinger PHP)

Estrutura típica:

```
seudominio.com.br/                ← portal
seudominio.com.br/painel/         ← painel-php
seudominio.com.br/painel/api/...  ← API
```

Mantenha `content="/painel/api"`. O portal usa caminho relativo (mesmo domínio).

### Em subdomínio separado

Se você criar `painel.seudominio.com.br`:

```html
<meta name="painel-api" content="https://painel.seudominio.com.br/api">
```

(o CORS já está aberto na API pública)

### Em desenvolvimento local

Sem precisar mudar a meta-tag, o `data.js` detecta automaticamente:

- portal em `http://localhost:8000`
- painel-dm Node em `http://localhost:3000`

Quando hostname é `localhost:8000`, aponta para `http://localhost:3000/api` automaticamente.

## Fluxo "cadastrei no painel → apareceu no portal"

1. Editor entra no painel (`/painel/login.html`) → cadastra notícia
2. API grava no MySQL (ou JSON, no painel-dm)
3. Próximo acesso ao portal:
   - Se há cache local com menos de 60s → serve do cache + revalida em background
   - Caso contrário → busca do backend
4. Notícia aparece. **Sem rebuild, sem FTP, sem deploy.**

Para forçar refresh imediato no portal aberto, o usuário pode pressionar Ctrl+Shift+R, ou seu código chama `import('./data.js').then(m => m.reload())` (helper exposto).

## O que persistiu na arquitetura antiga (não foi removido)

- `data/*.json` continuam no projeto como **fallback de resiliência**
- Se o painel cair (manutenção, erro 500, banco offline), o portal não trava — usa os JSONs estáticos
- Útil também para SEO / crawlers: o conteúdo continua acessível

Você pode atualizar manualmente esses JSONs de vez em quando como "backup estático" — mas não é obrigatório.

## Cache busting / invalidação

| Camada | TTL | Como invalidar |
|---|---|---|
| Cache em memória (sessão) | até reload da página | F5 |
| localStorage do navegador | 60s | `Ctrl+Shift+R` ou aguardar TTL |
| Cache HTTP (`Cache-Control`) | 60s no `/bootstrap`, 120s no `/noticia/:slug` | esperar TTL |
| Cache do CDN (se Hostinger CDN ativo) | conforme configurado no painel | painel da Hostinger |

## Segurança

- Os endpoints `/api/portal/*` **não exigem token** (são públicos por design)
- Apenas operações de leitura + voto em enquete
- Todas as outras (CRUD do admin) continuam atrás do JWT em `/api/auth/login`
- O `POST /portal/voto` não tem rate-limit hoje — para produção, considere adicionar via `.htaccess` ou plugin Hostinger

## Próximos passos opcionais

- [ ] Rate-limiting nos endpoints públicos (`mod_evasive` no Apache)
- [ ] ETag / Last-Modified pra cache HTTP mais inteligente
- [ ] Server-Sent Events (`/api/portal/stream`) pra push de notícias urgentes
- [ ] Service Worker no portal: cache offline robusto
