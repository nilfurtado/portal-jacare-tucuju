const express = require('express');
const store = require('../lib/store');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const DEFAULT_TEMA = {
  presetAtivo: 'tijolo',
  presets: [
    { id: 'tijolo',   nome: 'Tijolo',   primaria: '#c9551d', secundaria: '#14110d', acento: '#a3441a' },
    { id: 'oceano',   nome: 'Oceano',   primaria: '#2c6e9b', secundaria: '#0d2433', acento: '#1d4d70' },
    { id: 'floresta', nome: 'Floresta', primaria: '#3e7b3a', secundaria: '#0e1a0e', acento: '#2d5c2a' },
    { id: 'noite',    nome: 'Noite',    primaria: '#d4af37', secundaria: '#0a0a0a', acento: '#a8881d' },
    { id: 'amapa',    nome: 'Amapá',    primaria: '#f07e13', secundaria: '#0b3d2e', acento: '#d36500' },
  ],
  modo: 'claro',
  fontes: { display: 'Fraunces', body: 'Geist' },
  corPrimaria: '#c9551d',
};

const DEFAULT_LAYOUT = {
  // === TOPO (header) ===
  topo: {
    cor: 'padrao',                  // padrao | claro | escuro | brand
    tamanhoLogo: '40',              // 30 | 40 | 50 | 60 (%)
    alinhamentoLogo: 'centro',      // esquerda | centro | direita
    dataNoTopo: false,
    storiesDesktop: true,
    storiesMobile: true,
  },

  // === WIDGETS DE INFO ===
  widgets: {
    tempoNoTopo: true,
    tempoCompleto: true,
    financas: false,
    loteria: false,
    sidebarSocial: true,
    sidebarMaisLidas: true,
    sidebarCategorias: true,
    sidebarEnquete: true,
    sidebarClassificados: true,
    sidebarNewsletter: true,
  },

  // === MENU PRINCIPAL ===
  menu: {
    corFundo: 'branca',                 // branca | preta | brand
    itens: ['', '', '', '', '', '', '', '', '', '', ''],  // 11 slots; valor = slug categoria
    exibirMobile: true,
  },

  // === SEÇÃO PRINCIPAL (hero) ===
  secaoPrincipal: {
    layoutHero: 'editorial',            // editorial | magazine | classico
    mostrarManchete: true,
    mostrarCarrossel: true,
    mostrarSecundarias: true,
    qtdSecundarias: 4,
  },

  // === SEÇÕES EXTRAS ===
  secoesExtras: {
    breakingNews: true,
    secaoMunicipios: true,
    secaoVideos: true,
    secaoEnqueteDestaque: true,
    secaoClassificados: true,
    secaoColunistas: true,
    ordem: ['breakingNews','heroCarousel','secaoMunicipios','secaoVideos','secaoEnqueteDestaque','secaoClassificados','secaoColunistas'],
  },

  // === PUBLICIDADES (atalho - estado real fica em /api/anuncios) ===
  publicidades: {
    permitirAds: true,
    pausarTodos: false,
  },

  // === OUTROS ===
  outros: {
    breakingNewsMs: 65000,
    heroCarouselMs: 5500,
    mostrarCopyright: true,
    mostrarPoweredBy: true,
    densidade: 'confortavel',           // compacta | confortavel | espacosa
  },
};

router.get('/', async (_req, res) => {
  const cfg = await store.read('tema-layout', { tema: DEFAULT_TEMA, layout: DEFAULT_LAYOUT });
  const layoutRecebido = cfg.layout || {};
  res.json({
    tema: { ...DEFAULT_TEMA, ...(cfg.tema || {}) },
    layout: {
      topo:           { ...DEFAULT_LAYOUT.topo,           ...(layoutRecebido.topo           || {}) },
      widgets:        { ...DEFAULT_LAYOUT.widgets,        ...(layoutRecebido.widgets        || {}) },
      menu:           { ...DEFAULT_LAYOUT.menu,           ...(layoutRecebido.menu           || {}),
                        itens: layoutRecebido.menu?.itens || DEFAULT_LAYOUT.menu.itens },
      secaoPrincipal: { ...DEFAULT_LAYOUT.secaoPrincipal, ...(layoutRecebido.secaoPrincipal || {}) },
      secoesExtras:   { ...DEFAULT_LAYOUT.secoesExtras,   ...(layoutRecebido.secoesExtras   || {}) },
      publicidades:   { ...DEFAULT_LAYOUT.publicidades,   ...(layoutRecebido.publicidades   || {}) },
      outros:         { ...DEFAULT_LAYOUT.outros,         ...(layoutRecebido.outros         || {}) },
    },
  });
});

router.put('/', requerePermissao('temas'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update('tema-layout', (cur) => {
    const layoutAtual = cur?.layout || DEFAULT_LAYOUT;
    atualizado = {
      tema: { ...(cur?.tema || DEFAULT_TEMA), ...(body.tema || {}) },
      layout: {
        topo:           { ...layoutAtual.topo,           ...(body.layout?.topo           || {}) },
        widgets:        { ...layoutAtual.widgets,        ...(body.layout?.widgets        || {}) },
        menu:           { ...layoutAtual.menu,           ...(body.layout?.menu           || {}) },
        secaoPrincipal: { ...layoutAtual.secaoPrincipal, ...(body.layout?.secaoPrincipal || {}) },
        secoesExtras:   { ...layoutAtual.secoesExtras,   ...(body.layout?.secoesExtras   || {}) },
        publicidades:   { ...layoutAtual.publicidades,   ...(body.layout?.publicidades   || {}) },
        outros:         { ...layoutAtual.outros,         ...(body.layout?.outros         || {}) },
      },
    };
    return atualizado;
  }, { tema: DEFAULT_TEMA, layout: DEFAULT_LAYOUT });
  res.json(atualizado);
});

module.exports = router;
