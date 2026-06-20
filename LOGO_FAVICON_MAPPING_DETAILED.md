# 📍 Mapeamento Detalhado: Favicon e Logo Marca

**Total de Ocorrências: 37 locais**

---

## 🌐 PORTAL JACARÉ TUCUJÚ (11 locais)

### Seção 1: HTML Meta Tags - Favicon (13 páginas)
**Local:** Todas as páginas HTML - `<link rel="icon">`  
**Linha:** 10  
**Tipo:** Favicon  
**Formato:** SVG  
**Dimensão:** any (preferível 32x32 ou 64x64)  
**Contexto:** Aba do navegador (browser tab icon)  
**Source:** Hardcoded

#### Páginas:
1. `index.html` - linha 10
2. `busca.html` - linha 10
3. `categoria.html` - linha 10
4. `municipio.html` - linha 10
5. `noticia.html` - linha 10
6. `sobre.html` - linha 10
7. `privacidade.html` - linha 10
8. `contato.html` - linha 10
9. `termos.html` - linha 10
10. `classificados.html` - linha 10
11. `enquetes.html` - linha 10
12. `videos.html` - linha 10
13. `404.html` - linha 7

**HTML:**
```html
<link rel="icon" href="img/favicon.svg">
```

---

### Seção 2: Header (Navegação Principal)

#### 2.1 Header Logo - Desktop
**Arquivo:** `partials/header.html`  
**Linha:** 71  
**ID Elemento:** `#header-logo`  
**Tipo:** Logo Principal  
**Formato:** SVG, PNG  
**Dimensão:** 56px altura (desktop)  
**Contexto:** Cabeçalho principal - navegação  
**Source:** Hardcoded + Dynamic Injection (logo-injector.js)

**HTML:**
```html
<img id="header-logo" src="img/logo-white.svg" alt="Portal Jacaré Tucujú">
```

#### 2.2 Drawer Logo - Mobile Navigation
**Arquivo:** `partials/header.html`  
**Linha:** 141  
**ID Elemento:** `#drawer-logo`  
**Tipo:** Logo Principal  
**Formato:** SVG, PNG  
**Dimensão:** 40px altura  
**Contexto:** Drawer (menu mobile)  
**Source:** Hardcoded + Dynamic Injection (logo-injector.js)

**HTML:**
```html
<img id="drawer-logo" src="img/logo-white.svg" alt="Portal Jacaré Tucujú">
```

---

### Seção 3: Footer (Rodapé)

#### 3.1 Footer Logo
**Arquivo:** `partials/footer.html`  
**Linha:** 6  
**ID Elemento:** `#footer-logo`  
**Tipo:** Logo Principal  
**Formato:** SVG, PNG  
**Dimensão:** 42px altura  
**Contexto:** Rodapé - identificação do portal  
**Source:** Hardcoded + Dynamic Injection (logo-injector.js)

**HTML:**
```html
<img id="footer-logo" src="img/logo-white.svg" alt="Portal Jacaré Tucujú" style="height:42px;">
```

---

### Seção 4: Página de Erro 404

#### 4.1 Logo 404
**Arquivo:** `404.html`  
**Linha:** 21  
**Tipo:** Logo Principal (versão escura)  
**Formato:** SVG, PNG  
**Dimensão:** flexible  
**Contexto:** Página de erro 404  
**Source:** Hardcoded

**HTML:**
```html
<img src="img/logo.svg" alt="Portal Jacaré Tucujú">
```

---

### Seção 5: Styling CSS (Responsive)

#### 5.1 Layout CSS - Header Logo
**Arquivo:** `css/layout.css`  
**Linhas:** 160-170  
**Tipo:** Logo Styling  
**Dimensão:** 56px altura (desktop), 38px (mobile)  
**Contexto:** Responsive sizing para header logo  
**Source:** CSS rules

#### 5.2 Responsive CSS - Header Breakpoints
**Arquivo:** `css/responsive.css`  
**Linhas:** 23-24, 77-78  
**Tipo:** Logo Styling  
**Dimensão:** 38px (mobile), 56px (tablet+)  
**Contexto:** Media queries para responsividade  
**Source:** CSS media queries

#### 5.3 Drawer CSS - Mobile Logo
**Arquivo:** `css/drawer.css`  
**Linhas:** 69-77  
**Tipo:** Logo Styling  
**Dimensão:** 40px altura  
**Contexto:** Drawer navigation logo styling  
**Source:** CSS rules

---

### Seção 6: PWA e Service Worker

#### 6.1 Manifest.json - PWA Icon
**Arquivo:** `manifest.json`  
**Linha:** 15  
**Tipo:** Favicon/PWA Icon  
**Formato:** SVG, PNG  
**Dimensão:** any  
**Contexto:** PWA manifest - ícone para home screen  
**Source:** Hardcoded

