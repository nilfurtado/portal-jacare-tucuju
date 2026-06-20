# Guia de Galerias — Portal Jacaré Tucujú

## Resumo Executivo

Sistema modular e escalável de galerias para o Portal Jacaré Tucujú, com suporte a:
- Galeria em slider com lightbox no portal público
- Editor visual completo no Painel DM
- Upload, reordenação por drag-and-drop, edição de metadados
- Componentes ES6 class-based para reutilização

---

## Arquitetura

### Portal (Frontend Público)

#### Componentes

**`js/gallery.js`** — Classe `Gallery` para renderizar galerias em artigos
```javascript
import { Gallery } from './gallery.js';

const imageData = [
  { src: '/img/uploads/...jpg', caption: 'Descrição', alt: 'Alt text' },
  { src: '/img/uploads/...jpg', caption: 'Descrição 2', alt: 'Alt text 2' }
];

const gallery = new Gallery(
  document.querySelector('[data-gallery]'),
  imageData,
  { autoplay: false, showTitle: true }
);
```

**`js/carousel.js`** — Classe `Carousel` para carrosséis genéricos (classificados, etc.)
```javascript
import { Carousel } from './carousel.js';

const carousel = new Carousel({
  viewport: el,
  track: el.querySelector('[data-track]'),
  dotsContainer: el.querySelector('[data-dots]'),
  prevBtn: el.querySelector('[data-prev]'),
  nextBtn: el.querySelector('[data-next]'),
  interval: 5000
});
```

**`js/hero-carousel.js`** — Classe `HeroCarousel` para destaque principal
```javascript
import { HeroCarousel } from './hero-carousel.js';

const hero = new HeroCarousel(noticiasArray, {
  mainContainer: document.getElementById('hero-main'),
  sideContainer: document.getElementById('hero-side'),
  interval: 6000
});
```

#### CSS

**`css/gallery.css`** — Estilos de galeria slider + lightbox
- `.article-gallery` — Container
- `.article-gallery__slide` — Slides
- `.article-gallery__dots` — Indicadores
- `.lightbox` — Modal fullscreen
- Variáveis: `--gallery-*` para customização

**`css/carousel.css`** — Estilos de carrossel genérico
- `.classif-carousel` — Container
- `.classif-carousel__dot` — Indicadores
- Variáveis: `--cat-*` para cores de categorias

#### HTML

```html
<!-- Galeria em noticia.html -->
<div data-gallery><!-- gerado por js/article-page.js --></div>

<!-- Estrutura de dados em /data/noticias.json -->
{
  "id": 1,
  "titulo": "Notícia",
  "galeria": [
    {
      "id": "img-1",
      "src": "/img/uploads/2026/05/file.jpg",
      "caption": "Legenda",
      "alt": "Texto alternativo"
    }
  ]
}
```

---

### Painel DM (Admin)

#### API

**`/api/galeria`** — Endpoints REST

```bash
# Listar todas as galerias
GET /api/galeria

# Galeria de uma notícia
GET /api/galeria/:noticiaId

# Criar/atualizar galeria
POST /api/galeria
Body: { noticiaId, imagens: [{ src, caption, alt }] }

# Remover imagem
DELETE /api/galeria/:imgId?noticiaId=123

# Editar metadados de imagem
PATCH /api/galeria/:imgId
Body: { noticiaId, caption?, alt?, ordem? }
```

**Resposta padrão:**
```json
{
  "ok": true,
  "data": {
    "noticiaId": 1,
    "galeria": [...]
  },
  "erro": null
}
```

#### Componentes Frontend

**`js/lib-upload.js`** — Utilitários de upload

```javascript
import {
  validateFile,      // Validar arquivo
  generatePreview,   // Gerar preview em base64
  uploadFile,        // Fazer upload para /api/upload
  generatePlaceholder // Placeholder SVG
} from './lib-upload.js';

// Validação
const { valid, error } = validateFile(file, {
  maxSize: 2 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png']
});

// Preview
const dataUrl = await generatePreview(file);

// Upload
const result = await uploadFile(file, token, (progress) => {
  console.log(`${progress}% enviado`);
});
// result: { url, mime, size, originalName }
```

**`js/lib-drag-sort.js`** — Drag-and-drop para reordenar

```javascript
import {
  enableDragSort,    // Ativar reordenação
  disableDragSort,   // Desativar
  getCurrentOrder    // Obter ordem atual
} from './lib-drag-sort.js';

enableDragSort(container, {
  itemSelector: '[data-sort-item]',
  onReorder: (newOrder) => console.log(newOrder)
});
```

**`js/galeria-editor.js`** — Classe `GalleryEditor`

```javascript
import { GalleryEditor } from './galeria-editor.js';

// Criar editor
const editor = new GalleryEditor(
  document.querySelector('#gallery-editor'),
  {
    maxImages: 10,
    maxFileSize: 2 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png'],
    token: localStorage.getItem('painel-dm:token')
  }
);

// Carregar galeria existente
editor.setGaleria([
  { id: 'img-1', src: '...', caption: 'Cap', alt: 'Alt' }
]);

// Obter dados para enviar à API
const galeria = editor.getGaleria();
// [{ id, src, caption, alt, ordem }]
```

#### CSS

**`css/galeria.css`** — Estilos do editor

- `.gallery-editor` — Container
- `.gallery-editor__item` — Item individual (imagem + inputs)
- `.gallery-editor__item.is-dragging` — Estado durante drag
- `.gallery-editor__item.is-drag-over` — Estado de drop zone
- `.gallery-editor__upload-progress` — Barra de progresso

