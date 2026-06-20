const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'videos';

/** Extrai ID do YouTube de URL ou retorna o próprio ID. */
function youtubeId(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const m = s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : (s.length === 11 ? s : '');
}

router.get('/', async (req, res) => {
  const { q = '', categoria = '', page = 1, perPage = 20 } = req.query;
  let items = await store.read(FILE, []);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(v => (v.titulo || '').toLowerCase().includes(needle));
  }
  if (categoria) items = items.filter(v => v.categoria === categoria);
  items.sort((a, b) => (b.id || 0) - (a.id || 0));

  const total = items.length;
  const p  = Math.max(1, parseInt(page, 10) || 1);
  const pp = Math.max(1, Math.min(100, parseInt(perPage, 10) || 20));
  res.json({
    total, page: p, perPage: pp,
    totalPages: Math.ceil(total / pp),
    items: items.slice((p - 1) * pp, (p - 1) * pp + pp),
  });
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const v = findById(items, req.params.id);
  if (!v) return res.status(404).json({ erro: 'Vídeo não encontrado' });
  res.json(v);
});

router.post('/', requerePermissao('videos'), async (req, res) => {
  const body = req.body || {};
  if (!body.titulo) return res.status(400).json({ erro: 'Título obrigatório' });
  const yt = youtubeId(body.youtubeId);
  if (!yt) return res.status(400).json({ erro: 'YouTube ID inválido' });

  const items = await store.read(FILE, []);
  const novo = {
    id: nextId(items),
    titulo: body.titulo,
    thumb: body.thumb || `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    duracao: body.duracao || '',
    youtubeId: yt,
    categoria: body.categoria || 'geral',
  };
  await store.update(FILE, lista => [...lista, novo]);
  res.status(201).json(novo);
});

router.put('/:id', requerePermissao('videos'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    const prev = lista[i];
    const yt = body.youtubeId ? youtubeId(body.youtubeId) : prev.youtubeId;
    lista[i] = {
      ...prev,
      titulo:   body.titulo    ?? prev.titulo,
      thumb:    body.thumb     ?? prev.thumb,
      duracao:  body.duracao   ?? prev.duracao,
      categoria:body.categoria ?? prev.categoria,
      youtubeId: yt,
    };
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Vídeo não encontrado' });
  res.json(atualizado);
});

router.delete('/:id', requerePermissao('videos'), async (req, res) => {
  let removido = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removido = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removido) return res.status(404).json({ erro: 'Vídeo não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
