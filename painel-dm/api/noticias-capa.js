/**
 * API de Upload de Capas de Notícias
 * POST /api/noticias-capa/upload — Upload + processamento de imagem
 */
const express = require('express');
const { upload, urlPublica } = require('../middleware/upload');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');
const { processarImagem, validarImagem } = require('../lib/image-processor');
const { processar: otimizeImage } = require('../lib/image-optimizer');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
router.use(authJwt);

/**
 * POST /api/noticias-capa/upload
 * Upload de imagem e geração de 5 dimensões
 *
 * Body (multipart):
 *   - file: arquivo de imagem
 *   - noticiId: ID da notícia (obrigatório)
 *
 * Response:
 *   { success: true, capa: { original, principal, principalWebp, ... } }
 */
router.post('/upload', requerePermissao('noticias'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Arquivo de imagem é obrigatório' });
    }

    const { noticiId } = req.body;
    if (!noticiId) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ erro: 'noticiId é obrigatório' });
    }

    // Validar imagem
    if (!validarImagem(req.file)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        erro: 'Formato ou tamanho inválido. Máximo 8MB (JPEG, PNG ou WebP).'
      });
    }

    // Ler arquivo em buffer para otimização
    const imageBuffer = await fs.readFile(req.file.path);
    const uploadDir = path.dirname(req.file.path);

    // NOVA: Processar imagem com otimização AVIF/WebP/JPEG
    console.log(`\n📤 Iniciando otimização AVIF/WebP/JPEG para notícia ${noticiId}...`);
    const { capa: capaOtimizada, otimizacao } = await otimizeImage(
      imageBuffer,
      noticiId,
      uploadDir
    );

    // Usar capa otimizada (AVIF/WebP/JPEG com múltiplas resoluções)
    const capa = capaOtimizada;

    // Limpar arquivo temporário do multer
    await fs.unlink(req.file.path).catch(() => {});

    // Log de sucesso
    console.log(`✅ Upload concluído - Tamanho total otimizado: ${(otimizacao.tamanhoTotal / 1024 / 1024).toFixed(2)}MB`);

    res.status(201).json({
      success: true,
      capa,
      otimizacao: {
        formatos: otimizacao.formatos,
        resolucoes: otimizacao.resolucoes,
        tamanhoTotal: otimizacao.tamanhoTotal
      }
    });
  } catch (err) {
    console.error('Erro ao processar capa:', err);

    // Limpar arquivo em caso de erro
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      erro: 'Erro ao processar imagem: ' + err.message
    });
  }
});

module.exports = router;
