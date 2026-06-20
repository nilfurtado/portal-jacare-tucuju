const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

  const gridInfo = await page.evaluate(() => {
    const firstCat = document.querySelector('.cat-section .cards-grid');
    if (!firstCat) return { error: 'cards-grid not found' };

    const info = {
      cardsGrid: {
        width: firstCat.scrollWidth,
        display: window.getComputedStyle(firstCat).display,
        gridCols: window.getComputedStyle(firstCat).gridTemplateColumns,
        gap: window.getComputedStyle(firstCat).gap,
        padding: window.getComputedStyle(firstCat).padding
      },
      parent: {}
    };

    // Verificar parent (cat-section)
    const catSection = firstCat.parentElement;
    if (catSection) {
      info.catSection = {
        width: catSection.scrollWidth,
        display: window.getComputedStyle(catSection).display,
        padding: window.getComputedStyle(catSection).padding,
        margin: window.getComputedStyle(catSection).margin
      };
    }

    // Verificar grandparent
    const main = catSection?.parentElement;
    if (main) {
      info.mainGrid = {
        width: main.scrollWidth,
        display: window.getComputedStyle(main).display,
        padding: window.getComputedStyle(main).padding,
        gap: window.getComputedStyle(main).gap
      };
    }

    // Verificar o container dentro de main-grid
    const container = main?.querySelector('.container');
    if (container) {
      info.container = {
        width: container.scrollWidth,
        padding: window.getComputedStyle(container).padding,
        maxWidth: window.getComputedStyle(container).maxWidth
      };
    }

    return info;
  });

  console.log('\n🔍 ESTRUTURA HIERÁRQUICA DO GRID (Mobile 375px)\n');
  console.log(JSON.stringify(gridInfo, null, 2));

  await browser.close();
  process.exit(0);
})();
