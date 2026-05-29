const express = require('express');
const store = require('../lib/store');
const { slugify } = require('../lib/slugify');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

// Município mora dentro de categorias.json sob a key "municipios"
const FILE = 'categorias';
const KEY  = 'municipios';

router.get('/', async (_req, res) => {
  const muns = await store.read(FILE, [], KEY);
  res.json(muns);
});

router.get('/:slug', async (req, res) => {
  const muns = await store.read(FILE, [], KEY);
  const m = muns.find(x => x.slug === req.params.slug);
  if (!m) return res.status(404).json({ erro: 'Município não encontrado' });
  res.json(m);
});

router.post('/', requerePermissao('municipios'), async (req, res) => {
  const { label, populacao, descricao, imagem } = req.body || {};
  if (!label) return res.status(400).json({ erro: 'Label obrigatório' });
  const slug = slugify(label);

  const muns = await store.read(FILE, [], KEY);
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
  await store.update(FILE, (lista) => [...lista, novo], [], KEY);
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
  }, [], KEY);
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
    return [...lista.slice(0, i), ...lista.slice(i + 1)];
  }, [], KEY);
  if (!removido) return res.status(404).json({ erro: 'Município não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
