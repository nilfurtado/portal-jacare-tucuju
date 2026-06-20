const fs = require('fs').promises;
const path = require('path');
const store = require('./lib/store');

async function limparBancos() {
  console.log('🗑️  Limpando notícias incorretas (IDs 23-32)...');
  
  try {
    const jsonPath = path.resolve(__dirname, '..', 'data', 'noticias.json');
    
    // Ler JSON
    const data = await fs.readFile(jsonPath, 'utf8');
    let noticias = JSON.parse(data);
    
    console.log(`📊 Antes: ${noticias.length} notícias`);
    console.log(`   IDs: ${noticias.map(n => n.id).join(', ')}`);
    
    // Filtrar: manter apenas IDs < 23
    noticias = noticias.filter(n => n.id < 23);
    
    console.log(`\n🗑️  Deletadas: IDs 23-32 (10 notícias)`);
    console.log(`📊 Depois: ${noticias.length} notícias`);
    console.log(`   IDs: ${noticias.map(n => n.id).join(', ')}`);
    
    // Gravar JSON
    console.log(`\n💾 Gravando JSON...`);
    await fs.writeFile(jsonPath, JSON.stringify(noticias, null, 2), 'utf8');
    
    // Sincronizar SQLite
    console.log('🔄 Sincronizando SQLite...');
    await store.write('noticias', noticias);
    
    console.log(`\n✅ LIMPO! Mantidas apenas ${noticias.length} notícias originais`);
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  }
}

limparBancos();
