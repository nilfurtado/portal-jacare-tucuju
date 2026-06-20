# PLANO DE RECONSTRUÇÃO - SESSÃO DE ANÚNCIOS

## 🔴 SITUAÇÃO ATUAL
- Sessão de anúncios corrompida (painel-dm/public/anuncios.html)
- Conflito com painel-php/public/anuncios.html (versão antiga)
- 15 features parcialmente implementadas mas instáveis
- CSS/JS carregando com erros

## 🎯 OBJETIVO
Reconstruir sessão de anúncios do ZERO com arquitetura limpa, moderna e estável.

---

## 📋 PLANO DE AÇÃO

### FASE 1: LIMPEZA E PREPARAÇÃO (1 hora)

#### 1.1 Deletar código corrompido
```bash
✓ Deletar painel-dm/public/anuncios.html (versão quebrada)
✓ Deletar painel-dm/public/dashboard-anuncios.html (versão quebrada)
✓ Deletar painel-dm/public/css/anuncios.css
✓ Deletar painel-dm/public/css/dashboard.css
✓ Deletar painel-dm/public/css/shell.css
✓ Deletar painel-dm/api/anuncios.js
✓ Deletar painel-dm/api/anuncios-capa.js
✓ Manter apenas: painel-dm/public/js/ (utilitários)
```

#### 1.2 Manter estrutura de dados
```bash
✓ Manter data/anuncios.json (banco de dados)
✓ Manter painel-dm/data/painel.db (SQLite)
```

#### 1.3 Deletar cópias antigas
```bash
✓ Deletar painel-php/public/anuncios.html (versão legacy)
✓ Deletar qualquer anuncios.html fora de painel-dm
```

---

### FASE 2: ARQUITETURA NOVA (Design from scratch)

#### 2.1 Stack de Tecnologia
```
Frontend:
  - HTML5 semântico (sem jQuery)
  - CSS3 com variáveis CSS
  - JavaScript ES6+ moderno
  - Fetch API (sem axios)
  - Web Components (opcional)

Backend:
  - Express.js (existente)
  - SQLite para dados principais
  - JSON para anúncios
  - JWT para autenticação
```

#### 2.2 Estrutura de Pastas (Nova)
```
painel-dm/
├── public/
│   ├── anuncios/
│   │   ├── index.html ...................... página principal
│   │   ├── dashboard.html .................. dashboard de métricas
│   │   └── editor.html ..................... editor de criativo
│   ├── css/
│   │   ├── variables.css ................... design system
│   │   ├── anuncios.css .................... estilos página principal
│   │   ├── dashboard.css ................... estilos dashboard
│   │   ├── editor.css ...................... estilos editor
│   │   └── responsive.css .................. mobile-first
│   ├── js/
│   │   ├── modules/
│   │   │   ├── api.js ...................... chamadas REST
│   │   │   ├── storage.js .................. localStorage/sessionStorage
│   │   │   ├── validator.js ................ validações
│   │   │   └── formatter.js ................ formatação de dados
│   │   ├── components/
│   │   │   ├── grid.js ..................... grid de anúncios
│   │   │   ├── modal.js .................... modais
│   │   │   ├── form.js ..................... formulários
│   │   │   └── table.js .................... tabelas
│   │   ├── pages/
│   │   │   ├── anuncios.js ................. lógica página principal
│   │   │   ├── dashboard.js ................ lógica dashboard
│   │   │   └── editor.js ................... lógica editor
│   │   └── app.js .......................... inicialização
│   └── index.html (redirect) .............. redireciona para anuncios/
│
├── api/
│   ├── anuncios.js ......................... CRUD anúncios
│   ├── anuncios-capa.js .................... upload imagens
│   ├── metricas.js ......................... impressões/cliques
│   └── dashboard.js ........................ dados dashboard
│
└── routes/
    └── anuncios.js ......................... mapeamento rotas
```

---

