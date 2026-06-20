const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { slugify, uniqueSlug } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

/** GET / — listar com filtros: q, categoria, autor, status, page, perPage */
router.get('/', async (req, res) => {
  const { q = '', categoria = '', autor = '', status = '', page = 1, perPage = 20 } = req.query;
  let items = await store.read('noticias', []);

  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(n =>
      (n.titulo || '').toLowerCase().includes(needle) ||
      (n.lide   || '').toLowerCase().includes(needle) ||
      (n.tags   || []).some(t => t.toLowerCase().includes(needle))
    );
  }
  if (categoria) items = items.filter(n => n.categoria === categoria);
  if (autor)     items = items.filter(n => (n.autor || '').toLowerCase().includes(autor.toLowerCase()));
  if (status === 'destaque') items = items.filter(n => n.destaque);
  if (status === 'normal')   items = items.filter(n => !n.destaque);

  items.sort((a, b) => new Date(b.data) - new Date(a.data));

  const total = items.length;
  const p  = Math.max(1, parseInt(page, 10) || 1);
  const pp = Math.max(1, Math.min(100, parseInt(perPage, 10) || 20));
  const start = (p - 1) * pp;
  const pageItems = items.slice(start, start + pp);

  res.json({
    total,
    page: p,
    perPage: pp,
    totalPages: Math.ceil(total / pp),
    items: pageItems,
  });
});

/** GET /:id — detalhe */
router.get('/:id', async (req, res) => {
  const noticias = await store.read('noticias', []);
  const n = findById(noticias, req.params.id);
  if (!n) return res.status(404).json({ erro: 'Notícia não encontrada' });
  res.json(n);
});

/** POST / — criar */
router.post('/', requerePermissao('noticias'), async (req, res) => {
  const body = req.body || {};
  if (!body.titulo) return res.status(400).json({ erro: 'Título obrigatório' });

  const noticias = await store.read('noticias', []);
  const slugs = noticias.map(n => n.slug);
  const slug = body.slug ? slugify(body.slug) : uniqueSlug(body.titulo, slugs);
  if (slugs.includes(slug)) {
    return res.status(409).json({ erro: 'Já existe notícia com esse slug' });
  }

  const novo = {
    id: nextId(noticias),
    slug,
    titulo: body.titulo,
    lide: body.lide || '',
    conteudo: body.conteudo || '',
    imagem: body.imagem || '',
    categoria: body.categoria || 'politica',
    municipio: body.municipio || '',
    autor: body.autor || req.user.nome,
    autorAvatar: body.autorAvatar || '',
    data: body.data || new Date().toISOString(),
    tags: Array.isArray(body.tags) ? body.tags : [],
    destaque: !!body.destaque,
    views: Number(body.views) || 0,
    tempoLeitura: Number(body.tempoLeitura) || estimarTempoLeitura(body.conteudo),
    criadoEm: new Date().toISOString(),
    criadoPor: req.user.sub,
  };

  await store.update('noticias', (lista) => {
    lista.push(novo);
    return lista;
  });
  res.status(201).json(novo);
});

/** PUT /:id — editar */
router.put('/:id', requerePermissao('noticias'), async (req, res) => {
  const body = req.body || {};
  let atualizada = null;
  await store.update('noticias', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    const slug = body.slug ? slugify(body.slug) : prev.slug;
    if (slug !== prev.slug && lista.some(n => n.slug === slug)) {
      throw Object.assign(new Error('Slug já existe'), { status: 409 });
    }
    atualizada = {
      ...prev,
      ...body,
      id: prev.id,
      slug,
      tags: Array.isArray(body.tags) ? body.tags : prev.tags,
      tempoLeitura: body.conteudo ? estimarTempoLeitura(body.conteudo) : prev.tempoLeitura,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: req.user.sub,
    };
    lista[i] = atualizada;
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Notícia não encontrada' });
  res.json(atualizada);
});

/** PATCH /:id/destaque — alternar destaque */
router.patch('/:id/destaque', requerePermissao('noticias'), async (req, res) => {
  let atualizada = null;
  await store.update('noticias', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i].destaque = !lista[i].destaque;
    atualizada = lista[i];
    return lista;
  });
  if (!atualizada) return res.status(404).json({ erro: 'Notícia não encontrada' });
  res.json({ id: atualizada.id, destaque: atualizada.destaque });
});

/** DELETE /:id — soft delete → move para lixeira */
router.delete('/:id', requerePermissao('noticias'), async (req, res) => {
  let removida = null;
  await store.update('noticias', (lista) => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removida = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removida) return res.status(404).json({ erro: 'Notícia não encontrada' });

  await store.update('lixeira-noticias', (lista) => {
    lista.push({
      ...removida,
      removidoEm: new Date().toISOString(),
      removidoPor: req.user.sub,
    });
    return lista;
  });

  res.json({ ok: true, id: removida.id });
});

function estimarTempoLeitura(html) {
  const texto = String(html || '').replace(/<[^>]+>/g, ' ');
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 220));
}

module.exports = router;
