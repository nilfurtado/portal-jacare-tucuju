/**
 * Sincronização de caminhos de imagens
 * Corrige URLs de capas que usam temp-ids para usar o ID real da notícia
 */
const fs = require('fs').promises;
const path = require('path');

async function syncNoticiasImages(noticias) {
  const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'img', 'uploads');

  for (const noticia of noticias) {
    if (!noticia.imagem || !noticia.imagem.includes('temp-')) continue;

    // Extrair ID temporário da URL
    const tempMatch = noticia.imagem.match(/noticia-temp-(\d+)/);
    if (!tempMatch) continue;

    const tempId = tempMatch[1];

    // Substituir URL de temp- para ID real
    noticia.imagem = noticia.imagem.replace(/noticia-temp-\d+/, `noticia-${noticia.id}`);

    // Tentar renomear arquivos no disco
    try {
      const urlMatch = noticia.imagem.match(/uploads\/(\d+)\/(\d+)\//);
      if (!urlMatch) continue;

      const [_, ano, mes] = urlMatch;
      const diretorio = path.join(UPLOAD_ROOT, ano, mes);

      // Listar arquivos do diretório
      const files = await fs.readdir(diretorio);

      // Encontrar e renomear todos os arquivos do temp-id
      for (const file of files) {
        if (file.includes(`noticia-temp-${tempId}`)) {
          const nomeNovo = file.replace(`noticia-temp-${tempId}`, `noticia-${noticia.id}`);
          const caminhoAntigo = path.join(diretorio, file);
          const caminhoNovo = path.join(diretorio, nomeNovo);

          try {
            await fs.rename(caminhoAntigo, caminhoNovo);
            console.log(`✓ ${file} → ${nomeNovo}`);
          } catch (err) {
            console.warn(`⚠ Não conseguiu renomear ${file}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠ Erro ao processar imagens da notícia ${noticia.id}:`, err.message);
    }
  }

  return noticias;
}

module.exports = { syncNoticiasImages };