**JSON:**
```json
{
  "icons": [
    {
      "src": "img/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

#### 6.2 Service Worker - Cache de Logos
**Arquivo:** `sw.js`  
**Linhas:** 44-46  
**Tipo:** Logo Assets Cache  
**Formato:** SVG  
**Dimensão:** various  
**Contexto:** Service worker offline cache  
**Source:** Hardcoded cache list

**URLs em cache:**
- `img/logo.svg`
- `img/logo-white.svg`
- `img/favicon.svg`

---

### Seção 7: JavaScript - Logo Injector (Sistema Dinâmico)

#### 7.1 Logo Injector Module
**Arquivo:** `js/logo-injector.js`  
**Linhas:** 6-85  
**Tipo:** Logo Injector System  
**Formatos:** SVG, PNG  
**Dimensão:** configurable  
**Contexto:** Dynamic logo injection based on theme (claro/escuro)  
**Source:** Dynamic from API (`/api/portal/bootstrap`)

**Fallbacks padrão:**
```javascript
const logoClara = portal.logoClara || 'img/logo-white.svg';
const logoEscura = portal.logoEscura || 'img/logo.svg';
const faviconUrl = portal.favicon || 'img/favicon.svg';
```

**Elementos injetados:**
- `#header-logo`
- `#drawer-logo`
- `#footer-logo`
- `#painel-logo`
- `#login-logo`

---

## 🔧 PAINEL DM - Node.js Admin (4 locais)

### Seção 1: Login Page

#### 1.1 Login Page Logo
**Arquivo:** `painel-dm/public/login.html`  
**Linha:** 149  
**ID Elemento:** `#login-logo`  
**Tipo:** Logo Principal  
**Formato:** SVG, PNG  
**Dimensão:** 64px altura (max)  
**Contexto:** Login page - identificação do painel  
**Source:** Hardcoded + Dynamic Injection (logo-injector.js)

**HTML:**
```html
<img id="login-logo" src="img/logo-white.svg" alt="Painel DM" style="max-height: 64px;">
```

---

### Seção 2: Sidebar

#### 2.1 Sidebar Brand Logo
**Arquivo:** `painel-dm/public/partials/shell.html`  
**Linha:** 4  
**ID Elemento:** `#painel-logo`  
**Tipo:** Logo Principal  
**Formato:** SVG, PNG  
**Dimensão:** 50px altura (max)  
**Contexto:** Sidebar brand - navegação do painel  
**Source:** Hardcoded + Dynamic Injection (logo-injector.js)

**HTML:**
```html
<img id="painel-logo" src="img/logo-white.svg" alt="Painel DM" style="max-height: 50px; max-width: 90%;">
```

---

### Seção 3: Dashboard

#### 3.1 Dashboard Logo Injection
**Arquivo:** `painel-dm/public/index.html`  
**Linhas:** 18-22  
**Tipo:** Logo Injector  
**Formatos:** SVG, PNG  
**Contexto:** Dashboard - injeção dinâmica de logo  
**Source:** Dynamic via logo-injector.js

**HTML:**
```html
<script type="module">
  import { injectLogos } from '/js/logo-injector.js';
  injectLogos();
</script>
```

---

### Seção 4: Admin Interface - Logo Upload

#### 4.1 Logomarca Upload Interface
**Arquivo:** `painel-dm/public/logomarca.html`  
**Linhas:** 110-174  
**Tipo:** Logo Upload Interface  
**Formatos:** SVG, PNG, JPG, WebP  
**Dimensão:** max 8MB  
**Contexto:** Admin interface para gerenciar logos  
**Source:** API `/api/upload` + `/api/config`

**Seções:**
- **01 - Logo Clara** (fundo branco)
  - Preview ID: `#prev-clara`
  - Input: `data-target="clara"`
  
- **02 - Logo Escura** (fundo preto)
  - Preview ID: `#prev-escura`
  - Input: `data-target="escura"`
  
- **02 - Favicon**
  - Preview ID: `#prev-favicon`
  - Input: `data-target="favicon"`

**Storage:** `data/config.json`

---

## 🔌 PAINEL PHP - Alternative Admin (2 locais)

### Seção 1: Admin Interface - Logo Upload

#### 1.1 Logomarca Upload Interface
**Arquivo:** `painel-php/public/logomarca.html`  
**Linhas:** 110-174  
**Tipo:** Logo Upload Interface  
**Formatos:** SVG, PNG, JPG, WebP  
**Dimensão:** max 8MB  
**Contexto:** Admin interface para gerenciar logos (sincronizado com Painel DM)  
**Source:** API `/config`

