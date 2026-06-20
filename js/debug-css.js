// 🔍 Debug CSS dinâmico
(function() {
  console.log('=== DEBUG CSS DINÂMICO ===');

  // 1️⃣ Verificar data-category
  const bodyCategory = document.body.getAttribute('data-category');
  const htmlCategory = document.documentElement.getAttribute('data-category');
  console.log('✓ body[data-category]:', bodyCategory);
  console.log('✓ html[data-category]:', htmlCategory);

  // 2️⃣ Verificar variável CSS
  const styles = getComputedStyle(document.documentElement);
  const activeColor = styles.getPropertyValue('--cat-active-color');
  console.log('✓ --cat-active-color:', activeColor);

  // 3️⃣ Verificar header/footer
  const header = document.querySelector('header') || document.querySelector('[role="banner"]') || document.querySelector('div[data-include*="header"]');
  const footer = document.querySelector('footer') || document.querySelector('[role="contentinfo"]') || document.querySelector('div[data-include*="footer"]');

  if (header) {
    const headerStyles = getComputedStyle(header);
    console.log('✓ Header encontrado');
    console.log('✓ Header border-bottom:', headerStyles.borderBottom);
    console.log('✓ Header border-color:', headerStyles.borderBottomColor);
  } else {
    console.log('ℹ Header/topbar ainda não carregado (data-include em processamento)');
  }

  if (footer) {
    const footerStyles = getComputedStyle(footer);
    console.log('✓ Footer encontrado');
    console.log('✓ Footer border-top:', footerStyles.borderTop);
    console.log('✓ Footer border-color:', footerStyles.borderTopColor);
  } else {
    console.log('ℹ Footer ainda não carregado (data-include em processamento)');
  }

  // 4️⃣ Verificar links da navbar
  const navLinks = document.querySelectorAll('nav a, [class*="nav"] a');
  console.log('✓ Links na navbar:', navLinks.length);
  navLinks.forEach((link, i) => {
    if (i < 5) { // primeiros 5 links
      const linkStyles = getComputedStyle(link);
      console.log(`  Link ${i}: href=${link.href.split('/').pop()}, color=${linkStyles.color}, order=${linkStyles.order}`);
    }
  });

  // 5️⃣ Verificar se CSS bundle foi carregado
  const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
  let bundleLoaded = false;
  cssLinks.forEach(link => {
    if (link.href.includes('categorias-export')) {
      bundleLoaded = true;
      console.log('✓ CSS Bundle carregado:', link.href);
    }
  });
  if (!bundleLoaded) {
    console.warn('✗ CSS Bundle NÃO encontrado!');
  }

  // 6️⃣ Função para testar manualmente
  window.debugCSS = {
    setCategory: (slug) => {
      document.body.setAttribute('data-category', slug);
      document.documentElement.setAttribute('data-category', slug);
      console.log('🔧 Definido data-category =', slug);
    },
    checkCategory: () => ({
      body: document.body.getAttribute('data-category'),
      html: document.documentElement.getAttribute('data-category'),
      activeColor: getComputedStyle(document.documentElement).getPropertyValue('--cat-active-color')
    }),
    checkStyles: () => {
      const header = document.querySelector('header, [role="banner"]');
      const footer = document.querySelector('footer, [role="contentinfo"]');
      return {
        headerBorder: header ? getComputedStyle(header).borderBottom : 'sem header',
        footerBorder: footer ? getComputedStyle(footer).borderTop : 'sem footer'
      };
    }
  };

  console.log('🔧 Use: debugCSS.setCategory("política"), debugCSS.checkCategory(), debugCSS.checkStyles()');
})();
