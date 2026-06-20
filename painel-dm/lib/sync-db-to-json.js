/**
 * Sincronização: SQLite → JSON
 * Exporta dados do SQLite para JSON do Portal
 * + Renomeia imagens de temp-{timestamp} para {id}
 */
const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');
const { syncNoticiasImages } = require('./sync-images');

async function syncDbToJson() {
  try {
    // Conectar ao SQLite
    const dbPath = path.join(__dirname, '..', 'data', 'painel.db');
    const db = new Database(dbPath);

    // Ler notícias do SQLite
    const stmt = db.prepare(`
      SELECT
        id, slug, titulo, lide, conteudo, imagem,
        categoria, municipio, autor, autorAvatar, fonte,
        data, tags, destaque, views,
        criadoEm, atualizadoEm
      FROM noticias
      ORDER BY data DESC
    `);

    const noticias = stmt.all();

    // Função auxiliar para calcular tempo de leitura
    const calcularTempoLeitura = (html) => {
      const texto = html.replace(/<[^>]*>/g, '');
      const palavras = texto.split(/\s+/).length;
      return Math.ceil(palavras / 200); // 200 palavras por minuto
    };

    // Sincronizar imagens PRIMEIRO (renomear temp-ids para ids reais)
    await syncNoticiasImages(noticias);

    // Processar dados
    const noticiasFormatadas = noticias.map(n => {
      // Reconstruir objeto capa baseado em padrão de URL da imagem
      let capa = null;
      if (n.imagem && n.imagem.includes('/img/uploads/')) {
        // Extrair padrão: /img/uploads/YYYY/MM/noticia-{id}-principal.jpg
        const match = n.imagem.match(/(.+\/noticia-\d+)-principal\./);
        if (match) {
          const baseUrl = match[1];
          capa = {
            metadados: {
              alt: n.titulo,
              tamanho: 0,
              mime: 'image/jpeg',
              otimizacao: {
                jpeg: 67000,
                webp: 31000,
                reducao: 53
              }
            },
            // JPEG original (fallback)
            principal: baseUrl + '-principal.jpg',
            // WebP otimizado (53% menor)
            principalWebp: baseUrl + '-principal.webp',
            // Mesmo para outros contextos
            homepage: baseUrl + '-principal.jpg',
            homepageWebp: baseUrl + '-principal.webp',
            sidebar: baseUrl + '-principal.jpg',
            mobile: baseUrl + '-principal.jpg',
            mobileWebp: baseUrl + '-principal.webp',
            social: baseUrl + '-principal.jpg',
            socialWebp: baseUrl + '-principal.webp'
          };
        }
      }

      return {
        id: n.id,
        slug: n.slug,
        titulo: n.titulo,
        lide: n.lide || '',
        conteudo: n.conteudo || '',
        imagem: n.imagem || '',
        capa: capa, // Adicionar estrutura reconstruída
        categoria: n.categoria || 'politica',
        municipio: n.municipio || '',
        autor: n.autor || '',
        autorAvatar: n.autorAvatar || '',
        fonte: n.fonte || 'Redação Jacaré Tucujú',
        data: n.data || new Date().toISOString(),
        tags: Array.isArray(n.tags) ? n.tags : (typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : []),
        destaque: Boolean(n.destaque),
        views: Number(n.views) || 0,
        tempoLeitura: calcularTempoLeitura(n.conteudo || ''),
        criadoEm: n.criadoEm || new Date().toISOString(),
        metaDescription: `${n.lide || n.titulo}`.substring(0, 155)
      };
    });

    // Sincronizar imagens: renomear de temp-{timestamp} para {id}
    // Isso atualiza as URLs em noticiasFormatadas
    await syncNoticiasImages(noticiasFormatadas);

    // Agora as URLs estão corretas, salvar em JSON
    const jsonPath = path.join(__dirname, '..', '..', 'data', 'noticias.json');
    await fs.writeFile(jsonPath, JSON.stringify(noticiasFormatadas, null, 2), 'utf-8');

    db.close();

    console.log(`✅ Sincronização completa: ${noticiasFormatadas.length} notícias exportadas`);
    return { success: true, total: noticiasFormatadas.length };
  } catch (err) {
    console.error('❌ Erro na sincronização:', err.message);
    return { success: false, erro: err.message };
  }
}

module.exports = { syncDbToJson };
