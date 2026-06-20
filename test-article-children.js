const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForSelector('.article__title', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  const result = await page.evaluate(() => {
    const article = document.getElementById('article-root');
    if (!article) return { error: 'No article-root found' };
    
    const children = Array.from(article.children).map(el => ({
      tag: el.tagName,
      class: el.className,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      offsetWidth: el.offsetWidth,
      hasOverflow: el.scrollWidth > window.innerWidth,
    }));
    
    return {
      article: {
        scrollWidth: article.scrollWidth,
        clientWidth: article.clientWidth,
        offsetWidth: article.offsetWidth,
      },
      children,
    };
  });
  
  console.log('📄 Article-Root Children:');
  console.log(`article-root: scroll=${result.article.scrollWidth}px, client=${result.article.clientWidth}px\n`);
  
  result.children.forEach((child, i) => {
    const overflow = child.hasOverflow ? '❌' : '✅';
    console.log(`${overflow} [${i}] <${child.tag} class="${child.class}">`);
    console.log(`    scroll=${child.scrollWidth}px, client=${child.clientWidth}px`);
  });
  
  await browser.close();
})();
