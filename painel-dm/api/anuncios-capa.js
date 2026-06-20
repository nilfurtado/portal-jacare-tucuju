/**
 * API Upload de Capas de Anúncios
 * POST /api/anuncios-capa/upload — Upload + otimização JPEG + WebP
 */

const express = require('express');
const { upload } = require('../middleware/upload');
const { authJwt } = require('../middleware/auth-jwt');
const { requerePermissao } = require('../middleware/permissoes');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const store = require('../lib/store');

const router = express.Router();
router.use(authJwt);

// Dimensões de cada tipo de anúncio
const DIMENSOES_ANUNCIOS = {
  'interstitial': { width: 580, height: 400 },    // Pop-up
  'super-banner': { width: 970, height: 150 },    // Super Banner
  'half-page': { width: 300, height: 600 },       // Half Page
  'medium-rectangle': { width: 300, height: 250 }, // Medium Rectangle
  'billboard': { width: 970, height: 90 }         // Billboard
};

/**
 * POST /api/anuncios-capa/upload
 * Upload de criativo (imagem) para anúncio
 */
router.post('/upload', requerePermissao('anuncios'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Arquivo de imagem é obrigatório' });
    }

    const { anuncioId, tipo } = req.body;
    if (!anuncioId) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ erro: 'anuncioId é obrigatório' });
    }

    // Validar tipo e obter dimensões
    const dimensoes = DIMENSOES_ANUNCIOS[tipo];
    if (!dimensoes) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        erro: 'Tipo de anúncio inválido. Tipos válidos: interstitial, super-banner, half-page, medium-rectangle, billboard'
      });
    }

    // Validar imagem
    if (!req.file.mimetype.startsWith('image/')) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ erro: 'Arquivo deve ser uma imagem' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ erro: 'Arquivo muito grande (máximo 5MB)' });
    }

    // Ler arquivo
    const imageBuffer = await fs.readFile(req.file.path);
    const uploadDir = path.dirname(req.file.path);

    console.log(`\n📤 Processando anúncio ${anuncioId} (${tipo}) - ${dimensoes.width}×${dimensoes.height}`);

    // Processar JPEG + WebP com dimensões corretas
    const criativo = await processarAnuncio(imageBuffer, anuncioId, uploadDir, dimensoes);

    // Salvar URLs no banco de dados
    await store.update('anuncios', (anuncios) => {
      const anuncio = anuncios.find(a => a.id === parseInt(anuncioId));
      if (anuncio) {
        anuncio.criativo = anuncio.criativo || {};
        anuncio.criativo.imagem = criativo.imagem;
        anuncio.criativo.imagemWebp = criativo.imagemWebp;
      }
      return anuncios;
    }, []);

    // Limpar arquivo temporário
    await fs.unlink(req.file.path).catch(() => {});

    res.status(201).json({
      success: true,
      criativo,
      dimensoes: `${dimensoes.width}×${dimensoes.height}`
    });

  } catch (err) {
    console.error('Erro ao processar anúncio:', err);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ erro: 'Erro ao processar imagem: ' + err.message });
  }
});

/**
 * Processar anúncio em JPEG + WebP
 */
async function processarAnuncio(imageBuffer, anuncioId, uploadDir, dimensoes) {
  console.log(`🖼️  Otimizando para ${dimensoes.width}×${dimensoes.height}`);

  // JPEG
  const jpegPath = path.join(uploadDir, `anuncio-${anuncioId}.jpg`);
  const jpegBuffer = await sharp(imageBuffer)
    .resize(dimensoes.width, dimensoes.height, { fit: 'cover', withoutEnlargement: true })
    .toFormat('jpeg', { quality: 80, progressive: true })
    .toBuffer();

  await fs.writeFile(jpegPath, jpegBuffer);
  console.log(`  ✅ JPEG: ${(jpegBuffer.length / 1024).toFixed(0)}KB`);

  // WebP
  const webpPath = path.join(uploadDir, `anuncio-${anuncioId}.webp`);
  const webpBuffer = await sharp(imageBuffer)
    .resize(dimensoes.width, dimensoes.height, { fit: 'cover', withoutEnlargement: true })
    .toFormat('webp', { quality: 75 })
    .toBuffer();

  await fs.writeFile(webpPath, webpBuffer);
  console.log(`  ✅ WebP: ${(webpBuffer.length / 1024).toFixed(0)}KB`);

  const reducao = Math.round((1 - webpBuffer.length / jpegBuffer.length) * 100);
  console.log(`  📉 Redução WebP: ${reducao}%\n`);

  // Data dinâmica para os paths de upload
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const basePath = `/img/uploads/${ano}/${mes}`;

  return {
    imagem: `${basePath}/anuncio-${anuncioId}.jpg`,
    imagemWebp: `${basePath}/anuncio-${anuncioId}.webp`,
    tamanhos: {
      jpeg: jpegBuffer.length,
      webp: webpBuffer.length,
      reducao: reducao
    }
  };
}

module.exports = router;
