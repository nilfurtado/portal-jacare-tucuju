const express = require('express');
const store = require('../lib/store');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');

const router = express.Router();
router.use(authJwt);

const DEFAULT = {
  portal: { nome: '', slogan: '', url: '' },
  whatsapp: { grupo: '', numero: '' },
  redes: { facebook: '', instagram: '', youtube: '' },
};

router.get('/', async (_req, res) => {
  const cfg = await store.read('config', DEFAULT);
  res.json(cfg);
});

router.put('/', requerePermissao('configuracoes'), async (req, res) => {
  const body = req.body || {};
  let atualizado = null;
  await store.update('config', (cur) => {
    atualizado = {
      portal:   { ...(cur?.portal   || {}), ...(body.portal   || {}) },
      whatsapp: { ...(cur?.whatsapp || {}), ...(body.whatsapp || {}) },
      redes:    { ...(cur?.redes    || {}), ...(body.redes    || {}) },
    };
    return atualizado;
  }, DEFAULT);
  res.json(atualizado);
});

module.exports = router;
