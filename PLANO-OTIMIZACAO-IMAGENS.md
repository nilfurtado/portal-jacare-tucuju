# 📊 Plano Estratégico: Otimização de Imagens

## 1️⃣ Diagnóstico Atual

**Problema:**
- Imagens originais muito grandes (uploads de até 8MB)
- Múltiplos formatos (JPEG, PNG) desperdiçam espaço
- Sem compressão inteligente
- Sem formatos modernos (WebP, AVIF)

**Impacto:**
- BD cresce rapidamente (8MB × notícias)
- Portal carrega mais lento
- Bandwidth desperdiçado

---

## 2️⃣ Benchmark - Grandes Portais Nacionais

### Portal G1 (Globo)
✅ WebP automático com fallback JPEG
✅ Imagens redimensionadas por resolução
✅ Cache HTTP 30 dias
✅ CDN (Akamai)
✅ Lazy loading com placeholder

### Portal UOL
✅ AVIF + WebP + JPEG cascata
✅ Responsive images (srcset)
✅ Compressão agressiva (70% redução)
✅ Cache 1 ano para assets
✅ Image optimization pipeline

### Portal iG/Folha
✅ WebP renderização automática
✅ Thumbnails para listas (100x100px)
✅ Progressive JPEG
✅ CDN distribuído
✅ Versioning com hash

---

## 3️⃣ Solução Proposta - 4 Pilares

### 🔧 PILAR 1: Formatos Inteligentes
**Implementar cascata de formatos:**
```
1º tentativa: AVIF (20% menor que WebP) ← Novo
2º fallback:  WebP (30-40% menor que JPEG)
3º fallback:  JPEG otimizado (baseline)
4º último:    PNG (se necessário)
```

**Redução esperada:**
- AVIF: 1MB → 200KB (80%)
- WebP: 1MB → 600KB (40%)
- JPEG: 1MB → 750KB (25%)

### 🖼️ PILAR 2: Multi-Resolução
**Gerar múltiplos tamanhos:**
```
Listas:     300×200px (thumbnail) - <50KB
Homepage:   800×450px (preview)   - <100KB
Artigo:    1200×675px (principal) - <200KB
Original:  1920×1080px (arquivo)  - <500KB
```

### 💾 PILAR 3: Armazenamento Inteligente
```
/img/uploads/originals/     ← Backups (comprimidos)
/img/uploads/2026/06/       ← Versões otimizadas
  - noticia-36-original.jpg (original)
  - noticia-36-1200w.avif   (AVIF 1200px)
  - noticia-36-1200w.webp   (WebP fallback)
  - noticia-36-1200w.jpg    (JPEG fallback)
  - noticia-36-800w.avif    (AVIF 800px)
  - noticia-36-800w.webp    (WebP 800px)
  - noticia-36-300w.jpg     (Thumbnail)
```

### ⚡ PILAR 4: Pipeline de Processamento
```
Upload (8MB)
    ↓
Validação
    ↓
Backup Original (comprimido 60%)
    ↓
Gerar 6 versões otimizadas (AVIF/WebP/JPEG)
    ↓
Sincronizar banco de dados
    ↓
Cache HTTP 1 ano (hash versioning)
    ↓
Portal renderiza com <picture> + srcset
```

---

## 4️⃣ Implementação - Roadmap

### 🎯 FASE 1: Image Processor (1 dia)
- [ ] Criar `lib/image-optimizer.js`
- [ ] Integrar AVIF + WebP + JPEG
- [ ] Gerar múltiplos tamanhos automaticamente
- [ ] Backup de originais

### 🎯 FASE 2: API Upload (1 dia)
- [ ] Modificar `/api/noticias-capa/upload`
- [ ] Chamar optimizer após receber
- [ ] Armazenar múltiplas versões
- [ ] Atualizar JSON com todas as URLs

### 🎯 FASE 3: Frontend Rendering (1 dia)
- [ ] Atualizar `renderCapaImg()` para usar `<picture>`
- [ ] Implementar srcset responsivo
- [ ] Lazy loading com placeholder
- [ ] Fallback para navegadores antigos

### 🎯 FASE 4: Cache HTTP (4 horas)
- [ ] Hash-based versioning (noticia-36-abc123.jpg)
- [ ] Cache 1 ano para imagens versionadas
- [ ] Cache busting automático

### 🎯 FASE 5: Migração (2 horas)
- [ ] Reprocessar imagens existentes
- [ ] Atualizar JSON com novas URLs
- [ ] Validação pós-migração

