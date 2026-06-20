const express = require('express');
const store = require('../lib/store');
const { nextId, findById, indexById } = require('../lib/ids');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'comentarios';

router.get('/', async (req, res) => {
  const { status = '', noticiaSlug = '' } = req.query;
  let items = await store.read(FILE, []);
  if (status) items = items.filter(c => c.status === status);
  if (noticiaSlug) items = items.filter(c => c.noticiaSlug === noticiaSlug);
  items.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const c = findById(items, req.params.id);
  if (!c) return res.status(404).json({ erro: 'Comentário não encontrado' });
  res.json(c);
});

/** POST público (sem auth seria o ideal, mas vamos manter atrás de auth no v1) */
router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.autor || !body.texto || !body.noticiaSlug) {
    return res.status(400).json({ erro: 'autor, texto e noticiaSlug obrigatórios' });
  }
  const items = await store.read(FILE, []);
  const novo = {
    id: nextId(items),
    noticiaSlug: body.noticiaSlug,
    autor: body.autor,
    email: body.email || '',
    texto: body.texto,
    status: 'pendente', // pendente | aprovado | rejeitado
    criadoEm: new Date().toISOString(),
  };
  await store.update(FILE, lista => [...lista, novo]);
  res.status(201).json(novo);
});

router.patch('/:id/aprovar', requerePermissao('comentarios'), async (req, res) => {
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i].status = 'aprovado';
    lista[i].moderadoEm = new Date().toISOString();
    lista[i].moderadoPor = req.user.sub;
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Comentário não encontrado' });
  res.json({ id: atualizado.id, status: atualizado.status });
});

router.patch('/:id/rejeitar', requerePermissao('comentarios'), async (req, res) => {
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    lista[i].status = 'rejeitado';
    lista[i].moderadoEm = new Date().toISOString();
    lista[i].moderadoPor = req.user.sub;
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Comentário não encontrado' });
  res.json({ id: atualizado.id, status: atualizado.status });
});

router.delete('/:id', requerePermissao('comentarios'), async (req, res) => {
  let removido = null;
  await store.update(FILE, lista => {
    const i = indexById(lista, req.params.id);
    if (i < 0) return lista;
    removido = lista[i];
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  });
  if (!removido) return res.status(404).json({ erro: 'Comentário não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
