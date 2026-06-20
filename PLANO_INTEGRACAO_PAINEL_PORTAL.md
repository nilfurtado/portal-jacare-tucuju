# 📋 Plano de Integração Painel DM ↔ Portal de Notícias

**Data:** 2026-05-31  
**Status:** Análise e Plano  
**Objetivo:** Portal de Notícias consome 100% dos dados do Painel DM (CMS)

---

## 🏗️ Arquitetura Atual vs Proposta

### ANTES (Atual - Desintegrado)
```
Painel DM (Admin)           Portal (Frontend)
├── noticias.html           ├── Lê data/noticias.json
├── anuncios.html           ├── Lê data/anuncios.json
├── categorias.html         ├── Lê data/categorias.json
└── ... (dados estáticos)   └── ... (dados estáticos)

❌ Dados duplicados
❌ Sem sincronização
❌ Mudanças no painel não refletem no portal em tempo real
```

### DEPOIS (Proposto - Integrado)
```
Painel DM (CMS Admin)
├── API REST (porta 3000)
│   ├── GET /api/noticias
│   ├── GET /api/categorias
│   ├── GET /api/anuncios
│   ├── GET /api/classificados
│   ├── GET /api/municipios
│   ├── GET /api/colunas
│   ├── GET /api/usuarios
│   ├── GET /api/videos
│   ├── GET /api/enquetes
│   └── GET /api/config (logomarcas, temas, etc)
│
└── Banco de Dados (data/)
    └── Fonte única da verdade

Portal de Notícias (Frontend)
├── js/data.js (consome APIs)
│   ├── fetch('/api/noticias')
│   ├── fetch('/api/categorias')
│   ├── fetch('/api/anuncios')
│   └── ... (todas as APIs)
│
└── Páginas HTML
    ├── index.html (homepage com dados do API)
    ├── noticia.html (artigos do API)
    ├── categoria.html (filtro por API)
    └── ... (todas as páginas dinâmicas)

✅ Dados centralizados
✅ Sincronização automática
✅ Mudanças refletem em tempo real
```

---

## 📊 Matriz de Dados: Status de Integração

| Tipo | Dados | API Painel | Portal Consome? | Status |
|------|-------|-----------|-----------------|--------|
| **Notícias** | noticias.json | ✅ /api/noticias | ⚠️ JSON estático | 🔄 **MIGRAR** |
| **Categorias** | categorias.json | ✅ /api/categorias | ⚠️ JSON estático | 🔄 **MIGRAR** |
| **Anúncios** | anuncios.json | ✅ /api/anuncios | ❌ Não | 🔴 **FAZER** |
| **Classificados** | classificados.json | ✅ /api/classificados | ❌ Não | 🔴 **FAZER** |
| **Municípios** | municipios.json | ✅ /api/municipios | ❌ Não | 🔴 **FAZER** |
| **Colunas** | colunas.json | ✅ /api/colunas | ⚠️ Hardcoded | 🔴 **FAZER** |
| **Usuários** | usuarios.json | ✅ /api/usuarios | ❌ Não | 🔴 **FAZER** |
| **Vídeos** | videos.json | ✅ /api/videos | ⚠️ JSON estático | 🔄 **MIGRAR** |
| **Enquetes** | enquetes.json | ✅ /api/enquetes | ⚠️ JSON estático | 🔄 **MIGRAR** |
| **Páginas** | paginas.json | ✅ /api/paginas | ❌ Não | 🔴 **FAZER** |
| **Logomarcas** | config.json | ✅ /api/config | ❌ HTML hardcoded | 🔴 **FAZER** |
| **Temas** | tema-layout.json | ✅ /api/tema | ⚠️ CSS estático | 🔄 **MIGRAR** |

---

## 🔌 Fluxo de Dados: Exemplo

### Cenário: Usuário Publica Notícia

```
1️⃣ PAINEL DM (Admin)
   └─ Editor clica "Publicar notícia"
      ├─ Valida dados
      ├─ Faz upload de imagem (já integrado ✅)
      ├─ POST /api/noticias
      └─ Salva em data/noticias.json

2️⃣ API PAINEL DM
   └─ Endpoint /api/noticias responde com dados atualizados

3️⃣ PORTAL (Frontend)
   └─ js/data.js faz fetch(/api/noticias)
      ├─ Recebe dados em JSON
      ├─ Renderiza no index.html
      └─ Usuário vê notícia publicada EM TEMPO REAL ✅

⏱️ Tempo total: ~2 segundos
```

---

## 📋 Plano de Implementação (5 Fases)

### **FASE 1: Migrar Notícias (JÁ FEITO ✅)**
- ✅ API `/api/noticias` funcional
- ✅ Sistema de capas com 5 dimensões
- ✅ Meta tags OG/Twitter
- ✅ Lazy loading

**Próximo:** Atualizar `js/data.js` para consumir API em vez de JSON