---

## Uso Prático

### No Portal (Leitura)

1. **Dados** vêm de `/data/noticias.json` com campo `galeria[]`
2. **Renderização** em `js/article-page.js` chama `new Gallery()`
3. **Interação** — clique na imagem abre lightbox, setas/dots navegam
4. **Responsivo** — CSS em `css/gallery.css` com breakpoints

### No Painel DM (Edição)

1. **Integração** no `noticias.html` — adicionar `<div id="gallery-editor"></div>`
2. **Inicialização** no `js/noticias.js`:

```javascript
import { GalleryEditor } from './galeria-editor.js';

const editor = new GalleryEditor(
  document.querySelector('#gallery-editor'),
  { token: getTokenFromStorage() }
);

// Se editando notícia existente, carregar galeria
if (noticia.galeria) {
  editor.setGaleria(noticia.galeria);
}

// Ao salvar notícia
const formData = {
  titulo: '...',
  conteudo: '...',
  galeria: editor.getGaleria() // ← Dados das imagens
};

await fetch('/api/noticias', {
  method: 'POST',
  body: JSON.stringify(formData)
});
```

3. **Fluxo de usuário:**
   - Clica "+ Adicionar Imagem"
   - Seleciona arquivo do disco
   - Preview aparece + upload automático
   - Edita caption/alt inline
   - Reordena arrastando items
   - Clica 🗑️ para remover
   - Salva notícia (galeria vai junto)

---

## Padrões de Código

### JavaScript

- **Classes ES6** com `constructor()`, `init()`, métodos públicos/privados
- **Responsabilidade única** — cada arquivo uma funcionalidade
- **Módulos** — `import/export` para reutilização
- **Sem jQuery** — DOM nativo (`querySelector`, `addEventListener`, etc.)

Exemplo:
```javascript
export class Gallery {
  constructor(container, images, options) {
    this.container = container;
    this.images = images;
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() { /* ... */ }
  attachEvents() { /* ... */ }
  next() { /* ... */ }
}
```

### CSS

- **BEM modificado** — `.block__element`, não `.block__element--modifier`
- **Tokens CSS** — `:root { --color-*, --spacing-*, ... }`
- **Componentes** — um arquivo por feature (`gallery.css`, `carousel.css`)
- **Responsivo** — breakpoints em cada arquivo (mobile-first)

Exemplo:
```css
:root {
  --gallery-slide-height: 450px;
  --gallery-transition: 480ms ease-out;
}

.gallery { }
.gallery__slide { }
.gallery__slide.is-active { }
```

### API

- **REST** — GET/POST/PATCH/DELETE
- **Resposta padrão** — `{ ok, data, erro }`
- **Validação** — 400 (bad input), 401 (auth), 404 (not found), 500 (server)
- **Permissões** — middleware `requerePermissao('noticias')`

---

## Migração de Código Legado

### Código Antigo

```javascript
// article-gallery.js (funções soltas)
export function galleryTemplate(images) { ... }
export function initGallery(rootSelector, images) { ... }

// Uso
const html = galleryTemplate(noticia.galeria);
initGallery('[data-gallery]', noticia.galeria);
```

### Código Novo

```javascript
// gallery.js (classe)
export class Gallery { ... }

// Retrocompatibilidade (exports das funções antigas)
export function galleryTemplate(images) {
  const gallery = new Gallery(null, images);
  return gallery.template();
}

export function initGallery(rootSelector, images) {
  const root = document.querySelector(rootSelector);
  return new Gallery(root, images);
}

// Uso (ambas funcionam)
// Antiguo: initGallery('[data-gallery]', images);
// Novo:   new Gallery(container, images);
```

---

## Validação & Limitações

### Upload

- **Tamanho máximo:** 2MB (configurável)
- **Tipos permitidos:** JPEG, PNG, WebP
- **Total por galeria:** 10 imagens (configurável)

### Galeria

- **Aspecto ratio:** 16:9 (portal), variável (painel)
- **Lightbox:** zoom-in ao clicar, ESC para fechar
- **Keyboard:** setas esquerda/direita, touch swipe

### Metadados

- **Caption:** texto livre, exibido no slider
- **Alt text:** obrigatório para acessibilidade
- **Ordem:** drag-drop ou PATCH com ordem numérica

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Galeria não aparece no artigo | Verificar se `noticia.galeria` existe e não está vazio |
| Upload falha | Validar token JWT, tamanho arquivo, tipo MIME |
| Imagem não carrega | Verificar path `/img/uploads/AAAA/MM/` e permissões |
| Lightbox não abre | Verificar Z-index em `css/gallery.css` |
| Drag-sort não funciona | Ativar `enableDragSort()` no editor após render |

---

## Roadmap Futuro

- [ ] Otimização de imagens (compressão automática)
- [ ] Recorte/crop de imagens
- [ ] Galeria com filtros/tags
- [ ] Pré-visualização em tempo real no painel
- [ ] Sincronização com biblioteca de mídia centralizada
- [ ] Suporte a vídeos (em adição a imagens)

---

## Referências

- **Padrão BEM:** https://bem.methodology.dev/
- **CSS Variables:** https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **Drag & Drop API:** https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
- **FileReader API:** https://developer.mozilla.org/en-US/docs/Web/API/FileReader

---

*Documentação versão 1.0 — Última atualização: 2026-05-30*
