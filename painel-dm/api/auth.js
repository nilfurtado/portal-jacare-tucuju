const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../lib/store');
const { sign, authJwt } = require('../middleware/auth-jwt');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, usuario, senha } = req.body || {};
  const credencial = email || usuario;
  if (!credencial || !senha) {
    return res.status(400).json({ erro: 'Informe usuário/e-mail e senha' });
  }
  const usuarios = await store.read('usuarios', []);
  const user = usuarios.find(u =>
    u.email?.toLowerCase() === credencial.toLowerCase() ||
    u.nome?.toLowerCase() === credencial.toLowerCase()
  );
  if (!user || user.status === 'N') {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }
  const ok = await bcrypt.compare(senha, user.senha || '');
  if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });

  const payload = {
    sub: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    permissoes: user.permissoes || {},
  };
  const token = sign(payload);
  res.json({
    token,
    usuario: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      foto: user.foto || null,
    },
  });
});

router.get('/me', authJwt, async (req, res) => {
  const usuarios = await store.read('usuarios', []);
  const user = usuarios.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    foto: user.foto || null,
    permissoes: user.permissoes || {},
  });
});

router.post('/logout', authJwt, (_req, res) => {
  // Stateless JWT: cliente apenas descarta o token.
  res.json({ ok: true });
});

router.post('/refresh', authJwt, async (req, res) => {
  // Renovar token se ainda for válido
  const payload = {
    sub: req.user.sub,
    nome: req.user.nome,
    email: req.user.email,
    tipo: req.user.tipo,
    permissoes: req.user.permissoes || {},
  };
  const novoToken = sign(payload);
  res.json({ token: novoToken });
});

module.exports = router;
