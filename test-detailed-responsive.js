const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
  ];

  console.log('\n🎯 ANÁLISE DETALHADA - RESPONSIVIDADE\n');

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
        const result = {};

        // 1. CARROSSEL
        const carousel = document.querySelector('.hero-featured-carousel');
        if (carousel) {
          const track = carousel.querySelector('.hero-featured-carousel__track');
          const cards = carousel.querySelectorAll('.hero-card');
          result.carousel = {
            exists: true,
            cards: cards.length,
            images: carousel.querySelectorAll('img').length,
            overflow: track.scrollWidth > window.innerWidth,
            trackWidth: track.scrollWidth,
            viewportWidth: window.innerWidth
          };
        }

        // 2. CATEGORIAS (primeira seção)
        const firstCatSection = document.querySelector('.cat-section');
        if (firstCatSection) {
          const grid = firstCatSection.querySelector('.cards-grid');
          const cards = firstCatSection.querySelectorAll('.card');
          const categoryName = firstCatSection.querySelector('.section-header h2')?.textContent || 'Unknown';
          
          result.firstCategory = {
            name: categoryName.trim(),
            cards: cards.length,
            images: firstCatSection.querySelectorAll('img').length,
            text_elements: firstCatSection.querySelectorAll('p, h3, a').length,
            gridColumns: grid ? window.getComputedStyle(grid).gridTemplateColumns : 'N/A',
            gridGap: grid ? window.getComputedStyle(grid).gap : 'N/A',
            overflow: firstCatSection.scrollWidth > window.innerWidth,
            sectionWidth: firstCatSection.scrollWidth,
            viewport: window.innerWidth
          };
        }

        // 3. TODAS AS CATEGORIAS
        const allCategories = [];
        document.querySelectorAll('.cat-section').forEach((section, idx) => {
          const grid = section.querySelector('.cards-grid');
          const catName = section.querySelector('.section-header h2')?.textContent?.trim() || 'Unknown';
          
          allCategories.push({
            category: catName,
            cards: section.querySelectorAll('.card').length,
            images: section.querySelectorAll('img').length,
            texts: section.querySelectorAll('p, h3, a').length,
            hasOverflow: section.scrollWidth > window.innerWidth,
            gridCols: grid ? window.getComputedStyle(grid).gridTemplateColumns : 'N/A'
          });
        });

        result.allCategories = allCategories;

        // 4. SIDEBAR
        const sidebar = document.querySelector('.sidebar');
        result.sidebar = {
          visible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
          images: sidebar ? sidebar.querySelectorAll('img').length : 0,
          texts: sidebar ? sidebar.querySelectorAll('p, h3, a').length : 0
        };

        return result;
      });

      // EXIBIR RESULTADOS
      console.log('\n🎬 CARROSSEL:');
      if (analysis.carousel) {
        console.log(`   Cards: ${analysis.carousel.cards} | Imagens: ${analysis.carousel.images}`);
        console.log(`   Overflow: ${analysis.carousel.overflow ? '❌' : '✅'}`);
        if (analysis.carousel.overflow) {
          console.log(`   Track: ${analysis.carousel.trackWidth}px / Viewport: ${analysis.carousel.viewportWidth}px`);
        }
      }

      console.log(`\n📌 PRIMEIRA CATEGORIA (${analysis.firstCategory.name}):`);
      console.log(`   Cards: ${analysis.firstCategory.cards} | Imagens: ${analysis.firstCategory.images} | Textos: ${analysis.firstCategory.text_elements}`);
      console.log(`   Grid: ${analysis.firstCategory.gridColumns} (gap: ${analysis.firstCategory.gridGap})`);
      console.log(`   Overflow: ${analysis.firstCategory.overflow ? '❌ SIM' : '✅ NÃO'}`);
      if (analysis.firstCategory.overflow) {
        console.log(`   Largura: ${analysis.firstCategory.sectionWidth}px / Viewport: ${analysis.firstCategory.viewport}px`);
      }

      console.log(`\n📊 TODAS AS CATEGORIAS (${analysis.allCategories.length}):`);
      let overflowCount = 0;
      analysis.allCategories.forEach(cat => {
        const status = cat.hasOverflow ? '❌' : '✅';
        if (cat.hasOverflow) overflowCount++;
        console.log(`   ${status} ${cat.category}: ${cat.cards} cards, ${cat.images} img, ${cat.texts} textos | Grid: ${cat.gridCols}`);
      });
      console.log(`   Total com overflow: ${overflowCount}/${analysis.allCategories.length}`);

      console.log(`\n📰 SIDEBAR:`);
      console.log(`   Visível: ${analysis.sidebar.visible ? '✅' : '❌'} | Imagens: ${analysis.sidebar.images} | Textos: ${analysis.sidebar.texts}`);

      await page.close();
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }

  await browser.close();
  process.exit(0);
})();
