const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForSelector('.article__title', { timeout: 5000 }).catch(() => {});
  
  const result = await page.evaluate(() => {
    const main = document.querySelector('main');
    const articleWrap = document.querySelector('.article-wrap');
    const container = document.querySelector('.container');
    const articleRoot = document.getElementById('article-root');
    
    // Check if container is inside article-root
    const containerInArticle = articleRoot ? articleRoot.querySelector('.container') : null;
    
    // Get computed styles
    const computedArticleRoot = articleRoot ? getComputedStyle(articleRoot) : null;
    const computedContainer = container ? getComputedStyle(container) : null;
    
    return {
      main: main ? { width: main.scrollWidth, style: getComputedStyle(main).width } : null,
      articleWrap: articleWrap ? { width: articleWrap.scrollWidth, style: getComputedStyle(articleWrap).width } : null,
      container: container ? { width: container.scrollWidth, style: getComputedStyle(container).width, position: container.parentElement.className } : null,
      containerInArticle: !!containerInArticle,
      articleRoot: articleRoot ? {
        width: articleRoot.scrollWidth,
        computed: computedArticleRoot.width,
        maxWidth: computedArticleRoot.maxWidth,
        boxSizing: computedArticleRoot.boxSizing,
      } : null,
      articleRootHTML: articleRoot ? articleRoot.innerHTML.substring(0, 150) : null,
    };
  });
  
  console.log('🔍 Container Analysis:');
  console.log(JSON.stringify(result, null, 2));
  
  await browser.close();
})();
