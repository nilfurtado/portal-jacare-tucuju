#!/bin/bash

echo "=== CHECKLIST DE RESPONSIVIDADE DO PORTAL ==="
echo ""

# 1. Viewport meta tag
echo "✅ 1. Viewport Meta Tag:"
grep -q "viewport" index.html && echo "   ✓ Configurado corretamente" || echo "   ✗ FALTA!"

# 2. Media queries
echo ""
echo "✅ 2. Breakpoints CSS (Media Queries):"
echo "   - Mobile (<768px): $(grep -c '@media (max-width: 767px)' css/responsive.css) regras"
echo "   - Tablet (768-1023px): $(grep -c '@media (min-width: 768px) and (max-width: 1023px)' css/responsive.css) regras"
echo "   - Desktop (>1024px): padrão em bundle.css"

# 3. Verificar imagens com alt text
echo ""
echo "✅ 3. Imagens:"
echo "   - Total de <img> tags: $(grep -c '<img' js/main.js css/responsive.css partials/*.html 2>/dev/null || echo "?") "
echo "   - Picture elements: $(grep -c '<picture>' *.html partials/*.html 2>/dev/null || echo "0")"

# 4. Verificar container e grid
echo ""
echo "✅ 4. Layout System:"
echo "   - Classe .container: $(grep -c 'container' css/bundle.css)"
echo "   - Grid responsive: $(grep -c 'grid-template-columns' css/bundle.css)"
echo "   - Flexbox: $(grep -c 'display: flex' css/bundle.css)"

# 5. Verificar tipografia responsiva
echo ""
echo "✅ 5. Tipografia Responsiva:"
grep -A2 '@media' css/responsive.css | grep 'font-size' | head -3

# 6. Arquivo de teste
echo ""
echo "✅ 6. Arquivos CSS Responsivos:"
ls -lh css/*.css | awk '{print "   -", $9, "(" $5 ")"}'