---

## 5️⃣ Tecnologias

### Sharp.js (já instalado)
✅ JPEG/PNG leitura
✅ WebP geração
✅ AVIF geração (com libvips)
✅ Redimensionamento
✅ Compressão configurable

```javascript
await sharp(inputBuffer)
  .withMetadata()
  .resize(1200, 675, { fit: 'cover' })
  .toFormat('avif', { quality: 80 })
  .toFile(outputPath)
```

### Formatos Suportados (2024+)
| Formato | Chrome | Firefox | Safari | IE  |
|---------|--------|---------|--------|-----|
| AVIF    | ✅ 85+ | ✅ 113+ | ❌ 16  | ❌  |
| WebP    | ✅ 23+ | ✅ 65+  | ✅ 16+ | ❌  |
| JPEG    | ✅ ALL | ✅ ALL  | ✅ ALL | ✅ ALL |

**→ Usar `<picture>` para compatibilidade**

---

## 6️⃣ Exemplo de Renderização Final

```html
<picture>
  <!-- Melhor: AVIF para navegadores modernos -->
  <source srcset="
    noticia-36-300w.avif 300w,
    noticia-36-800w.avif 800w,
    noticia-36-1200w.avif 1200w
  " type="image/avif" />
  
  <!-- Fallback 1: WebP para Chrome/Edge/Firefox -->
  <source srcset="
    noticia-36-300w.webp 300w,
    noticia-36-800w.webp 800w,
    noticia-36-1200w.webp 1200w
  " type="image/webp" />
  
  <!-- Fallback 2: JPEG para IE/Safari antigo -->
  <img 
    srcset="
      noticia-36-300w.jpg 300w,
      noticia-36-800w.jpg 800w,
      noticia-36-1200w.jpg 1200w
    "
    src="noticia-36-1200w.jpg"
    alt="..."
    loading="lazy"
    decoding="async"
  />
</picture>
```

---

## 7️⃣ Resultados Esperados

### Redução de Tamanho
| Cenário | Antes | Depois | Redução |
|---------|-------|--------|---------|
| 1 notícia | 5MB | 800KB | **84%** |
| 36 notícias | 180MB | 28MB | **84%** |
| Upload anúncio | 2MB | 300KB | **85%** |

### Melhoria de Performance
- FCP (First Contentful Paint): -40%
- LCP (Largest Contentful Paint): -50%
- PageSpeed Score: +20 pontos
- Bandwidth: -85%

### Benefícios
✅ BD cresce 6× mais lento
✅ Portal carrega 2× mais rápido
✅ Mobile experience muito melhor
✅ SEO melhora (velocidade = ranking)
✅ Servidor economiza bandwidth

---

## 8️⃣ Decisões de Design

**Por que AVIF + WebP + JPEG?**
- AVIF: melhor compressão (novo)
- WebP: excelente suporte (2023+)
- JPEG: compatibilidade máxima (fallback)

**Por que manter original?**
- Reprocessar com qualidades diferentes
- Permitir re-crop manual futuro
- Backup de segurança

**Por que múltiplos tamanhos?**
- Mobile: 300px (mais rápido)
- Tablet: 800px (equilíbrio)
- Desktop: 1200px (qualidade)
- Original: 1920px (arquivo)

---

## ✅ Checklist de Implementação

### Backend
- [ ] `lib/image-optimizer.js` criado
- [ ] Sharp configurado com AVIF/WebP
- [ ] Múltiplas resoluções geradas
- [ ] Backup de originais
- [ ] API `/noticias-capa/upload` atualizada
- [ ] JSON com todas URLs

### Frontend
- [ ] `renderCapaImg()` refatorada
- [ ] `<picture>` + `srcset` implementado
- [ ] Lazy loading verificado
- [ ] Placeholder implementado
- [ ] Testes em navegadores antigos

### DevOps
- [ ] Cache headers HTTP (1 ano)
- [ ] Hash-based versioning
- [ ] Migração de imagens antigas
- [ ] Validação pós-migração
- [ ] Monitoramento de tamanho

---

## 🎯 Próximos Passos

1. **Aprovação do plano** ← AGORA
2. **FASE 1**: Image Processor
3. **FASE 2**: API Integration
4. **FASE 3**: Frontend Rendering
5. **FASE 4**: Cache HTTP
6. **FASE 5**: Migração

**Tempo estimado: 3-4 dias**
**Impacto: Crítico (performance + BD)**

