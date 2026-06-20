const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForTimeout(2000);
  
  const result = await page.evaluate(() => {
    // Procurar elementos de todas as formas
    const bySelectorTitle = document.querySelector('.article__title');
    const byTagH1 = document.querySelector('h1');
    const byTagP = document.querySelector('p.article__lide');
    const byAll = document.querySelectorAll('[class*="article__"]');
    
    // Procurar em toda a página
    const allDivs = document.querySelectorAll('div, h1, h2, h3, p, article');
    const articleElements = Array.from(allDivs).filter(el => {
      const classes = el.className.includes('article') || el.tagName === 'ARTICLE';
      return classes;
    }).map(el => ({
      tag: el.tagName,
      class: el.className,
      height: el.offsetHeight,
      text: el.textContent.substring(0, 30),
    }));
    
    return {
      bySelector: !!bySelectorTitle,
      byTag: !!byTagH1,
      byP: !!byTagP,
      allWithArticle: byAll.length,
      articlesFound: articleElements,
    };
  });
  
  console.log('🔍 Element Search Results:');
  console.log('querySelector(.article__title):', result.bySelector);
  console.log('querySelector(h1):', result.byTag);
  console.log('querySelector(p.article__lide):', result.byP);
  console.log('querySelectorAll([class*="article__"]):', result.allWithArticle);
  console.log('');
  console.log('Elements with "article" class/tag:');
  result.articlesFound.forEach((el, i) => {
    console.log(`  [${i}] <${el.tag} class="${el.class}"> ${el.height}px - "${el.text}"`);
  });
  
  await browser.close();
})();