---

### **FASE 2: Migrar Dados Estáticos (Categorias, Vídeos, Enquetes)**
**Arquivos afetados:**
- `js/data.js` - Trocar `fetch('data/categorias.json')` por `fetch('/api/categorias')`
- `js/data.js` - Trocar `fetch('data/videos.json')` por `fetch('/api/videos')`
- `js/data.js` - Trocar `fetch('data/enquetes.json')` por `fetch('/api/enquetes')`

**Tempo estimado:** 2-3 horas

---

### **FASE 3: Integrar Anúncios & Classificados**
**O que fazer:**
1. Criar páginas no portal: `anuncios.html`, `classificados.html`
2. Atualizar `js/render.js` com componentes para anúncios
3. Integrar dados via `/api/anuncios` e `/api/classificados`
4. Adicionar filtros por categoria de classificados

**Tempo estimado:** 4-5 horas

---

### **FASE 4: Integrar Colunas, Municípios, Usuários**
**O que fazer:**
1. Página `colunas.html` - Lista de colunistas com artigos
2. Página `municipios.html` - Notícias por município
3. Perfil de usuários (colunistas) - `usuario.html?slug=nome`
4. Consumir `/api/colunas`, `/api/municipios`, `/api/usuarios`

**Tempo estimado:** 5-6 horas

---

### **FASE 5: Integrar Logomarcas & Temas (Sistema Dinâmico)**
**O que fazer:**
1. Fazer `/api/config` retornar logomarca, favicon, temas
2. `js/logo-injector.js` - Consumir de API em vez de hardcoded
3. `css/theme.css` - Aplicar temas dinamicamente via API
4. Cache com invalidação (quando logomarca muda no painel, portal atualiza)

**Tempo estimado:** 3-4 horas

---

## 🔧 Infraestrutura Técnica

### **Backend (Painel DM)**
```javascript
// Exemplo: Endpoint de Notícias já existe em painel-dm/api/noticias.js
// GET /api/noticias → retorna data/noticias.json
// POST /api/noticias → cria nova notícia
// PUT /api/noticias/:id → edita notícia
// DELETE /api/noticias/:id → deleta notícia
```

**Status:** ✅ APIs já existem para todos os dados

### **Frontend (Portal)**
```javascript
// Arquivo: js/data.js (será modificado)
// ANTES:
const noticias = JSON.parse(await fetch('data/noticias.json').then(r => r.json()));

// DEPOIS:
const noticias = JSON.parse(await fetch('http://localhost:3000/api/noticias').then(r => r.json()));
```

**Mudanças necessárias:**
- `js/data.js` - Atualizar todas as URLs de dados
- `js/render.js` - Sem mudanças (renderização já funciona)
- `js/main.js` - Sem mudanças (lógica já existe)

---

## ⚙️ Configuração CORS

**Problema:** Portal (porta 8000) precisa acessar Painel DM (porta 3000)

**Solução:** Adicionar CORS no `painel-dm/server.js`

```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));
```

---

## 🎯 Resultado Final

### ✅ O que será alcançado:

1. **Fonte Única de Dados**
   - Painel DM = CMS centralizado
   - Portal = Frontend que consome Painel DM

2. **Sincronização em Tempo Real**
   - Publica notícia no Painel → Aparece no Portal em 2 segundos
   - Atualiza anúncio → Portal reflete mudança automaticamente

3. **Escalabilidade**
   - Futuro: Múltiplos frontends consumindo mesmas APIs
   - Futuro: App mobile consumindo mesmas APIs
   - Futuro: Integração com redes sociais

4. **Administração Centralizada**
   - Um único lugar para gerenciar TUDO
   - Sem duplicação de dados
   - Sem risco de desincronização

---

## 📈 Cronograma

| Fase | Descrição | Tempo | Status |
|------|-----------|-------|--------|
| 1 | Notícias + Capas | ✅ Feito | ✅ |
| 2 | Categorias, Vídeos, Enquetes | 2-3h | 🔄 Próximo |
| 3 | Anúncios & Classificados | 4-5h | 🔴 Depois |
| 4 | Colunas, Municípios, Usuários | 5-6h | 🔴 Depois |
| 5 | Logomarcas & Temas | 3-4h | 🔴 Depois |
| **TOTAL** | | **17-22h** | |

---

## 🚀 Próximos Passos

### Fase 2 (Imediata - 2-3 horas):
1. Atualizar `js/data.js` para consumir APIs do Painel DM
2. Adicionar CORS no `painel-dm/server.js`
3. Testar portal consumindo dados do Painel

### Resultado esperado:
- ✅ Portal funcionando 100% com dados dinâmicos
- ✅ Mudanças no Painel refletem no Portal
- ✅ Sistema escalável para futuras integrações

---

*Plano criado em 2026-05-31 com análise completa da arquitetura*
