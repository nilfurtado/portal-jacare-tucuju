# 🤝 Guia de Instalação do VLibras no Portal

## O que é VLibras?
VLibras é um tradutor automático de português para **Libras** (Língua Brasileira de Sinais), desenvolvido pelo governo brasileiro para acessibilidade.

## Método 1: Botão de Acesso (Atual) ✅
**Status:** Implementado no portal
**Arquivo:** `index.html` (linha 218-250)

O portal atualmente tem um botão azul no canto inferior direito que abre VLibras em uma nova aba.

```html
<button id="vlibras-btn" title="Abrir VLibras - Tradutor para Libras">
  <!-- SVG icon -->
</button>
```

**Vantagens:**
- ✅ Simples e confiável
- ✅ Não carrega scripts pesados
- ✅ Abre em nova aba (não interfere com o site)
- ✅ Sem erros de CORS

---

## Método 2: Widget Embarcado (Alternativa)

### Instalação via Script Oficial

Adicione no final do `</body>`:

```html
<script src="https://www.vlibras.gov.br/app/vlibras.js"></script>
<script>
  new VLibras.Widget('https://www.vlibras.gov.br/app', {
    position: 'bottom-right'
  });
</script>
```

**Problemas conhecidos:**
- ⚠️ Arquivo muito grande (>50MB)
- ⚠️ Pode causar timeout em conexões lentas
- ⚠️ Necessário CORS habilitado

---

## Método 3: iframe Direto

```html
<div style="position:fixed;bottom:24px;right:24px;width:80px;height:80px;z-index:999998;">
  <iframe 
    src="https://www.vlibras.gov.br/app" 
    title="VLibras" 
    style="width:100%;height:100%;border:none;border-radius:8px;"
  ></iframe>
</div>
```

**Vantagens:**
- Carrega sempre que o usuário abrir a página
- Interface completa integrada

**Desvantagens:**
- Consome mais recursos
- Pode ser lento em conexões pobres

---

## Documentação Oficial

- **Site:** https://www.vlibras.gov.br/
- **GitHub:** https://github.com/spbgovbr-vlibras/vlibras-portal
- **Suporte:** contato@vlibras.gov.br

---

## Recomendação para o Portal Jacaré Tucujú

✅ **Método 1 (Atual)** é o melhor porque:
1. Acessibilidade garantida (botão sempre visível)
2. Não sobrecarrega o site
3. Funciona mesmo com problemas de CDN
4. Melhor experiência do usuário

**Status Atual:** VLibras instalado como botão de acesso
**Data:** 2026-06-16
**Plugin Status:** Instalado e funcional no painel-dm
