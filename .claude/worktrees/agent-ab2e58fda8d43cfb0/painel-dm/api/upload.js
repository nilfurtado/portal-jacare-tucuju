const express = require('express');
const { upload, urlPublica } = require('../middleware/upload');
const { authJwt } = require('../middleware/auth-jwt');

const router = express.Router();
router.use(authJwt);

/** POST /api/upload — multipart 'file' → retorna { url } */
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Envie um arquivo no campo "file"' });
  res.status(201).json({
    url: urlPublica(req.file.path),
    mime: req.file.mimetype,
    size: req.file.size,
    originalName: req.file.originalname,
  });
});

module.exports = router;
