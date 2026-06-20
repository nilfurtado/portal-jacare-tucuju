const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Teste em mobile portrait (375px)
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

  // Encontrar elementos com overflow
  const overflowingElements = await page.evaluate(() => {
    const elements = [];
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
      if (el.scrollWidth > window.innerWidth) {
        const rect = el.getBoundingClientRect();
        elements.push({
          tag: el.tagName,
          class: el.className,
          id: el.id,
          width: el.scrollWidth,
          viewportWidth: window.innerWidth,
          overflow: el.scrollWidth - window.innerWidth
        });
      }
    });
    
    return elements.sort((a, b) => b.overflow - a.overflow).slice(0, 10);
  });

  console.log('\n🔍 Elementos com OVERFLOW em Mobile Portrait (375px):\n');
  overflowingElements.forEach((el, i) => {
    console.log(`${i + 1}. <${el.tag}${el.id ? '#' + el.id : ''}${el.class ? '.' + el.class.split(' ')[0] : ''}>`);
    console.log(`   Largura: ${el.width}px (${el.overflow}px overflow)`);
  });

  await browser.close();
  process.exit(0);
})();
