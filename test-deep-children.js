const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForSelector('.article__title', { timeout: 5000 }).catch(() => {});
  
  const result = await page.evaluate(() => {
    const article = document.getElementById('article-root');
    
    // Find all elements with scrollWidth > 375
    const allElements = document.querySelectorAll('*');
    const wideElements = Array.from(allElements)
      .filter(el => el.scrollWidth > 375)
      .slice(0, 20)  // Top 20
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        inline: getComputedStyle(el).display.includes('inline'),
        position: getComputedStyle(el).position,
        overflow: getComputedStyle(el).overflow,
      }));
    
    return wideElements;
  });
  
  console.log('🔍 Elements with scrollWidth > 375px:\n');
  result.forEach((el, i) => {
    console.log(`[${i}] <${el.tag}${el.id ? '#' + el.id : ''}.${el.class}>`);
    console.log(`    scroll=${el.scrollWidth}px, client=${el.clientWidth}px`);
    console.log(`    display=${el.inline ? 'inline' : 'block'}, position=${el.position}, overflow=${el.overflow}`);
  });
  
  await browser.close();
})();
