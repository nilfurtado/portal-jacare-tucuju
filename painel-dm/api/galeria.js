/**
 * API de Galerias — CRUD para imagens em galerias de notícias
 * Endpoints:
 *   GET    /api/galeria              → listar todas as galerias
 *   GET    /api/galeria/:noticia-id  → galeria de uma notícia
 *   POST   /api/galeria              → criar/atualizar galeria
 *   DELETE /api/galeria/:img-id      → remover imagem de galeria
 *   PATCH  /api/galeria/:img-id      → reordenar/editar metadata
 */

const express = require('express');
const store = require('../lib/store');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

/**
 * GET / — Listar todas as galerias de todas as notícias
 */
router.get('/', async (req, res) => {
  try {
    const noticias = await store.read('noticias', []);
    const galerias = noticias
      .filter(n => n.galeria && Array.isArray(n.galeria) && n.galeria.length > 0)
      .map(n => ({
        noticiaId: n.id,
        noticiaSlug: n.slug,
        noticiaTitulo: n.titulo,
        galeria: n.galeria
      }));

    res.json({
      ok: true,
      total: galerias.length,
      data: galerias,
      erro: null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});

/**
 * GET /:noticiaId — Retorna galeria de uma notícia específica
 */
router.get('/:noticiaId', async (req, res) => {
  try {
    const noticias = await store.read('noticias', []);
    const noticia = noticias.find(n => n.id === parseInt(req.params.noticiaId, 10));

    if (!noticia) {
      return res.status(404).json({
        ok: false,
        erro: 'Notícia não encontrada'
      });
    }

    const galeria = noticia.galeria || [];

    res.json({
      ok: true,
      data: {
        noticiaId: noticia.id,
        noticiaSlug: noticia.slug,
        noticiaTitulo: noticia.titulo,
        galeria: galeria
      },
      erro: null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});

/**
 * POST / — Criar ou atualizar galeria de uma notícia
 * Body: { noticiaId, imagens[] }
 * Cada imagem: { id?, src, caption, alt }
 */
router.post('/', requerePermissao('noticias'), async (req, res) => {
  try {
    const { noticiaId, imagens = [] } = req.body;

    if (!noticiaId) {
      return res.status(400).json({
        ok: false,
        erro: 'noticiaId obrigatório'
      });
    }

    if (!Array.isArray(imagens)) {
      return res.status(400).json({
        ok: false,
        erro: 'imagens deve ser um array'
      });
    }

    // Validar limite de imagens
    const MAX_IMAGENS = 10;
    if (imagens.length > MAX_IMAGENS) {
      return res.status(400).json({
        ok: false,
        erro: `Máximo de ${MAX_IMAGENS} imagens por galeria`
      });
    }

    // Validar cada imagem
    for (const img of imagens) {
      if (!img.src) {
        return res.status(400).json({
          ok: false,
          erro: 'Cada imagem deve ter src obrigatório'
        });
      }
    }

    // Gerar IDs para imagens que não têm
    const galeriaProcessada = imagens.map((img, idx) => ({
      id: img.id || `img-${Date.now()}-${idx}`,
      src: img.src,
      caption: img.caption || '',
      alt: img.alt || `Imagem ${idx + 1}`,
      width: img.width || null,
      height: img.height || null,
      ordem: img.ordem !== undefined ? img.ordem : idx
    }));

    let noticia = null;
    await store.update('noticias', (lista) => {
      const idx = lista.findIndex(n => n.id === parseInt(noticiaId, 10));
      if (idx < 0) {
        return lista;
      }

      noticia = {
        ...lista[idx],
        galeria: galeriaProcessada,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: req.user.sub
      };

      lista[idx] = noticia;
      return lista;
    });

    if (!noticia) {
      return res.status(404).json({
        ok: false,
        erro: 'Notícia não encontrada'
      });
    }

    res.status(201).json({
      ok: true,
      data: {
        noticiaId: noticia.id,
        noticiaSlug: noticia.slug,
        galeria: noticia.galeria
      },
      erro: null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});

/**
 * DELETE /:imgId — Remover imagem de uma galeria
 * Query params: noticiaId (obrigatório)
 */
router.delete('/:imgId', requerePermissao('noticias'), async (req, res) => {
  try {
    const { noticiaId } = req.query;

    if (!noticiaId) {
      return res.status(400).json({
        ok: false,
        erro: 'noticiaId obrigatório na query'
      });
    }

    const imgId = req.params.imgId;
    let noticia = null;

    await store.update('noticias', (lista) => {
      const idx = lista.findIndex(n => n.id === parseInt(noticiaId, 10));
      if (idx < 0) {
        return lista;
      }

      const galeria = lista[idx].galeria || [];
      const galeriaAtualizada = galeria.filter(img => img.id !== imgId);

      noticia = {
        ...lista[idx],
        galeria: galeriaAtualizada,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: req.user.sub
      };

      lista[idx] = noticia;
      return lista;
    });

    if (!noticia) {
      return res.status(404).json({
        ok: false,
        erro: 'Notícia não encontrada'
      });
    }

    res.json({
      ok: true,
      data: {
        noticiaId: noticia.id,
        galeria: noticia.galeria
      },
      erro: null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});

/**
 * PATCH /:imgId — Reordenar ou editar metadata de uma imagem
 * Body: { noticiaId, ordem?, caption?, alt? }
 */
router.patch('/:imgId', requerePermissao('noticias'), async (req, res) => {
  try {
    const { noticiaId, ordem, caption, alt } = req.body;

    if (!noticiaId) {
      return res.status(400).json({
        ok: false,
        erro: 'noticiaId obrigatório no body'
      });
    }

    const imgId = req.params.imgId;
    let noticia = null;

    await store.update('noticias', (lista) => {
      const idx = lista.findIndex(n => n.id === parseInt(noticiaId, 10));
      if (idx < 0) {
        return lista;
      }

      const galeria = lista[idx].galeria || [];
      const imgIdx = galeria.findIndex(img => img.id === imgId);

      if (imgIdx < 0) {
        return lista;
      }

      const img = galeria[imgIdx];
      const imgAtualizada = {
        ...img,
        ...(ordem !== undefined && { ordem }),
        ...(caption !== undefined && { caption }),
        ...(alt !== undefined && { alt })
      };

      const galeriaAtualizada = [...galeria];
      galeriaAtualizada[imgIdx] = imgAtualizada;

      // Se reordenar, ordenar toda a galeria
      if (ordem !== undefined) {
        galeriaAtualizada.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      }

      noticia = {
        ...lista[idx],
        galeria: galeriaAtualizada,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: req.user.sub
      };

      lista[idx] = noticia;
      return lista;
    });

    if (!noticia) {
      return res.status(404).json({
        ok: false,
        erro: 'Notícia não encontrada'
      });
    }

    res.json({
      ok: true,
      data: {
        noticiaId: noticia.id,
        galeria: noticia.galeria
      },
      erro: null
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});

module.exports = router;
