const express = require('express');
const fs = require('fs');
const path = require('path');
const store = require('../lib/store');

const router = express.Router();

// Normalizar slug para CSS válido (remove acentos, hífens, etc)
function normalizarSlugCSS(slug) {
  return (slug || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// GET /api/categorias-export/css — Gera CSS bundle completo com cores das categorias
router.get('/css', async (_req, res) => {
  try {
    const cats = await store.read('categorias', []);

    let css = `/* 🎨 BUNDLE CSS — Cores dinâmicas por categoria
   Gerado pelo Painel DM
   Porta: http://localhost:3000/api/categorias-export/css
*/\n\n`;

    // 1️⃣ Variáveis CSS globais
    css += `:root {\n`;
    css += `  --cat-active-color: #FF8C00;\n`;
    css += `  --cat-active-border-width: 4px;\n`;
    cats.forEach((cat, idx) => {
      const slugCSS = normalizarSlugCSS(cat.slug);
      css += `  --cat-${slugCSS}: ${cat.cor};\n`;
    });
    css += `}\n\n`;

    // 2️⃣ Estado ATIVO por categoria
    css += `/* Estados ativos — aplique data-category="slug" no body */\n`;
    cats.forEach((cat) => {
      const slugCSS = normalizarSlugCSS(cat.slug);
      css += `body[data-category="${cat.slug}"],\n`;
      css += `html[data-category="${cat.slug}"] {\n`;
      css += `  --cat-active-color: ${cat.cor} !important;\n`;
      css += `}\n\n`;
    });

    // 3️⃣ Header e Footer — muda com categoria ativa
    css += `/* Header com borda e cor da categoria ativa */\n`;
    css += `html header, html [role="banner"], header, [role="banner"] {\n`;
    css += `  border-bottom: 4px solid var(--cat-active-color) !important;\n`;
    css += `  transition: border-color 0.3s ease, border-width 0.3s ease !important;\n`;
    css += `}\n\n`;

    css += `/* Footer com borda e cor da categoria ativa */\n`;
    css += `html footer, html [role="contentinfo"], footer, [role="contentinfo"] {\n`;
    css += `  border-top: 4px solid var(--cat-active-color) !important;\n`;
    css += `  transition: border-color 0.3s ease, border-width 0.3s ease !important;\n`;
    css += `}\n\n`;

    // Cores específicas para header e footer por categoria
    cats.forEach((cat) => {
      const slugCSS = normalizarSlugCSS(cat.slug);
      css += `/* Header/Footer color para ${cat.nome} */\n`;
      css += `body[data-category="${cat.slug}"] header,\n`;
      css += `body[data-category="${cat.slug}"] [role="banner"],\n`;
      css += `body[data-category="${cat.slug}"] footer,\n`;
      css += `body[data-category="${cat.slug}"] [role="contentinfo"] {\n`;
      css += `  border-color: ${cat.cor} !important;\n`;
      css += `}\n\n`;
    });

    // 4️⃣ Navbar — reordena links + destaca categoria ativa
    css += `/* Links da navegação */\n`;
    css += `nav a, [class*="nav"] a {\n`;
    css += `  position: relative;\n`;
    css += `  transition: color 0.2s ease, order 0.3s ease;\n`;
    css += `  display: inline-flex;\n`;
    css += `}\n\n`;

    // Ordem dinâmica para cada link
    cats.forEach((cat) => {
      const slugCSS = normalizarSlugCSS(cat.slug);
      css += `/* Ordem da categoria ${cat.nome} na navbar */\n`;
      css += `nav a[href*="${cat.slug}"],\n`;
      css += `[class*="nav"] a[href*="${cat.slug}"] {\n`;
      css += `  order: ${cat.ordem};\n`;
      css += `}\n\n`;
    });

    // Links ativos destacados
    cats.forEach((cat) => {
      const slugCSS = normalizarSlugCSS(cat.slug);
      css += `/* Link ativo para categoria ${cat.nome} */\n`;
      css += `body[data-category="${cat.slug}"] nav a[href*="${cat.slug}"],\n`;
      css += `body[data-category="${cat.slug}"] [class*="nav"] a[href*="${cat.slug}"] {\n`;
      css += `  color: ${cat.cor} !important;\n`;
      css += `  font-weight: 700 !important;\n`;
      css += `  border-bottom: 3px solid ${cat.cor} !important;\n`;
      css += `  padding-bottom: 2px !important;\n`;
      css += `}\n\n`;
    });

    // 5️⃣ Outros links destaques
    css += `/* Links padrão sem destaque */\n`;
    css += `nav a, [class*="nav"] a {\n`;
    css += `  border-bottom: 2px solid transparent;\n`;
    css += `  padding-bottom: 2px;\n`;
    css += `}\n\n`;

    // 6️⃣ Variáveis de utilidade
    css += `/* Cores individuais por categoria (use var(--cat-slug)) */\n`;
    cats.forEach((cat, idx) => {
      const slugCSS = normalizarSlugCSS(cat.slug);
      css += `/* ${idx + 1}. ${cat.nome} */\n`;
      css += `.cat-${slugCSS}-bg { background-color: var(--cat-${slugCSS}); }\n`;
      css += `.cat-${slugCSS}-text { color: var(--cat-${slugCSS}); }\n`;
      css += `.cat-${slugCSS}-border { border-color: var(--cat-${slugCSS}); }\n`;
    });

    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.send(css);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/categorias-export/json — Exporta categorias ordenadas para o portal
router.get('/json', async (_req, res) => {
  try {
    const cats = await store.read('categorias', []);
    const ordenadas = cats.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    res.json(ordenadas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/categorias-export/sincronizar — Sincroniza para o portal
router.post('/sincronizar', async (_req, res) => {
  try {
    const cats = await store.read('categorias', []);
    const ordenadas = cats.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    // Sincronizar para ../data/categorias.json (portal)
    const portalPath = path.resolve(__dirname, '../../data/categorias.json');
    fs.writeFileSync(portalPath, JSON.stringify(ordenadas, null, 2), 'utf8');
    
    console.log('[categorias-export] ✅ Sincronizado com portal:', ordenadas.length, 'categorias');
    
    res.json({ 
      mensagem: 'Sincronizado com sucesso',
      total: ordenadas.length,
      categorias: ordenadas.map(c => ({ slug: c.slug, nome: c.nome, ordem: c.ordem }))
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
