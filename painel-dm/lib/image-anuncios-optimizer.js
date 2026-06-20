/**
 * Image Optimizer para Anúncios — JPEG + WebP
 *
 * Otimização dual:
 * - JPEG: qualidade 80 (compatibilidade máxima)
 * - WebP: qualidade 75 (reduz ~40%)
 *
 * Dimensões por localId (DIMENSOES_LOCAIS)
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const QUALITY = {
  jpeg: 80,
  webp: 75
};

/**
 * Otimizar imagem de anúncio para JPEG + WebP
 * @param {Buffer} imageBuffer - Imagem original
 * @param {number} anuncioId - ID do anúncio
 * @param {Object} dimensoes - { width, height }
 * @param {string} uploadDir - Diretório de upload
 * @returns {Promise<Object>} URLs dos 2 formatos + tamanhos
 */
async function otimizeImage(imageBuffer, anuncioId, dimensoes, uploadDir) {
  console.log(`🖼️  Otimizando imagem do anúncio ${anuncioId} (${dimensoes.width}×${dimensoes.height}px)...`);

  const results = {
    jpeg: null,
    webp: null,
    tamanhos: {}
  };

  try {
    // Gerar timestamp para pasta de data (YYYY/MM)
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dataPasta = `${ano}/${mes}`;

    // 1️⃣ JPEG Original (fallback para navegadores antigos)
    const jpegPath = path.join(uploadDir, dataPasta, `anuncio-${anuncioId}-principal.jpg`);

    // Garantir que pasta existe
    const jpegDir = path.dirname(jpegPath);
    if (!require('fs').existsSync(jpegDir)) {
      require('fs').mkdirSync(jpegDir, { recursive: true });
    }

    const jpegBuffer = await sharp(imageBuffer)
      .resize(dimensoes.width, dimensoes.height, { fit: 'cover', withoutEnlargement: true })
      .toFormat('jpeg', { quality: QUALITY.jpeg, progressive: true })
      .toBuffer();

    await fs.writeFile(jpegPath, jpegBuffer);
    results.jpeg = `/img/uploads/${dataPasta}/anuncio-${anuncioId}-principal.jpg`;
    results.tamanhos.jpeg = jpegBuffer.length;
    console.log(`  ✅ JPEG: ${(jpegBuffer.length / 1024).toFixed(0)}KB`);

    // 2️⃣ WebP Otimizado (versão leve)
    const webpPath = path.join(uploadDir, dataPasta, `anuncio-${anuncioId}-principal.webp`);

    const webpBuffer = await sharp(imageBuffer)
      .resize(dimensoes.width, dimensoes.height, { fit: 'cover', withoutEnlargement: true })
      .toFormat('webp', { quality: QUALITY.webp })
      .toBuffer();

    await fs.writeFile(webpPath, webpBuffer);
    results.webp = `/img/uploads/${dataPasta}/anuncio-${anuncioId}-principal.webp`;
    results.tamanhos.webp = webpBuffer.length;
    console.log(`  ✅ WebP: ${(webpBuffer.length / 1024).toFixed(0)}KB`);

    // Estatística
    const reducao = Math.round((1 - webpBuffer.length / jpegBuffer.length) * 100);
    console.log(`  📊 Redução WebP: ${reducao}%\n`);

  } catch (err) {
    console.warn(`  ⚠️  Erro ao otimizar:`, err.message);
    throw err;
  }

  return results;
}

module.exports = { otimizeImage };
