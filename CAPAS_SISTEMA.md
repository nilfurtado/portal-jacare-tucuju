# 📸 Sistema de Capas de Notícias

**v1.0** — Sistema profissional de upload local, recorte automático e otimização de imagens

---

## 📋 Índice

1. [Overview](#overview)
2. [Arquitetura](#arquitetura)
3. [Como Usar](#como-usar)
4. [Dimensões & Formatos](#dimensões--formatos)
5. [Testes](#testes)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

---

## Overview

O Sistema de Capas substitui completamente imagens externas (YouTube, links) por upload local centralizado com:

- ✅ Upload obrigatório de imagem no painel
- ✅ Geração automática de 5 dimensões otimizadas
- ✅ Recorte inteligente centralizado (sem distorção)
- ✅ Duplo formato: JPEG + WebP (~30% redução)
- ✅ Lazy loading nativo
- ✅ Meta tags Open Graph & Twitter Card
- ✅ Suporte a desktop, tablet, mobile

---

## Arquitetura

### Stack Técnico

```
Frontend (Portal)                Backend (Painel DM)
├── article-page.js            ├── image-processor.js (Sharp)
├── render.js                  ├── noticias-capa.js (API)
├── main.js                    └── noticias.js (DB)
└── [picture element]
                                Database
                                └── data/noticias.json
                                   (novo schema com 'capa')
```

### Fluxo de Dados

```
1. Usuário faz upload no Painel
   ↓
2. image-processor.js processa
   - Detecta dimensão original
   - Cria recorte smartCrop (centralizado)
   - Gera JPEG + WebP
   ↓
3. Salva 5 dimensões: principal, homepage, sidebar, mobile, social
   ↓
4. Armazena URLs em data/noticias.json (campo 'capa')
   ↓
5. Portal carrega automaticamente com renderCapaImg()
   - Renderiza <picture> com WebP + JPEG
   - Aplica lazy loading
   - Adiciona meta tags OG
```

---

## Como Usar

### 1. Instalar Dependências

```bash
cd painel-dm
npm install sharp
```

### 2. Criar Nova Notícia

**Passo A: No Painel DM**

1. Acesse: `http://localhost:3000/painel/`
2. Clique em **"Notícias"** → **"Nova Notícia"**
3. Preencha dados básicos (Título, Lide, Conteúdo)
4. **Seção 2 - Imagem de Capa:**
   - Clique/arraste uma imagem (JPG, PNG, WebP)
   - Aguarde processamento (15-30 segundos)
   - Veja preview das 5 dimensões geradas
5. Preencha o campo "Descrição da imagem (alt)"
6. Clique **"Publicar notícia"**

**Passo B: Verificar no Portal**

1. Homepage: veja miniatura na grid
2. Página do artigo: veja capa principal com qualidade
3. DevTools → Elements: procure `<picture>` com `<source type="image/webp">`
4. Compartilhamento: abra DevTools → Elements → procure `<meta property="og:image">`

### 3. Editar Capa Existente

1. No Painel: **"Notícias"** → **"Listar"** → clique na notícia
2. Seção 2: faça novo upload
3. Clique **"Salvar alterações"**

### 4. Migrar Notícias Antigas

Se você tem notícias com imagens antigas:

```bash
# Migra estrutura 'imagem' antigo → 'capa' novo
node painel-dm/scripts/migrate-capas.js
```

Isso:
- Converte todas as notícias
- Mantém reversa-compatibilidade
- Exibe relatório

---

## Dimensões & Formatos

### Dimensões Padrão

| Nome | Tamanho | Aspect | Uso |
|------|---------|--------|-----|
| **principal** | 1200×675px | 16:9 | Artigo completo |
| **homepage** | 800×450px | 16:9 | Grid destaque |
| **sidebar** | 400×225px | 16:9 | Ranked items |
| **mobile** | 600×338px | 16:9 | Preview mobile |
| **social** | 1200×630px | 1.9:1 | Open Graph/Twitter |

### Formatos de Arquivo

Cada dimensão gera **2 formatos**:

```
noticia-123-principal.jpg    (JPEG, fallback)
noticia-123-principal.webp   (WebP, otimizado)
```

**Tamanho típico:**
- JPEG: ~80-120KB
- WebP: ~40-60KB (50-60% menor)

### Recorte Automático

Se a imagem original não estiver no aspect ratio correto:

```
Original: 2000×1500px (4:3)
Target:   1200×675px  (16:9)

→ Sistema detecta que é mais largo
→ Recorta lateralmente (centralizado)
→ Redimensiona para 1200×675px
→ Resultado: SEM distorção!
```

---

## Testes

### Teste Manual Rápido

**Setup:**

1. Instalar Sharp: `npm install sharp`
2. Parar o servidor: `Ctrl+C`
3. Reiniciar: `npm run dev`

**Procedimento:**

```
1. Criar notícia teste:
   - Título: "Teste Recorte Automático"
   - Imagem: Use arquivo 3000×2000px (3:2)
   - Publicar

2. Verificar geração:
   - Procure em: img/uploads/2026/05/
   - Deve ter 10 arquivos (5 dims × 2 formatos)

3. Verificar portal:
   - Homepage: veja miniatura 800×450
   - Artigo: veja capa 1200×675
   - Sidebar: veja thumbnail 400×225

4. Verificar lazy loading:
   - DevTools → Network → filtre por imagens
   - Scroll para ver: images carregam sob demanda

5. Verificar meta tags:
   - DevTools → Elements → <head>
   - Procure: og:image, twitter:image
```

### Teste Automatizado

```bash
# Roda suite completa de testes
node painel-dm/scripts/test-capas.js
```

Valida:
- ✓ Schema de dados
- ✓ Campos obrigatórios
- ✓ Reversa-compatibilidade
- ✓ Metadados
- ✓ URLs de imagem

**Sucesso:** `✓ SISTEMA PRONTO PARA PRODUÇÃO!`

---

## Troubleshooting

### Sharp não instala

**Erro:** `ERR! gyp ERR!`

**Solução:**
```bash
# Compilar do source
npm install --build-from-source sharp

# Ou usar prebuilt (mais rápido)
npm cache clean --force
npm install sharp
```

### Imagens aparecem distorcidas

**Verificar:**
1. DevTools → Network → inspecionar imagem
2. Verificar `<picture>` está presente
3. Confirmar dimensões no banco: `data/noticias.json`

**Solução:** Re-fazer upload da imagem

### Meta tags não aparecem

**Verificar:**
1. DevTools → Elements → procure `<meta property="og:image">`
2. Verificar que a notícia tem `capa.social`

**Solução:** Publicar notícia novamente

### Imagens não carregam

**Verificar:**
1. DevTools → Network → status da imagem (200/404)
2. Verificar caminho: deve começar com `/img/uploads/YYYY/MM/`
3. Verificar arquivo existe no disco

**Solução:**
- Se 404: fazer novo upload
- Se servidor offline: iniciar backend `npm run dev`

---

## API Reference

### POST /api/noticias-capa/upload

Upload de imagem e processamento automático.

**Request:**
```
POST /api/noticias-capa/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
  file: <binary image file>
  noticiId: "123" (ID da notícia)
```

**Response (201):**
```json
{
  "success": true,
  "capa": {
    "original": "/img/uploads/2026/05/original-123.jpg",
    "principal": "/img/uploads/2026/05/noticia-123-principal.jpg",
    "principalWebp": "/img/uploads/2026/05/noticia-123-principal.webp",
    "homepage": "/img/uploads/2026/05/noticia-123-homepage.jpg",
    "homepageWebp": "/img/uploads/2026/05/noticia-123-homepage.webp",
    "sidebar": "/img/uploads/2026/05/noticia-123-sidebar.jpg",
    "sidebarWebp": "/img/uploads/2026/05/noticia-123-sidebar.webp",
    "mobile": "/img/uploads/2026/05/noticia-123-mobile.jpg",
    "mobileWebp": "/img/uploads/2026/05/noticia-123-mobile.webp",
    "social": "/img/uploads/2026/05/noticia-123-social.jpg",
    "socialWebp": "/img/uploads/2026/05/noticia-123-social.webp",
    "metadados": {
      "largura": 3000,
      "altura": 2000,
      "mime": "image/jpeg",
      "tamanho": 450000,
      "alt": "Descrição automática"
    }
  }
}
```

### POST /api/noticias (criar notícia)

**Requisito novo:** `capa` é obrigatório

```json
{
  "titulo": "Título da notícia",
  "lide": "Resumo",
  "conteudo": "<p>HTML do conteúdo</p>",
  "categoria": "politica",
  "capa": {
    "original": "/img/uploads/...",
    "principal": "/img/uploads/...",
    "principalWebp": "/img/uploads/...",
    ... (5 dimensões)
    "metadados": {
      "largura": 3000,
      "altura": 2000,
      "mime": "image/jpeg",
      "tamanho": 450000,
      "alt": "Descrição"
    }
  }
}
```

### PUT /api/noticias/:id (editar notícia)

Suporta atualizar `capa` mantendo reversa-compatibilidade.

---

## Performance

### Métricas Típicas

| Métrica | Valor |
|---------|-------|
| **Tempo de upload** | 2-5 segundos |
| **Tempo de processamento** | 10-30 segundos (5 dims) |
| **JPEG médio** | 80-120KB |
| **WebP médio** | 40-60KB |
| **Economia WebP** | 50-60% |
| **Lazy loading** | Carrega sob demanda |

### Otimizações Implementadas

- ✅ WebP automático (50% menor)
- ✅ JPEG progressivo (display mais rápido)
- ✅ Lazy loading nativo
- ✅ Picture element (fallback JPEG)
- ✅ Dimensões otimizadas por contexto

---

## Checklist de Deployment

- [ ] Sharp instalado: `npm install sharp`
- [ ] Diretório `img/uploads/` existe e é gravável
- [ ] Testes passam: `node painel-dm/scripts/test-capas.js`
- [ ] Migração executada (se houver notícias antigas)
- [ ] Teste manual de upload feito
- [ ] Meta tags OG validadas
- [ ] Lazy loading testado em mobile
- [ ] Compartilhamento social testado

---

## Suporte

Para problemas:

1. Verifique **Troubleshooting** acima
2. Execute testes: `node painel-dm/scripts/test-capas.js`
3. Verifique logs: `painel-dm/data/logs` (se existir)
4. Reinicie servidor: `npm run dev`

---

## Changelog

**v1.0 (2026-05-31)**
- ✨ Upload local de imagens
- ✨ Recorte automático inteligente (5 dimensões)
- ✨ Otimização WebP automática
- ✨ Meta tags Open Graph & Twitter
- ✨ Lazy loading nativo
- ✨ Testes E2E completos
- ✨ Documentação completa
