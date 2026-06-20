const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForSelector('.article__title', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  const result = await page.evaluate(() => {
    const elements = [
      document.documentElement,
      document.body,
      document.querySelector('header'),
      document.querySelector('.topbar'),
      document.querySelector('main'),
      document.querySelector('.article-wrap'),
      document.querySelector('.container'),
      document.querySelector('.article-grid'),
      document.getElementById('article-root'),
      document.querySelector('.sidebar'),
    ].filter(el => el);
    
    const findings = elements.map(el => ({
      selector: el.className || el.tagName,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      offsetWidth: el.offsetWidth,
      overflow: el.scrollWidth > window.innerWidth,
    }));
    
    return {
      windowWidth: window.innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      findings,
    };
  });
  
  console.log(`📱 Mobile (375px) - Overflow Source`);
  console.log(`Window: ${result.windowWidth}px, Document: ${result.docScrollWidth}px\n`);
  
  result.findings.forEach(f => {
    const status = f.overflow ? '❌' : '✅';
    console.log(`${status} ${f.selector}`);
    console.log(`   scroll=${f.scrollWidth}px, client=${f.clientWidth}px, offset=${f.offsetWidth}px`);
  });
  
  await browser.close();
})();
