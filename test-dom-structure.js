const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000/noticia.html?slug=pororoca-definicao-ocorrencia-causas-e-caracteristicas');
  await page.waitForTimeout(3000);
  
  const result = await page.evaluate(() => {
    const article = document.getElementById('article-root');
    
    // Get all direct children
    const children = article ? Array.from(article.children).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.textContent.substring(0, 50),
      height: el.offsetHeight,
    })) : [];
    
    // Find elements by selector
    const title = document.querySelector('.article__title');
    const lide = document.querySelector('.article__lide');
    const body = document.querySelector('.article__body');
    
    // Also check by XPath
    const titleByXPath = document.evaluate("//h1[contains(@class, 'article__title')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    return {
      articleExists: !!article,
      articleHTML: article ? article.innerHTML.substring(0, 100) : null,
      articleChildren: children,
      titleSelector: !!title,
      titleHeight: title ? title.offsetHeight : 0,
      titleContent: title ? title.textContent.substring(0, 50) : null,
      lideSelector: !!lide,
      lideHeight: lide ? lide.offsetHeight : 0,
      bodySelector: !!body,
      bodyHeight: body ? body.offsetHeight : 0,
      titleByXPath: !!titleByXPath,
    };
  });
  
  console.log('📄 DOM Structure:');
  console.log('Article exists:', result.articleExists);
  console.log('Article HTML preview:', result.articleHTML);
  console.log('');
  console.log('Article children:');
  result.articleChildren.forEach((child, i) => {
    console.log(`  [${i}] <${child.tag} class="${child.className}"> height=${child.height}px`);
  });
  console.log('');
  console.log('Element selectors:');
  console.log('  .article__title:', result.titleSelector, 'height=', result.titleHeight);
  console.log('  .article__lide:', result.lideSelector, 'height=', result.lideHeight);
  console.log('  .article__body:', result.bodySelector, 'height=', result.bodyHeight);
  console.log('  h1.article__title (xpath):', result.titleByXPath);
  
  await browser.close();
})();
