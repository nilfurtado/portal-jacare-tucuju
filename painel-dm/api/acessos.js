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
router.get('/', async (req, res) => {
  const [noticias, anuncios] = await Promise.all([
    store.read('noticias', []),
    store.read('anuncios', []),
  ]);

  // Período selecionado: padrão 30 dias, aceita 7 ou 90
  const period = parseInt(req.query.period) || 30;
  const validPeriods = [7, 30, 90];
  const days = validPeriods.includes(period) ? period : 30;

  // Calcular data de início do período
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dataInicio = new Date(hoje); dataInicio.setDate(hoje.getDate() - (days - 1));
  const dataInicioStr = dataInicio.toISOString().slice(0, 10);

  // Filtrar notícias do período selecionado
  const noticiasPeriodo = noticias.filter(n => {
    if (!n.data) return false;
    const dataNota = n.data.slice(0, 10);
    return dataNota >= dataInicioStr;
  });

  // Série de dias retroativos, agrupando views por dia de publicação
  const dias = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(hoje); d.setDate(hoje.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    let views = noticiasPeriodo
      .filter(n => n.data && n.data.slice(0, 10) === chave)
      .reduce((s, n) => s + (n.views || 0), 0);
    // Dados sintéticos para demo se não houver views reais
    if (views === 0 && noticiasPeriodo.length > 0) {
      views = Math.floor(Math.random() * 500) + 50;
    }
    dias.push({ data: chave, views });
  }

  // Métricas apenas do período
  let totalViews = noticiasPeriodo.reduce((s, n) => s + (n.views || 0), 0);
  // Dados sintéticos para demo
  if (totalViews === 0) {
    totalViews = dias.reduce((s, d) => s + d.views, 0);
  }

  // Adicionar dados sintéticos se não houver views
  const noticiasComViews = noticiasPeriodo.map(n => ({
    ...n,
    views: n.views || Math.floor(Math.random() * 1000) + 100
  }));

  const topNoticias = [...noticiasComViews]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map(n => ({ id: n.id, titulo: n.titulo, categoria: n.categoria, views: n.views || 0, slug: n.slug }));

  const editoriasMap = {};
  for (const n of noticiasComViews) {
    const k = n.categoria || 'outras';
    editoriasMap[k] = (editoriasMap[k] || 0) + (n.views || 0);
  }
  const editorias = Object.entries(editoriasMap)
    .map(([categoria, views]) => ({ categoria, views }))
    .sort((a, b) => b.views - a.views);

  // Filtrar anúncios do período selecionado (se tiverem data)
  const anunciosPeriodo = anuncios.filter(a => {
    if (!a.data) return true; // Se não tiver data, inclui (anúncios permanentes)
    const dataAd = a.data.slice(0, 10);
    return dataAd >= dataInicioStr;
  });

  const adImpressoes = anunciosPeriodo.reduce((s, a) => s + (a.impressoes || 0), 0);
  const adCliques    = anunciosPeriodo.reduce((s, a) => s + (a.cliques    || 0), 0);
  const adCTR = adImpressoes ? (adCliques / adImpressoes) * 100 : 0;

  res.json({
    totalViews,
    totalNoticias: noticiasPeriodo.length,
    period: days,
    dias,
    topNoticias,
    editorias,
    publicidade: {
      slotsAtivos: anunciosPeriodo.filter(a => a.ativo).length,
      totalSlots: anunciosPeriodo.length,
      impressoes: adImpressoes,
      cliques: adCliques,
      ctr: Number(adCTR.toFixed(2)),
    },
  });
});

module.exports = router;
