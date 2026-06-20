/**
 * Minificador — reduz tamanho de CSS e JS
 * Uso: node scripts/minify.js
 */

const fs = require('fs');
const path = require('path');

// Minificar CSS (remove espaços, comentários, etc)
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comentários /* */
    .replace(/\n\s+/g, '\n')           // Remove espaços desnecessários
    .replace(/\s+{/g, '{')             // Remove espaços antes de {
    .replace(/{\s+/g, '{')             // Remove espaços depois de {
    .replace(/;\s+/g, ';')             // Remove espaços após ;
    .replace(/:\s+/g, ':')             // Remove espaços após :
    .replace(/,\s+/g, ',')             // Remove espaços após ,
    .replace(/\s+}/g, '}')             // Remove espaços antes de }
    .replace(/\n+/g, '')               // Remove quebras de linha
    .trim();
}

// Minificar JS (simples - apenas remove comentários e espaços)
function minifyJS(js) {
  return js
    .replace(/\/\/.*$/gm, '')          // Remove comentários //
    .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove comentários /* */
    .replace(/\n\s+/g, '\n')           // Remove espaços desnecessários
    .replace(/\n+/g, '\n')             // Remove quebras de linha múltiplas
    .trim();
}

// Processar arquivos
function processFiles() {
  console.log('🔄 Minificando arquivos...\n');

  const cssDir = 'css';
  const jsDir = 'js';

  // CSS
  if (fs.existsSync(cssDir)) {
    fs.readdirSync(cssDir).forEach(file => {
      if (file.endsWith('.css')) {
        const filePath = path.join(cssDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const minified = minifyCSS(content);
        const minPath = filePath.replace('.css', '.min.css');
        
        fs.writeFileSync(minPath, minified);
        const origSize = content.length;
        const minSize = minified.length;
        const reduction = Math.round((1 - minSize / origSize) * 100);
        
        console.log(`✅ ${file}: ${origSize}B → ${minSize}B (${reduction}% menor)`);
      }
    });
  }

  console.log('\n✨ Minificação concluída!');
  console.log('💡 Dica: Use os arquivos .min.css/.min.js em produção');
}

processFiles();
