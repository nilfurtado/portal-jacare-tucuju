/**
 * ADS LOADER
 * Lê data/anuncios.json e atualiza os ad slots do portal:
 *   1. Define data-ad-active="true|false" no elemento
 *   2. Se ativo + tem criativo: substitui placeholder pelo <a><img>...</a>
 *   3. Se ativo + sem criativo: mantém placeholder (Espaço Publicitário)
 *   4. Honra período (inicio/fim)
 *   5. Registra impressão e clique via window.adsTrack (placeholder p/ analytics)
 *
 * Os slots no HTML devem ter os atributos:
 *   data-ad-name, data-ad-size, data-ad-type, data-ad-active
 *
 * O matching é feito por data-ad-type (mais estável que nome).
 */
(async function () {
  // Base da API do painel (mesma meta-tag usada pelo data.js)
  function apiBase() {
    const meta = document.querySelector('meta[name="painel-api"]');
    if (meta?.content) return meta.content.replace(/\/+$/, '');
    return '/painel-php/api';
  }

  let anuncios = [];
  // 1) tenta a API (anúncios ativados no painel, do banco)
  try {
    const res = await fetch(`${apiBase()}/anuncios/public`, { cache: 'no-cache' });
    if (res.ok) anuncios = await res.json();
  } catch { /* cai pro fallback */ }

  // 2) fallback ao JSON estático
  if (!anuncios.length) {
    try {
      const res = await fetch('data/anuncios.json', { cache: 'no-cache' });
      anuncios = await res.json();
    } catch (err) {
      console.warn('[ads-loader] Sem fonte de anúncios', err);
      return;
    }
  }

  const agora = Date.now();
  const noPeriodo = (p) => {
    if (!p) return true;
    const ini = p.inicio ? new Date(p.inicio).getTime() : -Infinity;
    const fim = p.fim    ? new Date(p.fim).getTime()    : Infinity;
    return agora >= ini && agora <= fim;
  };

  const slots = document.querySelectorAll('[data-ad-type]');
  slots.forEach(el => {
    const tipo = el.dataset.adType;
    const ad = anuncios.find(a => a.tipo === tipo);
    if (!ad) {
      el.setAttribute('data-ad-active', 'false');
      return;
    }
    const ativo = ad.ativo && noPeriodo(ad.periodo);
    el.setAttribute('data-ad-active', String(ativo));

    if (!ativo) return;

    const criativo = ad.criativo || {};
    if (criativo.imagem) {
      injectarImagem(el, ad);
    } else if (criativo.html) {
      injectarHtml(el, ad);
    }
    // Senão mantém placeholder de "Espaço Publicitário".

    // Registra impressão (opt-in para analytics futuro)
    if (typeof window.adsTrack === 'function') {
      window.adsTrack('impression', ad);
    }
  });

  function injectarImagem(el, ad) {
    // Encontra o container interno (.banner-ad ou .ad-popup__box)
    const inner = el.querySelector('.banner-ad, .ad-popup__box, .ad-popup__content');
    if (!inner) return;

    const alvo  = inner.classList.contains('ad-popup__box')
      ? inner.querySelector('.ad-popup__content') || inner
      : inner;

    // Limpa placeholder
    alvo.innerHTML = '';

    const link = document.createElement('a');
    link.href = ad.destino || '#';
    link.target = '_blank';
    link.rel = 'noopener sponsored';
    link.style.cssText = 'display:block;width:100%;height:100%;line-height:0;';
    link.setAttribute('data-ad-click', String(ad.id));

    const img = document.createElement('img');
    img.src = ad.criativo.imagem;
    img.alt = ad.criativo.titulo || ad.nome;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

    link.appendChild(img);
    alvo.appendChild(link);

    link.addEventListener('click', () => {
      if (typeof window.adsTrack === 'function') {
        window.adsTrack('click', ad);
      }
    });
  }

  function injectarHtml(el, ad) {
    const inner = el.querySelector('.banner-ad, .ad-popup__box');
    if (!inner) return;
    inner.innerHTML = ad.criativo.html;
  }
})();
