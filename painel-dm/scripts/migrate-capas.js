/**
 * Script de Migração: Atualizar notícias existentes com nova estrutura de capas
 * Execução: node painel-dm/scripts/migrate-capas.js
 *
 * O que faz:
 * 1. Lê todas as notícias
 * 2. Para cada notícia com campo 'imagem' antigo:
 *    - Se houver capa já processada: usar os URLs existentes
 *    - Se não houver: criar estrutura simples com 'imagem' antigo
 * 3. Atualiza o banco de dados
 * 4. Exibe relatório de migração
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');

async function migrate() {
  console.log('🔄 Iniciando migração de notícias para novo sistema de capas...\n');

  try {
    // Ler notícias
    const noticiasPath = path.join(DATA_DIR, 'noticias.json');
    const noticiasRaw = await fs.readFile(noticiasPath, 'utf8');
    const noticias = JSON.parse(noticiasRaw);

    if (!Array.isArray(noticias)) {
      throw new Error('noticias.json deve ser um array');
    }

    console.log(`📊 Total de notícias: ${noticias.length}`);

    let migradas = 0;
    let comCapa = 0;
    let semImagem = 0;

    // Processar cada notícia
    const noticiasAtualizadas = noticias.map(noticia => {
      // Se já tem estrutura nova de capa, não fazer nada
      if (noticia.capa && typeof noticia.capa === 'object') {
        comCapa++;
        return noticia;
      }

      // Se tem campo 'imagem' antigo, criar estrutura de capa simplificada
      if (noticia.imagem) {
        migradas++;
        const novaEstrutura = {
          ...noticia,
          capa: {
            original: noticia.imagem,
            principal: noticia.imagem,
            principalWebp: noticia.imagem.replace(/\.(jpg|png|webp)$/i, '.webp'),
            homepage: noticia.imagem,
            homepageWebp: noticia.imagem.replace(/\.(jpg|png|webp)$/i, '.webp'),
            sidebar: noticia.imagem,
            sidebarWebp: noticia.imagem.replace(/\.(jpg|png|webp)$/i, '.webp'),
            mobile: noticia.imagem,
            mobileWebp: noticia.imagem.replace(/\.(jpg|png|webp)$/i, '.webp'),
            social: noticia.imagem,
            socialWebp: noticia.imagem.replace(/\.(jpg|png|webp)$/i, '.webp'),
            metadados: {
              largura: 0,
              altura: 0,
              mime: noticia.imagem.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
              tamanho: 0,
              alt: `Imagem de capa da notícia: ${noticia.titulo}`
            }
          }
        };

        console.log(`  ✓ Migrada: "${noticia.titulo.substring(0, 50)}..."`);
        return novaEstrutura;
      } else {
        semImagem++;
        console.log(`  ⚠ Sem imagem: "${noticia.titulo.substring(0, 50)}..."`);
        return noticia;
      }
    });

    // Salvar notícias atualizadas
    const tmpPath = noticiasPath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(noticiasAtualizadas, null, 2), 'utf8');
    await fs.rename(tmpPath, noticiasPath);

    console.log('\n📈 Relatório da Migração:');
    console.log(`  ✓ Migradas para nova estrutura: ${migradas}`);
    console.log(`  ✓ Já tinham estrutura nova: ${comCapa}`);
    console.log(`  ⚠ Sem imagem de capa: ${semImagem}`);
    console.log(`  📁 Total processado: ${noticiasAtualizadas.length}\n`);

    console.log('✅ Migração concluída com sucesso!');
    console.log('📝 Próximo passo: fazer upload das imagens de capa para gerar dimensões otimizadas');
    console.log('   Acesse: http://localhost:3000/painel/ → Notícias → Editar cada notícia\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro durante migração:', err.message);
    process.exit(1);
  }
}

// Executar
migrate();
