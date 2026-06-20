# 📋 Categorias — Sistema de Cores

## Cores de Categorias (Portal Jacaré Tucuju)

| Categoria | Cor | Código | CSS Class |
|-----------|-----|--------|-----------|
| 🏛️ Política | <span style="background: #003366; color: white; padding: 2px 8px; border-radius: 4px;">■</span> | `#003366` | `.tag--politica` |
| 🚔 Polícia | <span style="background: #8b0000; color: white; padding: 2px 8px; border-radius: 4px;">■</span> | `#8b0000` | `.tag--policia` |
| 🎨 Cultura | <span style="background: #6a1b9a; color: white; padding: 2px 8px; border-radius: 4px;">■</span> | `#6a1b9a` | `.tag--cultura` |
| ⚽ Esportes | <span style="background: #1b5e20; color: white; padding: 2px 8px; border-radius: 4px;">■</span> | `#1b5e20` | `.tag--esportes` |
| 💼 Economia | <span style="background: #00695c; color: white; padding: 2px 8px; border-radius: 4px;">■</span> | `#00695c` | `.tag--economia` |
| 🏙️ Municípios | <span style="background: #e65100; color: white; padding: 2px 8px; border-radius: 4px;">■</span> | `#e65100` | `.tag--municipios` |

## Uso no HTML

```html
<!-- Exemplo em noticias-lista.html -->
<span class="tag tag--politica">Política</span>
<span class="tag tag--esportes">Esportes</span>
```

## CSS Variables

```css
:root {
  --cat-politica:    #003366;
  --cat-policia:     #8b0000;
  --cat-cultura:     #6a1b9a;
  --cat-esportes:    #1b5e20;
  --cat-economia:    #00695c;
  --cat-municipios:  #e65100;
}
```

## JavaScript Helper

```javascript
function getCategoriaClass(categoria) {
  const map = {
    'política': 'politica',
    'polícia': 'policia',
    'cultura': 'cultura',
    'esportes': 'esportes',
    'economia': 'economia',
    'municípios': 'municipios'
  };
  return map[categoria?.toLowerCase()] || 'brand';
}

// Uso:
`<span class="tag tag--${getCategoriaClass(n.categoria)}">${n.categoria}</span>`
```

## Páginas Atualizadas

✅ **noticias-lista.html** — Categorias agora com cores do Portal
⏳ **Pendente:** usuarios.html, acessos.html, comentarios.html (se houver categorias)

---

Agora todas as categorias usam o mesmo **sistema de cores do Portal Jacaré Tucuju** em todo o Painel DM! 🎨
