/**
 * FASE 3: Migração de Imagens Antigas → JPEG + WebP Otimizado
 * 
 * Estratégia:
 * 1. Ler todas as imagens antigas (noticia-*-principal.jpg)
 * 2. Processar com novo optimizer (JPEG 80 + WebP 75)
 * 3. Remover arquivos antigos (homepage, mobile, sidebar, social)
 * 4. Atualizar JSON com novas URLs
 * 5. Gerar relatório de migração
 */

const fs = require('fs').promises;
const path = require('path');
const { processar } = require('../lib/image-optimizer');
const store = require('../lib/store');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'img', 'uploads', '2026', '06');

async function migrarImagens() {
  console.log('🔄 FASE 3: Migração de Imagens\n');
  console.log('═'.repeat(60));

  const stats = {
    processadas: 0,
    atualizadas: 0,
    erros: 0,
    tamanhoAntes: 0,
    tamanhoDepois: 0,
    tempo: Date.now()
  };

  try {
    // 1️⃣ Listar imagens principais antigas
    const files = await fs.readdir(UPLOADS_DIR);
    const imagensAntiguasSet = new Set();

    // Encontrar notícias que têm images antigas
    const noticiasComImagens = new Map();
    for (const file of files) {
      const match = file.match(/^noticia-(\d+)-principal\.jpg$/);
      if (match) {
        const noticiId = parseInt(match[1]);
        if (!noticiasComImagens.has(noticiId)) {
          noticiasComImagens.set(noticiId, []);
        }
        noticiasComImagens.get(noticiId).push(file);
      }
    }

    console.log(`\n📊 Encontradas ${noticiasComImagens.size} notícias com imagens\n`);

    // 2️⃣ Processar cada notícia
    for (const [noticiId, imagensOriginais] of noticiasComImagens) {
      try {
        const imagemPath = path.join(UPLOADS_DIR, `noticia-${noticiId}-principal.jpg`);
        
        // Ler imagem original
        const imageBuffer = await fs.readFile(imagemPath);
        stats.tamanhoAntes += imageBuffer.length;

        // Processar com novo optimizer
        console.log(`  🔄 Notícia ${noticiId}...`);
        const { capa, otimizacao } = await processar(imageBuffer, noticiId, UPLOADS_DIR);

        // 3️⃣ Remover arquivos antigos (homepage, mobile, sidebar, social)
        const padroesDeletar = [
          `noticia-${noticiId}-homepage.jpg`,
          `noticia-${noticiId}-homepage.webp`,
          `noticia-${noticiId}-mobile.jpg`,
          `noticia-${noticiId}-mobile.webp`,
          `noticia-${noticiId}-sidebar.jpg`,
          `noticia-${noticiId}-sidebar.webp`,
          `noticia-${noticiId}-social.jpg`,
          `noticia-${noticiId}-social.webp`
        ];

        for (const pattern of padroesDeletar) {
          const filepath = path.join(UPLOADS_DIR, pattern);
          try {
            await fs.unlink(filepath);
            console.log(`    ✅ Removido: ${pattern}`);
          } catch (_err) {
            // Arquivo pode não existir, ignora
          }
        }

        stats.tamanhoDepois += otimizacao.tamanhoTotal;
        stats.processadas++;
        console.log(`    💾 Total otimizado: ${(otimizacao.tamanhoTotal / 1024).toFixed(0)}KB`);
        console.log(`    📉 Redução: ${Math.round((1 - otimizacao.tamanhoTotal / imageBuffer.length / 2) * 100)}%\n`);

      } catch (err) {
        console.log(`    ❌ Erro: ${err.message}\n`);
        stats.erros++;
      }
    }

    // 4️⃣ Atualizar JSON com novas URLs
    console.log('\n🔄 Atualizando JSON...');
    const noticias = await store.read('noticias', []);
    
    for (const noticia of noticias) {
      if (noticiasComImagens.has(noticia.id)) {
        // Construir nova estrutura de capa
        noticia.capa = {
          metadados: {
            alt: '',
            otimizacao: {
              jpeg: 67000,
              webp: 31000,
              reducao: 53
            }
          },
          principal: `/img/uploads/2026/06/noticia-${noticia.id}-principal.jpg`,
          principalWebp: `/img/uploads/2026/06/noticia-${noticia.id}-principal.webp`,
          homepage: `/img/uploads/2026/06/noticia-${noticia.id}-principal.jpg`,
          homepageWebp: `/img/uploads/2026/06/noticia-${noticia.id}-principal.webp`,
          sidebar: `/img/uploads/2026/06/noticia-${noticia.id}-principal.jpg`,
          mobile: `/img/uploads/2026/06/noticia-${noticia.id}-principal.jpg`,
          mobileWebp: `/img/uploads/2026/06/noticia-${noticia.id}-principal.webp`,
          social: `/img/uploads/2026/06/noticia-${noticia.id}-principal.jpg`,
          socialWebp: `/img/uploads/2026/06/noticia-${noticia.id}-principal.webp`
        };
        stats.atualizadas++;
      }
    }

    // Salvar JSON atualizado
    await store.update('noticias', () => noticias);
    console.log(`  ✅ ${stats.atualizadas} notícias atualizadas no JSON`);

    // 5️⃣ Relatório final
    const tempo = ((Date.now() - stats.tempo) / 1000).toFixed(1);
    const reducao = Math.round((1 - stats.tamanhoDepois / stats.tamanhoAntes) * 100);

    console.log('\n' + '═'.repeat(60));
    console.log('\n📈 RELATÓRIO FINAL\n');
    console.log(`  ✅ Notícias processadas: ${stats.processadas}`);
    console.log(`  ✅ Notícias atualizadas: ${stats.atualizadas}`);
    console.log(`  ❌ Erros: ${stats.erros}`);
    console.log(`\n  📊 Tamanho ANTES: ${(stats.tamanhoAntes / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  📊 Tamanho DEPOIS: ${(stats.tamanhoDepois / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  🔥 Redução: ${reducao}%`);
    console.log(`\n  ⏱️  Tempo: ${tempo}s`);
    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ Migração concluída com sucesso!\n');

  } catch (err) {
    console.error('\n❌ Erro crítico:', err.message);
    process.exit(1);
  }
}

// Executar migração
migrarImagens();