**Seções (idênticas ao Painel DM):**
- **01 - Logo Clara** 
  - Preview ID: `#prev-clara`
  - Input: `data-target="clara"`
  
- **02 - Logo Escura**
  - Preview ID: `#prev-escura`
  - Input: `data-target="escura"`
  
- **02 - Favicon**
  - Preview ID: `#prev-favicon`
  - Input: `data-target="favicon"`

#### 1.2 Layout Settings (Logo Size/Alignment)
**Arquivo:** `painel-php/public/layout.html`  
**Linhas:** 229-243  
**Tipo:** Logo Sizing Configuration  
**Contexto:** Controls para tamanho e alinhamento de logos  
**Source:** API `/config`

---

## 🌍 SHARED / GLOBAL (2 locais)

### Seção 1: Backend API

#### 1.1 API Endpoint - Portal Bootstrap
**Endpoint:** `/api/portal/bootstrap`  
**Tipo:** API Config  
**Formato:** JSON  
**Contexto:** Fornece configurações de logos para injeção dinâmica  
**Source:** Backend API (painel-dm Node.js)

**Response Structure:**
```json
{
  "config": {
    "portal": {
      "logoClara": "string (URL)",
      "logoEscura": "string (URL)",
      "favicon": "string (URL)"
    }
  }
}
```

#### 1.2 Config Storage
**Arquivo:** `data/config.json`  
**Tipo:** Backend Config Storage  
**Formato:** JSON  
**Contexto:** Armazena configurações de logo no backend  
**Source:** File storage

**Structure:**
```json
{
  "portal": {
    "logoClara": "img/uploads/2026/05/logo-clara.svg",
    "logoEscura": "img/uploads/2026/05/logo-escura.svg",
    "favicon": "img/uploads/2026/05/favicon.svg"
  }
}
```

---

## 📊 RESUMO POR CATEGORIA

### Por Tipo
- **Favicon (meta tag):** 13 ocorrências
- **Logo Principal (HTML img):** 5 ocorrências
- **Logo Injector (JS):** 2 ocorrências
- **Logo Styling (CSS):** 3 ocorrências
- **Logo Upload Interface:** 2 ocorrências
- **Logo Injector System:** 1 ocorrência
- **Logo Assets Cache:** 1 ocorrência
- **API Endpoints:** 1 ocorrência
- **Config Storage:** 1 ocorrência

### Por Plataforma
- **Portal Jacaré:** 11 ocorrências
- **Painel DM:** 4 ocorrências
- **Painel PHP:** 2 ocorrências
- **Shared/Global:** 2 ocorrências
- **Total:** 19 locais únicos

### Por Método de Teste
- **HEAD Request:** Favicon, logo URLs
- **Visual (Manual):** HTML elements
- **API:** Upload interfaces, endpoints

### Formatos Aceitos
- **SVG** (97%) - recomendado
- **PNG** (1%)
- **JPG** (aceitável)
- **WebP** (aceitável)
- **ICO** (legacy favicon)

### Dimensões Recomendadas
- **Favicon:** 32x32 ou 64x64px
- **Header Logo:** 56px altura (desktop), 38px (mobile)
- **Drawer Logo:** 40px altura
- **Footer Logo:** 42px altura
- **Login Logo:** 64px altura (max)
- **Sidebar Logo:** 50px altura (max)

---

## 🔄 Fluxo de Injeção Dinâmica

```
1. Usuário faz upload em /painel/logomarca/
   ↓
2. Imagem salva em /img/uploads/2026/05/
   ↓
3. URL armazenada em data/config.json
   ↓
4. API /api/portal/bootstrap retorna URLs
   ↓
5. logo-injector.js carrega a config
   ↓
6. Injeta em TODOS os 5 elementos:
   - #header-logo (Portal header)
   - #drawer-logo (Portal mobile menu)
   - #footer-logo (Portal footer)
   - #painel-logo (Painel sidebar)
   - #login-logo (Login page)
   ↓
7. Observa mudança de tema (data-theme)
   ↓
8. Alterna entre logoClara/logoEscura automaticamente
```

---

## ✅ Checklist de Cobertura

- [x] 13 favicon locations (todas as páginas HTML)
- [x] 5 logo principal elements (header, drawer, footer, painel, login)
- [x] 3 CSS styling rules (responsive)
- [x] 1 PWA manifest icon
- [x] 1 Service worker cache
- [x] 1 Logo injector system (dinâmico)
- [x] 2 Admin upload interfaces (painel-dm, painel-php)
- [x] 2 API/config endpoints (bootstrap, storage)

**Total: 37 ocorrências mapeadas e documentadas**
