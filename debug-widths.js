const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

  const widths = await page.evaluate(() => {
    return {
      viewport: window.innerWidth,
      html: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      main: document.querySelector('main')?.scrollWidth,
      container: document.querySelector('.container')?.scrollWidth,
      mainGrid: document.querySelector('.main-grid')?.scrollWidth,
      mainGridPrimary: document.querySelector('.main-grid__primary')?.scrollWidth,
      catSection: document.querySelector('.cat-section')?.scrollWidth,
      cardsGrid: document.querySelector('.cards-grid')?.scrollWidth,
      firstCard: document.querySelector('.card')?.scrollWidth
    };
  });

  console.log('\n📐 LARGURAS REAIS (Mobile 375px):\n');
  Object.entries(widths).forEach(([key, val]) => {
    const overflow = val > 375 ? ' ❌' : ' ✅';
    console.log(`${key.padEnd(20)}: ${val}px${overflow}`);
  });

  await browser.close();
  process.exit(0);
})();
