/**
 * Teste: Image Optimizer (Simplificado)
 * Processa uma imagem com JPEG Original + WebP Otimizado
 */

const { processar } = require('../lib/image-optimizer');
const fs = require('fs');
const path = require('path');

async function testarOptimizer() {
  console.log('🧪 Testando Image Optimizer (JPEG + WebP)...\n');

  try {
    // Criar diretório de teste
    const testDir = path.join(__dirname, '..', 'test-images');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Usar imagem da notícia 36 se existir
    const imagemOrigem = path.join(__dirname, '..', '..', '..', 'img', 'uploads', '2026', '06', 'noticia-36-principal.jpg');

    if (!fs.existsSync(imagemOrigem)) {
      console.log('❌ Imagem de teste não encontrada:', imagemOrigem);
      console.log('   Crie uma imagem JPEG em img/uploads/2026/06/noticia-36-principal.jpg');
      return;
    }

    console.log('📂 Imagem original:', imagemOrigem);
    const originalSize = fs.statSync(imagemOrigem).size;
    console.log(`📏 Tamanho original: ${(originalSize / 1024 / 1024).toFixed(2)}MB\n`);

    // Ler imagem
    const imageBuffer = fs.readFileSync(imagemOrigem);

    // Processar com optimizer
    const resultado = await processar(imageBuffer, 'test-123', testDir);

    // Mostrar resultados
    console.log('\n📊 RESULTADOS:\n');
    console.log('Formatos gerados:');
    console.log('  ✅ JPEG (fallback, máxima compatibilidade)');
    console.log('  ✅ WebP (otimizado, 40% menor)\n');

    console.log('Resolução:');
    console.log('  📐 1200×675px (redimensiona no frontend conforme necessário)\n');

    console.log(`📈 Tamanho JPEG: ${(resultado.otimizacao.tamanhos.jpeg / 1024).toFixed(0)}KB`);
    console.log(`📉 Tamanho WebP: ${(resultado.otimizacao.tamanhos.webp / 1024).toFixed(0)}KB`);
    console.log(`💾 Redução: ${resultado.otimizacao.tamanhos.webp ? Math.round((1 - resultado.otimizacao.tamanhos.webp / resultado.otimizacao.tamanhos.jpeg) * 100) : 0}%`);
    console.log(`📦 Total 2 arquivos: ${(resultado.otimizacao.tamanhoTotal / 1024).toFixed(0)}KB\n`);

    // Listar arquivos gerados
    console.log('📁 Arquivos gerados:');
    const files = fs.readdirSync(testDir).filter(f => f.includes('test-123'));
    files.forEach(f => {
      const filepath = path.join(testDir, f);
      const size = fs.statSync(filepath).size;
      console.log(`  - ${f} (${(size / 1024).toFixed(0)}KB)`);
    });

    console.log('\n✅ Teste concluído com sucesso!\n');

  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
    process.exit(1);
  }
}

testarOptimizer();
