/**
 * Image Processor — Processa imagens com Sharp
 * Gera 5 dimensões com recorte inteligente centralizado + WebP
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Dimensões obrigatórias (width x height em pixels)
const DIMENSIONS = {
  principal: { w: 1200, h: 675, aspect: 16/9, desc: 'Artigo completo' },
  homepage: { w: 800, h: 450, aspect: 16/9, desc: 'Homepage destaque' },
  sidebar: { w: 400, h: 225, aspect: 16/9, desc: 'Miniatura sidebar' },
  mobile: { w: 600, h: 338, aspect: 16/9, desc: 'Preview mobile' },
  social: { w: 1200, h: 630, aspect: 1.9, desc: 'Open Graph/Twitter' }
};

const FORMATS = ['jpg', 'webp'];
const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'img', 'uploads');

/**
 * Recorte Inteligente Centralizado
 * Nunca distorce; sempre mantém aspect ratio ao fazer crop
 */
async function getSmartCropSharp(inputPath, targetWidth, targetHeight) {
  const metadata = await sharp(inputPath).metadata();

  const aspectTarget = targetWidth / targetHeight;
  const aspectOriginal = metadata.width / metadata.height;

  let cropWidth = metadata.width;
  let cropHeight = metadata.height;
  let cropX = 0;
  let cropY = 0;

  if (Math.abs(aspectOriginal - aspectTarget) < 0.01) {
    return sharp(inputPath).resize(targetWidth, targetHeight, { fit: 'fill' });
  }

  if (aspectOriginal > aspectTarget) {
    cropWidth = Math.round(metadata.height * aspectTarget);
    cropX = Math.round((metadata.width - cropWidth) / 2);
  } else {
    cropHeight = Math.round(metadata.width / aspectTarget);
    cropY = Math.round((metadata.height - cropHeight) / 2);
  }

  return sharp(inputPath)
    .extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight })
    .resize(targetWidth, targetHeight, { fit: 'fill' });
}

/**
 * Processa uma imagem e gera 5 dimensões em JPEG + WebP
 * @param {string} inputPath - Caminho da imagem original
 * @param {string} noticiId - ID da notícia (para nomear arquivos)
 * @returns {Promise<Object>} Objeto com URLs de todas as versões
 */
async function processarImagem(inputPath, noticiId) {
  const d = new Date();
  const dir = path.join(UPLOAD_ROOT, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
  await fs.mkdir(dir, { recursive: true });

  // Ler informações da imagem original
  const originalMetadata = await sharp(inputPath).metadata();

  // Salvar original com prefixo
  const originalFilename = `original-noticia-${noticiId}.${originalMetadata.format}`;
  const originalPath = path.join(dir, originalFilename);
  await sharp(inputPath).toFile(originalPath);

  const results = {
    original: `/img/uploads/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${originalFilename}`,
    metadados: {
      largura: originalMetadata.width,
      altura: originalMetadata.height,
      mime: `image/${originalMetadata.format}`,
      tamanho: (await fs.stat(inputPath)).size,
      alt: `Imagem de capa da notícia`
    }
  };

  // Processar cada dimensão
  for (const [key, dim] of Object.entries(DIMENSIONS)) {
    // JPEG
    const jpgFilename = `noticia-${noticiId}-${key}.jpg`;
    const jpgPath = path.join(dir, jpgFilename);
    const jpgSharp = await getSmartCropSharp(inputPath, dim.w, dim.h);
    await jpgSharp
      .jpeg({ quality: 80, progressive: true })
      .toFile(jpgPath);

    results[key] = `/img/uploads/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${jpgFilename}`;

    // WebP (otimizado)
    const webpFilename = `noticia-${noticiId}-${key}.webp`;
    const webpPath = path.join(dir, webpFilename);
    const webpSharp = await getSmartCropSharp(inputPath, dim.w, dim.h);
    await webpSharp
      .webp({ quality: 75 })
      .toFile(webpPath);

    results[`${key}Webp`] = `/img/uploads/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${webpFilename}`;
  }

  return results;
}

/**
 * Valida arquivo de imagem
 * @param {Object} file - Objeto multer.file
 * @returns {boolean} True se válido
 */
function validarImagem(file) {
  if (!file) return false;

  const mimes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 8 * 1024 * 1024; // 8MB

  return mimes.includes(file.mimetype) && file.size <= maxSize;
}

module.exports = {
  processarImagem,
  validarImagem,
  DIMENSIONS,
  FORMATS
};
