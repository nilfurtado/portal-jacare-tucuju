const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { parseStringPromise } = require('xml2js');
const store = require('./lib/store');

async function importarMacapa() {
  console.log('🔄 Importando notícias da Agência Macapá...');
  
  try {
    // Ler JSON atual
    const jsonPath = path.resolve(__dirname, '..', 'data', 'noticias.json');
    let noticias = [];
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      noticias = JSON.parse(data);
    } catch (e) {
      console.log('📝 JSON vazio, iniciando nova lista');
      noticias = [];
    }

    // Pegar próximo ID
    let maxId = noticias.length > 0 ? Math.max(...noticias.map(n => n.id)) : 17;
    console.log(`📌 Próximo ID: ${maxId + 1}`);

    // Buscar feed RSS
    const url = 'https://agencia.macapa.ap.gov.br/feed/';
    console.log(`📡 Buscando feed: ${url}`);
    
    const xml = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const parsed = await parseStringPromise(xml);
    const items = parsed.rss.channel[0].item || [];
    
    console.log(`📰 Encontradas ${items.length} notícias`);

    // Processar cada item
    for (const item of items) {
      const id = ++maxId;
      
      const noticia = {
        id,
        slug: (item.title[0] || '').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80),
        titulo: item.title[0] || '',
        lide: item.description[0] || '',
        conteudo: `<p>${item.description[0] || ''}</p>`,
        categoria: 'geral',
        municipio: '',
        autor: 'Agência Macapá',
        autorAvatar: '',
        fonte: 'Redação Jacaré Tucujú',
        data: item.pubDate[0] || new Date().toISOString(),
        tags: '["Agência Macapá","rss-import","macapá"]',
        destaque: false,
        views: 0,
        tempoLeitura: 1,
        criadoEm: new Date().toISOString(),
        capa: null,
        imagem: item.description[0] || ''
      };
      
      noticias.push(noticia);
      console.log(`  ✅ ID ${id}: ${noticia.titulo.substring(0, 60)}...`);
    }

    // Gravar JSON
    console.log(`\n💾 Gravando ${noticias.length} notícias no JSON...`);
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf8');
    
    // Sincronizar no SQLite via store
    console.log('🔄 Sincronizando SQLite...');
    await store.write('noticias', noticias);
    
    console.log(`\n✅ SUCESSO! ${items.length} notícias importadas`);
    console.log(`📊 Total no sistema: ${noticias.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

importarMacapa();