### FASE 3: IMPLEMENTAÇÃO (8-10 horas)

#### 3.1 Backend API (2 horas)
**Arquivo: painel-dm/api/anuncios.js**
```javascript
// ✅ CRUD Completo
- GET /api/anuncios (listar todos com filtros)
- GET /api/anuncios/:id (detalhe)
- POST /api/anuncios (criar)
- PUT /api/anuncios/:id (editar tudo)
- PATCH /api/anuncios/:id (editar parcial)
- DELETE /api/anuncios/:id (deletar)

// ✅ Métricas
- POST /api/anuncios/:id/impressao
- POST /api/anuncios/:id/clique
- GET /api/anuncios/:id/metricas

// ✅ Upload
- POST /api/anuncios-capa/upload (JPEG + WebP + otimização)
```

#### 3.2 Frontend - Página Principal (3 horas)
**Arquivo: painel-dm/public/anuncios/index.html**

**Seções (inspirado em código legacy):**
1. **Título** - "Gerir anúncios" com breadcrumb
2. **Formulário de Criação**
   - Nome da campanha
   - Usuário (select)
   - Local (dropdown dinâmico)
   - Posição (dropdown dependente)
   - Tipo (radio: imagem/html)
   - Link de destino

3. **Upload de Imagem** (como no código antigo)
   - Desktop (970x150 ou tamanho específico)
   - Mobile (490x150) - opcional
   - Drag-drop + click
   - Preview miniatura

4. **Código HTML** (opcional)
   - Ace Editor ou textarea
   - Validação de segurança

5. **Veiculação** (flexível)
   - Todo site? (checkbox)
   - Seleção de páginas:
     * Página inicial
     * Municípios (multi-select)
     * Blog/coluna (multi-select)

6. **Agendamento**
   - Programar data fim? (checkbox)
   - Data e hora (inputs)

7. **Tabela de Listagem**
   - Filtros avançados (busca, tipo, local, status, veiculação)
   - Paginação
   - Ações (editar, deletar, ativar/desativar)

**Funcionalidades:**
- ✅ Listar com filtros avançados (como no código antigo)
- ✅ Busca por nome/tipo/local/posição
- ✅ Paginação com limite configurável
- ✅ Status visual (ativo/inativo)
- ✅ Criar novo anúncio (inline form)
- ✅ Editar anúncio (modal)
- ✅ Deletar com confirmação
- ✅ Toggle ativo/inativo

#### 3.3 Frontend - Editor de Criativo (2 horas)
**Arquivo: painel-dm/public/anuncios/editor.html** (modal/página separada)

**Funcionalidades:**
- ✅ Upload de imagem desktop (drag-drop)
- ✅ Upload de imagem mobile (opcional)
- ✅ Preview responsivo (mobile/tablet/desktop)
- ✅ Otimização automática (JPEG + WebP)
- ✅ Ace Editor para HTML (como no código antigo)
- ✅ Validação de segurança (XSS prevention)
- ✅ Info boxes com dimensões recomendadas
- ✅ Histórico de mudanças (timeline)

#### 3.4 Frontend - Dashboard (2 horas)
**Arquivo: painel-dm/public/anuncios/dashboard.html**

**Componentes:**
- ✅ 4 KPI cards (impressões, cliques, CTR, ativos)
- ✅ Chart.js: Timeline 7 dias
- ✅ Chart.js: Performance por anúncio
- ✅ Chart.js: CTR por tipo
- ✅ Chart.js: Distribuição
- ✅ Tabela detalhada com filtros
- ✅ Seletor de período (7, 30, 90, 365 dias)
- ✅ Export de relatório (CSV/JSON)

#### 3.5 CSS - Design System (1.5 horas)
**Arquivo: painel-dm/public/css/variables.css**

