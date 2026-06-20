const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

  // Encontrar TODOS os elementos problemáticos (não apenas carrosséis)
  const overflowElements = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const problemElements = [];
    
    document.querySelectorAll('*').forEach(el => {
      // Ignorar carrosséis
      const className = String(el.className || '');
      if (className.includes('carousel') || className.includes('track') || className.includes('viewport')) {
        return;
      }

      if (el.scrollWidth > viewport + 2) { // +2px para margem de erro
        const computed = window.getComputedStyle(el);

        problemElements.push({
          tag: el.tagName,
          class: className.split(' ').slice(0, 2).join(' ') || '(no-class)',
          id: el.id || '(no-id)',
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          offsetWidth: el.offsetWidth,
          overflow: el.scrollWidth - viewport
        });
      }
    });
    
    return problemElements
      .filter(el => el.overflow > 10) // Apenas significativos
      .sort((a, b) => b.overflow - a.overflow)
      .slice(0, 15);
  });

  console.log('\n🚨 Elementos NÃO-CARROSSEL com OVERFLOW > 10px:\n');
  if (overflowElements.length === 0) {
    console.log('✅ Nenhum elemento crítico encontrado (overflow dos carrosséis é normal)');
  } else {
    overflowElements.forEach((el, i) => {
      console.log(`${i + 1}. <${el.tag}${el.id ? '#' + el.id : ''}${el.class ? '.' + el.class : ''}>`);
      console.log(`   Overflow: ${el.overflow}px | ScrollWidth: ${el.scrollWidth}px`);
    });
  }
  
  // Verificar se body tem width correto
  const bodyWidth = await page.evaluate(() => ({
    scrollWidth: document.body.scrollWidth,
    clientWidth: document.body.clientWidth,
    offsetWidth: document.body.offsetWidth
  }));
  
  console.log('\n📐 Body Dimensions:');
  console.log(`   ScrollWidth: ${bodyWidth.scrollWidth}px`);
  console.log(`   ClientWidth: ${bodyWidth.clientWidth}px`);
  console.log(`   OffsetWidth: ${bodyWidth.offsetWidth}px`);

  await browser.close();
  process.exit(0);
})();
