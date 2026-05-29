const express = require('express');
const store = require('../lib/store');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const FILE = 'plugins';

router.get('/', async (req, res) => {
  const { categoria = '', tipo = '', status = '', q = '' } = req.query;
  let items = await store.read(FILE, []);
  if (categoria) items = items.filter(p => p.categoria === categoria);
  if (tipo)      items = items.filter(p => p.tipo === tipo);
  if (status === 'instalado')   items = items.filter(p => p.instalado);
  if (status === 'disponivel')  items = items.filter(p => !p.instalado);
  if (status === 'atualizavel') items = items.filter(p => p.instalado && p.versao !== p.ultimaVersao);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(p =>
      (p.nome || '').toLowerCase().includes(needle) ||
      (p.descricao || '').toLowerCase().includes(needle)
    );
  }
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const items = await store.read(FILE, []);
  const p = items.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ erro: 'Plugin não encontrado' });
  res.json(p);
});

router.patch('/:id/instalar', requerePermissao('plugins'), async (req, res) => {
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(p => p.id === req.params.id);
    if (i < 0) return lista;
    lista[i].instalado = true;
    lista[i].versao = lista[i].ultimaVersao;
    lista[i].instaladoEm = new Date().toISOString();
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Plugin não encontrado' });
  res.json({ id: atualizado.id, instalado: true, versao: atualizado.versao });
});

router.patch('/:id/desinstalar', requerePermissao('plugins'), async (req, res) => {
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(p => p.id === req.params.id);
    if (i < 0) return lista;
    lista[i].instalado = false;
    delete lista[i].instaladoEm;
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Plugin não encontrado' });
  res.json({ id: atualizado.id, instalado: false });
});

router.patch('/:id/atualizar', requerePermissao('plugins'), async (req, res) => {
  let atualizado = null;
  await store.update(FILE, lista => {
    const i = lista.findIndex(p => p.id === req.params.id);
    if (i < 0) return lista;
    if (!lista[i].instalado) return lista;
    lista[i].versao = lista[i].ultimaVersao;
    lista[i].atualizadoEm = new Date().toISOString();
    atualizado = lista[i];
    return lista;
  });
  if (!atualizado) return res.status(404).json({ erro: 'Plugin não encontrado ou não instalado' });
  res.json({ id: atualizado.id, versao: atualizado.versao });
});

module.exports = router;
