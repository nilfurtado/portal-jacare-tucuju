const express = require('express');
const store = require('../lib/store');
const { authJwt } = require('../middleware/auth-jwt');

const router = express.Router();
router.use(authJwt);

/**
 * Métricas agregadas para o dashboard de acessos.
 * Por ora deriva tudo dos JSONs (sem coleta real ainda).
 *  - totalViews: soma de views das notícias
 *  - dia: série temporal sintética baseada em data de publicação
 *  - topNoticias: 10 mais lidas
 *  - editorias: views por editoria
 *  - anuncios: impressões/cliques agregados
 */
router.get('/', async (_req, res) => {
  const [noticias, anuncios] = await Promise.all([
    store.read('noticias', []),
    store.read('anuncios', []),
  ]);

  const totalViews = noticias.reduce((s, n) => s + (n.views || 0), 0);

  // Série de 30 dias retroativos, agrupando views por dia de publicação
  const dias = [];
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje); d.setDate(hoje.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    const views = noticias
      .filter(n => n.data && n.data.slice(0, 10) === chave)
      .reduce((s, n) => s + (n.views || 0), 0);
    dias.push({ data: chave, views });
  }

  const topNoticias = [...noticias]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map(n => ({ id: n.id, titulo: n.titulo, categoria: n.categoria, views: n.views || 0, slug: n.slug }));

  const editoriasMap = {};
  for (const n of noticias) {
    const k = n.categoria || 'outras';
    editoriasMap[k] = (editoriasMap[k] || 0) + (n.views || 0);
  }
  const editorias = Object.entries(editoriasMap)
    .map(([categoria, views]) => ({ categoria, views }))
    .sort((a, b) => b.views - a.views);

  const adImpressoes = anuncios.reduce((s, a) => s + (a.impressoes || 0), 0);
  const adCliques    = anuncios.reduce((s, a) => s + (a.cliques    || 0), 0);
  const adCTR = adImpressoes ? (adCliques / adImpressoes) * 100 : 0;

  res.json({
    totalViews,
    totalNoticias: noticias.length,
    dias,
    topNoticias,
    editorias,
    publicidade: {
      slotsAtivos: anuncios.filter(a => a.ativo).length,
      totalSlots: anuncios.length,
      impressoes: adImpressoes,
      cliques: adCliques,
      ctr: Number(adCTR.toFixed(2)),
    },
  });
});

module.exports = router;
