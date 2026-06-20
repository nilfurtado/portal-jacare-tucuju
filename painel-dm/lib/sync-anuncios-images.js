/**
 * Sincronização de imagens para Anúncios
 * Renomeia arquivos de temp-id para ID real e atualiza URLs no banco
 */
const fs = require('fs').promises;
const path = require('path');

async function syncAnunciosImages(anuncios) {
  const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'img', 'uploads');

  for (const anuncio of anuncios) {
    // Verificar se criativo tem imagem com temp-id
    if (!anuncio.criativo) continue;

    const imagem = anuncio.criativo.imagem;
    if (!imagem || !imagem.includes('temp-')) continue;

    console.log(`🔄 Sincronizando imagens do anúncio ${anuncio.id}...`);

    // Extrair ID temporário da URL
    const tempMatch = imagem.match(/anuncio-temp-(\d+)/);
    if (!tempMatch) continue;

    const tempId = tempMatch[1];

    // Substituir URL de temp- para ID real
    anuncio.criativo.imagem = imagem.replace(/anuncio-temp-\d+/, `anuncio-${anuncio.id}`);

    // Também atualizar WebP se existir
    if (anuncio.criativo.imagemWebp) {
      anuncio.criativo.imagemWebp = anuncio.criativo.imagemWebp.replace(/anuncio-temp-\d+/, `anuncio-${anuncio.id}`);
    }

    // Tentar renomear arquivos no disco
    try {
      const urlMatch = imagem.match(/uploads\/(\d+)\/(\d+)\//);
      if (!urlMatch) continue;

      const [_, ano, mes] = urlMatch;
      const diretorio = path.join(UPLOAD_ROOT, ano, mes);

      // Listar arquivos do diretório
      const files = await fs.readdir(diretorio);

      // Encontrar e renomear todos os arquivos do temp-id
      for (const file of files) {
        if (file.includes(`anuncio-temp-${tempId}`)) {
          const nomeNovo = file.replace(`anuncio-temp-${tempId}`, `anuncio-${anuncio.id}`);
          const caminhoAntigo = path.join(diretorio, file);
          const caminhoNovo = path.join(diretorio, nomeNovo);

          try {
            await fs.rename(caminhoAntigo, caminhoNovo);
            console.log(`  ✓ ${file} → ${nomeNovo}`);
          } catch (err) {
            console.warn(`  ⚠ Não conseguiu renomear ${file}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠ Erro ao processar imagens do anúncio ${anuncio.id}:`, err.message);
    }
  }

  return anuncios;
}

module.exports = { syncAnunciosImages };
