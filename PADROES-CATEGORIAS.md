# Padrão de Categorias - Sistema de Notícias

## ⚠️ REGRA CRÍTICA: Slugs SEMPRE SEM ACENTOS

O sistema **NÃO ACEITA ACENTOS** em slugs de categorias. Isso é uma limitação do mapeamento CSS.

### Padrão Correto:

```json
{
  "nome": "Política",        ← COM acentos (exibição)
  "slug": "politica",         ← SEM acentos (sistema)
  "cor": "#1A237E"
}
```

### Categorias Válidas:

| Nome | Slug | Cor |
|------|------|-----|
| Política | politica | #1A237E |
| Polícia | policia | #B71C1C |
| Economia | economia | #2E7D32 |
| Educação | educacao | #1565C0 |
| Esporte | esportes | #00875A |
| Cultura | cultura | #7B1FA2 |
| Segurança | seguranca | #EF6C00 |
| Saúde | saude | #00897B |
| Tecnologia | tecnologia | #0277BD |
| Meio Ambiente | meio-ambiente | #388E3C |
| Opinião | opiniao | #455A64 |
| Geral | geral | #607D8B |

## Por que sem acentos?

1. **Classes CSS geradas**: `card__cat--politica`
2. **Variáveis CSS**: `--cat-politica`
3. Sem acentos = match perfeito, cores funcionam

Com acentos causa mismatch e cores não aparecem.

## Checklist ao Adicionar Nova Categoria:

- [ ] Nome com acentos: "Educação" (para exibição no site)
- [ ] Slug sem acentos: "educacao" (para sistema)
- [ ] Cor definida: "#1565C0"
- [ ] Adicionar em categorias.json (painel)
- [ ] Adicionar em noticias.json (notícias desta categoria)
- [ ] Testar cores no portal

## Arquivos Afetados:

- `/data/categorias.json` - Master de categorias
- `/data/noticias.json` - Notícias com categorias
- `/css/tokens.css` - Variáveis CSS
- `/css/bundle.css` - Estilos compilados
- `/index.html` - Injeção de cores via JS

⚠️ **IMPORTANTE:** Manter consistência entre `slug` em categorias.json e `categoria` em noticias.json
