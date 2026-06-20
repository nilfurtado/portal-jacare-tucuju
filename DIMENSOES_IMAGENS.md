# 📊 MAPEAMENTO DE DIMENSÕES DE IMAGENS - PORTAL

## 1. CARROSSEL (Hero Featured)
```
Localização: Topo da home (section hero-featured-carousel)
Container: 100% do viewport
Aspect-ratio: 16/9 (NOVO PADRÃO)
Dimensões reais:
  - Desktop (1280px): 1280 × 720px
  - Tablet (768px): 768 × 432px
  - Mobile (640px): 640 × 360px
  
Recomendação: 1280 × 720px (principal)
Alternativas: 1920 × 1080px (retina)
```

## 2. STORY CARDS (Abaixo do Carrossel)
```
Localização: hero-mosaic__secondary
Container: 2 colunas no desktop
Dimensões por coluna:
  - Desktop: ~620px
  - Tablet: 100%
  - Mobile: 100%

Aspect-ratio: 16/9 (NOVO PADRÃO)
Imagem ideal:
  - Dimensão: 620 × 348px
  - Retina: 1240 × 696px
  
Recomendação: 1200 × 675px (universal, redimensionável)
```

## 3. CARDS DE CATEGORIA (Política, Polícia, Economia, Esportes)
```
Localização: .cat-section (3 colunas)
Container: main-grid__primary (920px)
Divisão: 3 colunas com gap 20px
Coluna: (920 - 40) / 3 = 293px

Aspect-ratio: 16/9
Imagem ideal por coluna:
  - Largura: 293px
  - Altura: 165px (16/9 ratio)
  
Recomendação: 600 × 337px (2x para retina)
Ou universal: 1200 × 675px (redimensionável)
```

## 4. CARDS MUNICIPIOS (3 colunas)
```
Localização: .por-municipio .cards-grid--3
Container: 1200px
Colunas: 3
Coluna: (1200 - 40) / 3 = 387px

Aspect-ratio: 16/9
Imagem ideal:
  - Largura: 387px
  - Altura: 218px
  
Recomendação: 800 × 450px ou 1200 × 675px (universal)
```

## 5. CARDS HORIZONTAIS (Notícias Mais Lidas - Sidebar)
```
Localização: .card--horizontal (sidebar)
Tamanho: 110px × 110px (1/1 quadrado)

Aspect-ratio: 1/1
Imagem ideal:
  - Dimensão: 110 × 110px
  - Retina: 220 × 220px
  
Recomendação: 200 × 200px
Nota: Usa miniatura, não a imagem principal
```

## 6. RANKED ITEMS (Mais Lidas Numeradas)
```
Localização: .ranked-item__thumb (sidebar)
Dimensões fixas: 68 × 50px

Aspect-ratio: ~1.36 (68:50)
Imagem ideal:
  - Dimensão: 68 × 50px
  - Retina: 136 × 100px
  
Recomendação: 150 × 110px (redimensionável)
```

## 7. CARDS DE VÍDEO
```
Localização: .card-video__thumb
Container: Similar aos cards de categoria
Aspect-ratio: 16/9

Recomendação: 1200 × 675px (universal)
```

## 8. CARDS CLASSIFICADOS
```
Localização: .card-class__image
Container: Similar aos cards de categoria
Aspect-ratio: 16/9

Recomendação: 1200 × 675px (universal)
```

---

## 📐 DIMENSÃO UNIVERSAL RECOMENDADA

Para simplificar e ter consistência:

**PADRÃO GLOBAL: 1200 × 675px (16/9)**

Vantagens:
- ✅ Cabe em todas as seções (redimensionável responsivo)
- ✅ 16/9 (novo padrão estabelecido)
- ✅ Otimização automática (JPEG + WebP)
- ✅ Retina-ready (2x até 2400 × 1350px)
- ✅ Fácil gerenciamento

---

## 🧪 TESTE RECOMENDADO

1. Criar notícia de teste com imagem 1200 × 675px
2. Verificar em cada seção:
   - Carrossel: ✓
   - Story cards: ✓
   - Categorias (3 col): ✓
   - Mais lidas (sidebar): ✓
3. Validar aspect-ratio mantido
4. Verificar qualidade visual
5. Testar em mobile/tablet
6. Aprovar ou ajustar

