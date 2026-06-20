/**
 * Teste: Image Versioning com Hash
 */

const { gerarHash } = require('../lib/image-versioning');
const fs = require('fs');

console.log('🧪 Testando Image Versioning\n');

// Simular 2 versões da mesma imagem
const v1 = Buffer.from('imagem versao 1 conteudo maior');
const v2 = Buffer.from('imagem versao 2 conteudo maior com mudancas');

const hash1 = gerarHash(v1);
const hash2 = gerarHash(v2);

console.log('Versão 1 (original):');
console.log(`  noticia-36-principal.${hash1}.jpg`);
console.log(`  Hash: ${hash1}\n`);

console.log('Versão 2 (atualizada):');
console.log(`  noticia-36-principal.${hash2}.jpg`);
console.log(`  Hash: ${hash2}\n`);

if (hash1 !== hash2) {
  console.log('✅ Cache busting funcionando!');
  console.log('   Quando usuário edita imagem:');
  console.log('   - Novo hash gerado automaticamente');
  console.log('   - Browser ignora cache antigo (URL diferente)');
  console.log('   - Browser carrega nova versão imediatamente\n');
} else {
  console.log('⚠️ Hashes iguais (conteúdo idêntico)');
}

console.log('📊 Benefícios do versioning com hash:\n');
console.log('  1️⃣ Cache HTTP 1 ano seguro (arquivo versionado)');
console.log('  2️⃣ Cache busting automático (URL diferente)');
console.log('  3️⃣ Sem necessidade de query strings (?v=123)');
console.log('  4️⃣ CDN-friendly (cada versão é separada)');
console.log('  5️⃣ Rollback fácil (manter versão antiga)\n');

console.log('🎯 Headers HTTP com versioning:\n');
console.log('  Cache-Control: public, max-age=31536000, immutable');
console.log('  ETag: "' + hash1 + '"');
console.log('  Vary: Accept-Encoding, Accept');
console.log('\n✅ Teste concluído!\n');
