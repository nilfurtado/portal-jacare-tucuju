const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForSelector('.article__title', { timeout: 5000 }).catch(() => {});
  
  const result = await page.evaluate(() => {
    return {
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      windowInnerWidth: window.innerWidth,
      documentOverflowX: getComputedStyle(document.documentElement).overflowX,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      canScrollHorizontally: document.body.scrollWidth > window.innerWidth,
    };
  });
  
  console.log('📏 Scroll Metrics:');
  console.log(`Document: scroll=${result.documentScrollWidth}px, client=${result.documentClientWidth}px`);
  console.log(`Body:     scroll=${result.bodyScrollWidth}px, client=${result.bodyClientWidth}px`);
  console.log(`Window:   innerWidth=${result.windowInnerWidth}px`);
  console.log('');
  console.log(`HTML overflow-x: ${result.documentOverflowX}`);
  console.log(`BODY overflow-x: ${result.bodyOverflowX}`);
  console.log(`Can scroll horizontally: ${result.canScrollHorizontally}`);
  
  // Try to scroll
  const scrollResult = await page.evaluate(() => {
    window.scrollBy(100, 0);
    return window.scrollX;
  });
  
  console.log(`Scroll position after scrollBy(100,0): ${scrollResult}px`);
  
  await browser.close();
})();
