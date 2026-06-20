const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  console.log('\n📂 ANÁLISE DAS SEÇÕES DE CATEGORIAS\n');

  for (const vp of viewports) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📱 ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log('='.repeat(60));

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
      await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

      const catData = await page.evaluate(() => {
        const sections = {};

        document.querySelectorAll('.cat-section').forEach((section, idx) => {
          const header = section.querySelector('.section-header');
          const categoryName = header ? header.querySelector('h2')?.textContent : 'Unknown';
          const bar = header ? header.querySelector('.bar') : null;
          const barColor = bar ? window.getComputedStyle(bar).backgroundColor : 'none';

          const cards = section.querySelectorAll('.card');
          const images = section.querySelectorAll('img');
          
          // Verificar grid
          const cardsGrid = section.querySelector('.cards-grid');
          const gridCols = cardsGrid ? window.getComputedStyle(cardsGrid).gridTemplateColumns : 'N/A';
          const gridGap = cardsGrid ? window.getComputedStyle(cardsGrid).gap : 'N/A';

          // Verificar overflow
          const hasOverflow = section.scrollWidth > window.innerWidth;

          sections[categoryName.trim()] = {
            cards: cards.length,
            images: images.length,
            barColor: barColor,
            gridColumns: gridCols,
            gridGap: gridGap,
            overflow: hasOverflow,
            scrollWidth: section.scrollWidth,
            clientWidth: section.clientWidth
          };
        });

        return sections;
      });

      // Exibir resultados
      Object.entries(catData).forEach(([cat, data]) => {
        console.log(`\n📌 ${cat}`);
        console.log(`   Cards: ${data.cards} | Imagens: ${data.images}`);
        console.log(`   Grid: ${data.gridColumns} (gap: ${data.gridGap})`);
        console.log(`   Overflow: ${data.overflow ? '❌ SIM' : '✅ NÃO'}`);
        if (data.overflow) {
          console.log(`   Width: ${data.scrollWidth}px (viewport: ${vp.width}px)`);
        }
      });

      // Resumo geral
      const sections = Object.keys(catData).length;
      const totalCards = Object.values(catData).reduce((sum, s) => sum + s.cards, 0);
      const totalImages = Object.values(catData).reduce((sum, s) => sum + s.images, 0);

      console.log(`\n📊 RESUMO:`);
      console.log(`   Total de seções: ${sections}`);
      console.log(`   Total de cards: ${totalCards}`);
      console.log(`   Total de imagens: ${totalImages}`);

      await page.close();
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  await browser.close();
  process.exit(0);
})();
