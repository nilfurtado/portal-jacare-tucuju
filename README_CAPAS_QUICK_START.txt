================================================================================
  SISTEMA DE CAPAS DE NOTÍCIAS - QUICK START
================================================================================

⚠️  ANTES DE COMEÇAR:

1. INSTALE SHARP (OBRIGATÓRIO):
   ────────────────────────────────
   cd painel-dm
   npm install sharp
   npm run dev

2. SE TIVER NOTÍCIAS ANTIGAS, MIGRE:
   ────────────────────────────────
   node painel-dm/scripts/migrate-capas.js

3. EXECUTE OS TESTES:
   ────────────────────────────────
   node painel-dm/scripts/test-capas.js

   ✓ Deve exibir: "✓ SISTEMA PRONTO PARA PRODUÇÃO!"

================================================================================

🎯 COMO USAR:

1. Acesse o Painel: http://localhost:3000/painel/
2. Vá para: Notícias → Nova Notícia
3. Preencha dados básicos
4. Seção 2 - IMAGEM DE CAPA:
   - Clique ou arraste uma imagem (JPG, PNG, WebP)
   - Aguarde o processamento (15-30 segundos)
   - Veja as 5 dimensões geradas em preview
5. Preencha "Descrição da imagem (alt)"
6. Clique "Publicar notícia"
7. Acesse o portal e veja a capa em:
   - Homepage (grid)
   - Página do artigo (capa grande)
   - Sidebar (thumbnail)

================================================================================

📊 DIMENSÕES GERADAS AUTOMATICAMENTE:

Principal:  1200×675px  (artigo completo)
Homepage:    800×450px  (grid)
Sidebar:     400×225px  (thumbnails)
Mobile:      600×338px  (preview mobile)
Social:    1200×630px  (Open Graph/Twitter)

Cada dimensão em 2 formatos: JPEG + WebP (~50% menor)

================================================================================

✅ RECURSOS IMPLEMENTADOS:

✓ Upload obrigatório de imagem
✓ 5 dimensões otimizadas (desktop, mobile, social)
✓ Recorte automático inteligente (sem distorção)
✓ WebP otimizado (~30% redução de tamanho)
✓ Lazy loading nativo
✓ Meta tags Open Graph & Twitter Card
✓ Alt text para acessibilidade
✓ Reversa-compatibilidade com imagens antigas
✓ Sistema de teste E2E completo
✓ Documentação detalhada

================================================================================

🚀 DEPLOYMENT:

1. Ter Sharp instalado
2. Ter diretório img/uploads/ criado e gravável
3. Executar testes: node painel-dm/scripts/test-capas.js
4. Verificar tudo passou
5. Deploy normal (git push, etc)

================================================================================

❓ DÚVIDAS?

Consulte: CAPAS_SISTEMA.md (documentação completa)

Seções:
- Overview
- Como Usar (step-by-step)
- Dimensões & Formatos
- Testes
- Troubleshooting
- API Reference

================================================================================

📝 ESTRUTURA DE DADOS:

ANTES (antigo):
  noticia.imagem = "/img/uploads/foto.jpg"

DEPOIS (novo):
  noticia.capa = {
    original: "/img/uploads/2026/05/original-123.jpg",
    principal: "/img/uploads/2026/05/noticia-123-principal.jpg",
    principalWebp: "/img/uploads/2026/05/noticia-123-principal.webp",
    homepage: "/img/uploads/2026/05/noticia-123-homepage.jpg",
    homepageWebp: "/img/uploads/2026/05/noticia-123-homepage.webp",
    sidebar: "/img/uploads/2026/05/noticia-123-sidebar.jpg",
    sidebarWebp: "/img/uploads/2026/05/noticia-123-sidebar.webp",
    mobile: "/img/uploads/2026/05/noticia-123-mobile.jpg",
    mobileWebp: "/img/uploads/2026/05/noticia-123-mobile.webp",
    social: "/img/uploads/2026/05/noticia-123-social.jpg",
    socialWebp: "/img/uploads/2026/05/noticia-123-social.webp",
    metadados: {
      largura: 3000,
      altura: 2000,
      mime: "image/jpeg",
      tamanho: 450000,
      alt: "Descrição automática"
    }
  }

================================================================================

Sistema implementado por Claude Haiku 4.5
Data: 2026-05-31
Versão: 1.0

================================================================================
