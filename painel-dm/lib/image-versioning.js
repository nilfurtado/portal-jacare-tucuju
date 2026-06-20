/**
 * Image Versioning — Hash-based cache busting
 * 
 * Estratégia:
 * - Gera hash MD5 do arquivo
 * - Renomeia: noticia-{id}-principal.{hash}.jpg
 * - Cache HTTP 1 ano (immutable)
 * - Cache busting automático quando imagem muda
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Gerar hash MD5 de um arquivo
 * @param {Buffer} fileBuffer
 * @returns {string} Hash curto (8 caracteres)
 */
function gerarHash(fileBuffer) {
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
  return hash.substring(0, 8); // Usar primeiros 8 caracteres
}

/**
 * Renomear arquivo com hash
 * @param {string} filepath
 * @param {Buffer} fileBuffer
 * @returns {Promise<string>} Nova URL com hash
 */
async function versionarArquivo(filepath, fileBuffer) {
  try {
    const hash = gerarHash(fileBuffer);
    const dir = path.dirname(filepath);
    const ext = path.extname(filepath);
    const basename = path.basename(filepath, ext);
    
    // Remover hash anterior se existir
    const files = await fs.readdir(dir);
    const antigos = files.filter(f => f.startsWith(basename + '.'));
    for (const antigo of antigos) {
      try {
        await fs.unlink(path.join(dir, antigo));
      } catch (_err) {
        // Ignore
      }
    }

    // Criar novo nome com hash
    const novoNome = `${basename}.${hash}${ext}`;
    const novoPath = path.join(dir, novoNome);
    
    // Salvar arquivo
    await fs.writeFile(novoPath, fileBuffer);
    
    // Retornar URL pública
    const urlRelativa = novoPath.split('site de noticias')[1].replace(/\\/g, '/');
    return urlRelativa;

  } catch (err) {
    console.error('❌ Erro ao versionar:', err.message);
    throw err;
  }
}

/**
 * Atualizar capa com URLs versionadas
 * @param {Object} capa - Objeto capa
 * @param {string} noticiId
 * @param {Object} tamanhos - {jpeg: Buffer, webp: Buffer}
 * @returns {Object} Capa atualizada com URLs hasheadas
 */
async function atualizarCapaComHash(capa, noticiId, uploadDir, tamanhos) {
  try {
    // Versionar JPEG
    const jpegPath = path.join(uploadDir, `noticia-${noticiId}-principal.jpg`);
    const jpegUrl = await versionarArquivo(jpegPath, tamanhos.jpeg);

    // Versionar WebP
    const webpPath = path.join(uploadDir, `noticia-${noticiId}-principal.webp`);
    const webpUrl = await versionarArquivo(webpPath, tamanhos.webp);

    // Atualizar capa com URLs hasheadas
    return {
      ...capa,
      principal: jpegUrl,
      principalWebp: webpUrl,
      homepage: jpegUrl,
      homepageWebp: webpUrl,
      sidebar: jpegUrl,
      mobile: jpegUrl,
      mobileWebp: webpUrl,
      social: jpegUrl,
      socialWebp: webpUrl
    };
  } catch (err) {
    console.error('❌ Erro ao atualizar capa:', err.message);
    throw err;
  }
}

module.exports = {
  gerarHash,
  versionarArquivo,
  atualizarCapaComHash
};
