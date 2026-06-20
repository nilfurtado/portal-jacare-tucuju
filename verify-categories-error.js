const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile-small', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  console.log('\n🔴 VERIFICAÇÃO DE ERROS - RESPONSIVIDADE (Polícia até Geral)\n');

  for (const vp of viewports) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📱 ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log('='.repeat(70));

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
      await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

      const analysis = await page.evaluate(() => {
        const categories = ['Policia', 'Economia', 'Esportes', 'Cultura', 'Tecnologia', 'Meio-ambiente', 'Geral'];
        const results = [];

        document.querySelectorAll('.cat-section').forEach((section, idx) => {
          const catName = section.querySelector('.section-header h2')?.textContent?.trim() || 'Unknown';
          
          // Verificar se é uma das categorias
          if (!categories.some(c => catName.includes(c))) return;

          const grid = section.querySelector('.cards-grid');
          const cards = section.querySelectorAll('.card');
          
          // Calcular informações
          const gridStyles = window.getComputedStyle(grid);
          const sectionStyles = window.getComputedStyle(section);
          
          const info = {
            category: catName,
            cards: cards.length,
            images: section.querySelectorAll('img').length,
            gridCols: gridStyles.gridTemplateColumns,
            gridGap: gridStyles.gap,
            gridWidth: grid.scrollWidth,
            sectionWidth: section.scrollWidth,
            viewportWidth: window.innerWidth,
            hasOverflow: section.scrollWidth > window.innerWidth,
            cardWidths: [],
            textContent: section.textContent.length
          };

          // Medir cada card
          cards.forEach(card => {
            info.cardWidths.push(card.scrollWidth);
          });

          results.push(info);
        });

        return results;
      });

      // Exibir resultados
      console.log('\n📊 ANÁLISE:\n');
      
      analysis.forEach((cat, idx) => {
        const status = cat.hasOverflow ? '❌' : '✅';
        console.log(`${idx + 1}. ${status} ${cat.category}`);
        console.log(`   Cards: ${cat.cards} | Imagens: ${cat.images} | Textos: ${cat.textContent} caracteres`);
        console.log(`   Grid: ${cat.gridCols}`);
        console.log(`   Gap: ${cat.gridGap}`);
        console.log(`   Larguras dos cards: ${cat.cardWidths.map(w => `${Math.round(w)}px`).join(', ')}`);
        console.log(`   Section: ${cat.sectionWidth}px | Viewport: ${cat.viewportWidth}px`);
        
        if (cat.hasOverflow) {
          console.log(`   ⚠️  OVERFLOW: ${cat.sectionWidth - cat.viewportWidth}px EXCESSO`);
        }
        console.log();
      });

      // Resumo
      const withOverflow = analysis.filter(a => a.hasOverflow).length;
      console.log(`📈 RESUMO: ${withOverflow}/${analysis.length} categorias com overflow`);

      await page.close();
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  await browser.close();
  process.exit(0);
})();
