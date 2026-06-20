const express = require('express');
const store = require('../lib/store');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();

const FILE = 'municipios';

// GET é público (sem autenticação)
router.get('/', async (_req, res) => {
  const muns = await store.read(FILE, []);
  const ativos = muns.filter(m => !m.removidoEm);
  res.json(ativos);
});

router.get('/:slug', async (req, res) => {
  const muns = await store.read(FILE, []);
  const m = muns.find(x => x.slug === req.params.slug);
  if (!m || m.removidoEm) return res.status(404).json({ erro: 'Município não encontrado' });
  res.json(m);
});

// POST, PUT, DELETE requerem autenticação
router.use(authJwt);

router.post('/', requerePermissao('municipios'), async (req, res) => {
  const { label, populacao, descricao, imagem } = req.body || {};
  if (!label) return res.status(400).json({ erro: 'Label obrigatório' });
  const slug = slugify(label);

  const muns = await store.read(FILE, []);
  if (muns.find(m => m.slug === slug)) {
    return res.status(409).json({ erro: 'Município já cadastrado' });
  }
  const novo = {
    slug,
    label,
    populacao: Number(populacao) || 0,
    descricao: descricao || '',
    imagem: imagem || '',
  };
  await store.update(FILE, (lista) => [...lista, novo]);
  res.status(201).json(novo);
});

router.put('/:slug', requerePermissao('municipios'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update(FILE, (lista) => {
    const i = lista.findIndex(m => m.slug === req.params.slug);
    if (i < 0) return lista;
    lista[i] = {
      ...lista[i],
      label:     body.label     ?? lista[i].label,
      populacao: body.populacao != null ? Number(body.populacao) : lista[i].populacao,
      descricao: body.descricao ?? lista[i].descricao,
      imagem:    body.imagem    ?? lista[i].imagem,
    };
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Município não encontrado' });
  res.json(atualizado);
});

router.delete('/:slug', requerePermissao('municipios'), async (req, res) => {
  const noticias = await store.read('noticias', []);
  if (noticias.some(n => n.municipio === req.params.slug)) {
    return res.status(409).json({ erro: 'Município em uso por notícias' });
  }
  let removido = null;
  await store.update(FILE, (lista) => {
    const i = lista.findIndex(m => m.slug === req.params.slug);
    if (i < 0) return lista;
    removido = lista[i];
    lista[i].removidoEm = new Date().toISOString();
    lista[i].removidoPor = req.user?.sub || 'sistema';
    return lista;
  });
  if (!removido) return res.status(404).json({ erro: 'Município não encontrado' });
  res.json({ ok: true, mensagem: 'Município movido para lixeira' });
});

module.exports = router;