```css
/* Cores */
--cor-principal: #ff9300 (do código antigo)
--cor-pr-rgb: 255,147,0
--cor-sucesso: #3e6b3a
--cor-perigo: #cd3232
--cor-aviso: #d97d2f

/* Fonts */
--font-body: DM Sans (do código antigo)
--font-display: Roboto Bold
--font-mono: JetBrains Mono

/* Spacing */
--s-1: 4px
--s-2: 8px
--s-3: 12px
--s-4: 16px
--s-5: 20px
--s-6: 24px
--s-7: 32px
--s-8: 40px
```

**Estilos principais:**
- ✅ Form sections (.pos-secao-form, .tt-secao-form)
- ✅ Form items (.item-form, .form-triplo, .form-duplo)
- ✅ Filtros (.pos-filtros-listagem, .item-filtro)
- ✅ Tabela (.pos-tabela, .table-list)
- ✅ Paginação (.paginacao)
- ✅ Avisos (.aviso-table, .info-secao-form)
- ✅ Upload area (.pos-select-arquivo)

---

### FASE 4: TESTES (1-2 horas)

#### 4.1 Testes Manuais
- [ ] Listar anúncios (vazio, com dados)
- [ ] Criar novo anúncio
- [ ] Editar anúncio
- [ ] Deletar anúncio
- [ ] Upload de imagem (PNG, JPG, GIF)
- [ ] Validação de formulário
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Autenticação JWT
- [ ] Permissões (usuário vs admin)

#### 4.2 Testes Automáticos (opcional)
```bash
npm test -- anuncios.test.js
# Cobertura: 80%+
```

#### 4.3 Performance
- [ ] CSS otimizado < 50KB
- [ ] JS modular < 200KB (gzipped)
- [ ] Carregamento < 2s em 3G

---

### FASE 5: INTEGRAÇÃO PORTAL (30 min)

#### 5.1 Portal: Exibir anúncios
```javascript
// Portal carrega de:
GET /api/anuncios
// Renderiza com:
js/ads-loader.js (novo)
js/ads-rotator.js (novo)
css/ads-responsive.css
```

#### 5.2 Portal: Tracking
```javascript
// Registra impressão
POST /api/anuncios/:id/impressao
// Registra clique
POST /api/anuncios/:id/clique
```

---

## 📊 CRONOGRAMA

```
DIA 1:
  ├─ Fase 1: Limpeza (1h) .................... 9:00-10:00
  ├─ Fase 2: Arquitetura (1h) ............... 10:00-11:00
  └─ Fase 3.1: Backend (2h) ................. 11:00-13:00

DIA 2:
  ├─ Fase 3.2: Frontend Principal (3h) ...... 9:00-12:00
  ├─ Fase 3.3: Editor (2h) .................. 13:00-15:00
  └─ Fase 4.1: Testes Manuais (1h) .......... 15:00-16:00

DIA 3:
  ├─ Fase 3.4: Dashboard (2h) ............... 9:00-11:00
  ├─ Fase 3.5: CSS (1.5h) ................... 11:00-12:30
  ├─ Fase 4: Testes Completos (1.5h) ....... 13:00-14:30
  └─ Fase 5: Integração Portal (30min) ..... 14:30-15:00

TOTAL: ~16.5 horas de desenvolvimento
```

---

## 🎁 BENEFÍCIOS DA RECONSTRUÇÃO

```
ANTES (Corrompido):
❌ 15 features parciais
❌ Código desorganizado
❌ CSS/JS em conflito
❌ Sem testes
❌ Hard to maintain

DEPOIS (Novo):
✅ Código modular
✅ Bem estruturado
✅ Sem dependências antigas
✅ Fácil manutenção
✅ Escalável
✅ Totalmente testado
✅ Performance otimizada
✅ Documentado
```

---

## 🚀 COMEÇAR?

Quer que eu comece com:
- [ ] Fase 1 (Limpeza)
- [ ] Fase 2-3 (Backend + Frontend)
- [ ] Tudo junto

**Responda: SIM para começar a reconstrução!**
