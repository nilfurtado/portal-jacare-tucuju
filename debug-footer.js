const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

  const footerInfo = await page.evaluate(() => {
    const footer = document.querySelector('footer');

    const footerElement = {
      scrollWidth: footer.scrollWidth,
      clientWidth: footer.clientWidth,
      offsetWidth: footer.offsetWidth,
      innerWidth: window.innerWidth,
      overflow: footer.scrollWidth > window.innerWidth,
      padding: window.getComputedStyle(footer).paddingLeft + ' / ' + window.getComputedStyle(footer).paddingRight
    };

    // Verificar children
    const children = [];
    Array.from(footer.children).forEach(child => {
      children.push({
        tag: child.tagName,
        class: child.className,
        width: child.scrollWidth,
        display: window.getComputedStyle(child).display
      });
    });

    return { footer: footerElement, children };
  });

  console.log('\n🔚 ANÁLISE DO FOOTER (375x812)\n');
  console.log('Footer:');
  console.log(`  scrollWidth: ${footerInfo.footer.scrollWidth}px`);
  console.log(`  clientWidth: ${footerInfo.footer.clientWidth}px`);
  console.log(`  innerWidth: ${footerInfo.footer.innerWidth}px`);
  console.log(`  OVERFLOW: ${footerInfo.footer.overflow ? '❌ SIM' : '✅ NÃO'}`);
  console.log(`  padding: ${footerInfo.footer.padding}`);

  console.log('\nChildren:');
  footerInfo.children.forEach((child, i) => {
    console.log(`  ${i + 1}. <${child.tag}.${child.class || '(sem classe)'}>`);
    console.log(`     └─ width: ${child.width}px | display: ${child.display}`);
  });

  await browser.close();
  process.exit(0);
})();
