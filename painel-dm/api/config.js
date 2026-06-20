const express = require('express');
const path = require('path');
const fs = require('fs');
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

router.delete('/logo/:field', requerePermissao('configuracoes'), async (req, res) => {
  const field = req.params.field;

  if (!['logoClara', 'logoEscura', 'favicon'].includes(field)) {
    return res.status(400).json({ erro: 'Campo inválido' });
  }

  const cfg = await store.read('config', DEFAULT);
  const url = cfg.portal?.[field];

  if (url) {
    const filePath = path.join(process.cwd(), url.startsWith('/') ? url.substring(1) : url);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') console.warn(`Falha ao deletar arquivo: ${filePath}`, err);
    });
  }

  await store.update('config', (cur) => {
    if (cur.portal) delete cur.portal[field];
    return cur;
  });

  res.json({ ok: true, field, deletado: true });
});

module.exports = router;
