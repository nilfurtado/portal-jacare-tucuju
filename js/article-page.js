import { initPageShell } from './page-shell.js';
import { bySlug, getCategoria, getMunicipio, relacionadas, tempoRelativo, getCache, fetchNoticiaCompleta } from './data.js';
import { esc } from './render.js';
import { initAudioReader, audioReaderTemplate } from './audio-reader.js';
import { galleryTemplate, initGallery } from './article-gallery.js';

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('article-root');
  try {
    console.log('[article-page] starting...');

    try {
      console.log('[article-page] initializing page shell...');
      await initPageShell({ route: null });
      console.log('[article-page] page shell initialized ✅');
    } catch (shellErr) {
      console.error('[article-page] page shell failed:', shellErr);
      root.innerHTML = `<div style="color:red;padding:20px;"><strong>Shell Init Error:</strong> ${shellErr.message}</div>`;
      throw shellErr;
    }

    // Lê slug do pathname (URLs amigáveis) ou query string (fallback)
    const pathParts = location.pathname.split('/').filter(Boolean);
    let slug = null;
    if (pathParts[0] === 'noticias' && pathParts[1]) {
      slug = pathParts[1];
    } else {
      const params = new URLSearchParams(location.search);
      slug = params.get('slug');
    }

    console.log('[article-page] slug:', slug);

    // Tenta endpoint do painel (incrementa view), cai pro cache se offline
    let noticia = null;
    try {
      noticia = slug ? await fetchNoticiaCompleta(slug) : null;
      console.log('[article-page] fetched noticia:', { exists: !!noticia, slug, titulo: noticia?.titulo });
    } catch (fetchErr) {
      console.error('[article-page] fetch error:', fetchErr);
      root.innerHTML = `<div style="color:red;padding:20px;"><strong>Fetch Error:</strong> ${fetchErr.message}</div>`;
      throw fetchErr;
    }

    if (!noticia) {
      console.log('[article-page] noticia not found for slug:', slug);
      root.innerHTML = renderNotFound();
      document.title = 'Notícia não encontrada — Portal Jacaré Tucujú';
      return;
    }

    console.log('[article-page] rendering article:', noticia.titulo);
    document.title = `${noticia.titulo} — Portal Jacaré Tucujú`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', noticia.lide);

    // Meta tags Open Graph (SEO + social sharing)
    const capaUrl = noticia.capa?.social || noticia.capa?.principal || noticia.imagem;
    if (capaUrl) {
      // OG Image
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', new URL(capaUrl, location.origin).href);

      // OG Image Type
      let ogImageType = document.querySelector('meta[property="og:image:type"]');
      if (!ogImageType) {
        ogImageType = document.createElement('meta');
        ogImageType.setAttribute('property', 'og:image:type');
        document.head.appendChild(ogImageType);
      }
      ogImageType.setAttribute('content', capaUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg');

      // Twitter Card
      let twImage = document.querySelector('meta[name="twitter:image"]');
      if (!twImage) {
        twImage = document.createElement('meta');
        twImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(twImage);
      }
      twImage.setAttribute('content', new URL(capaUrl, location.origin).href);

      let twCard = document.querySelector('meta[name="twitter:card"]');
      if (!twCard) {
        twCard = document.createElement('meta');
        twCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twCard);
      }
      twCard.setAttribute('content', 'summary_large_image');
    }

    // marca a editoria ativa no nav + aplica cor da editoria na página inteira
    document.querySelectorAll(`[data-route="${noticia.categoria}"]`).forEach(a => a.classList.add('is-active'));
    document.body.setAttribute('data-editoria', noticia.categoria);

    root.innerHTML = renderArticle(noticia);
    initShareButtons(noticia);
    initCommentForm();

    // Audio reader
    const audioContainer = root.querySelector('.audio-reader');
    if (audioContainer) {
      initAudioReader({
        container: audioContainer,
        title: noticia.titulo,
        lide: noticia.lide,
        body: noticia.conteudo,
      });
    }

    // Galeria (se houver)
    if (noticia.galeria && noticia.galeria.length) {
      initGallery('[data-gallery]', noticia.galeria);
    }
  } catch (err) {
    console.error('Erro ao carregar notícia:', err);
    const root = document.getElementById('article-root');
    if (root) {
      root.innerHTML = `
        <div class="not-found">
          <h1>❌ Erro ao carregar notícia</h1>
          <p><strong>Erro:</strong> ${err.message}</p>
          <p><strong>Stack:</strong> <code>${err.stack}</code></p>
          <a href="index.html" class="btn btn--primary">Voltar ao início</a>
        </div>
      `;
    }
  }
});

/**
 * Renderiza a capa principal com picture element (WebP + JPEG) e lazy loading
 */
function renderCapaPrincipal(n) {
  if (!n.capa && !n.imagem) {
    return '<img src="img/placeholder.svg" alt="Sem imagem">';
  }

  // Nova estrutura de capa (5 dimensões)
  if (n.capa && typeof n.capa === 'object') {
    const principal = n.capa.principal || n.imagem;
    const principalWebp = n.capa.principalWebp || principal;
    const alt = esc(n.capa.metadados?.alt || n.titulo);

    return `
      <picture>
        <source srcset="${esc(principalWebp)}" type="image/webp">
        <source srcset="${esc(principal)}" type="image/jpeg">
        <img src="${esc(principal)}" alt="${alt}" loading="lazy">
      </picture>
    `;
  }

  // Fallback para imagem antiga
  return `<img src="${esc(n.imagem)}" alt="${esc(n.titulo)}" loading="lazy">`;
}

function renderNotFound() {
  return `
    <div class="not-found" style="padding: 40px; text-align: center;">
      <h1>❌ Notícia não encontrada</h1>
      <p>Desculpe, o artigo que você procura não existe ou foi removido.</p>
      <a href="/" style="display: inline-block; padding: 10px 20px; background: #f07e13; color: white; border-radius: 5px; text-decoration: none; margin-top: 20px;">
        Voltar à Homepage
      </a>
    </div>
  `;
}

function formatarDataHora(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderArticle(n) {
  const cat = getCategoria(n.categoria);
  const catLabel = cat ? cat.label : n.categoria;
  const mun = getMunicipio(n.municipio);
  const dataFmt = formatarDataHora(n.data);
  const rel = relacionadas(n, 4);

  return `
    <nav class="breadcrumb" aria-label="Trilha">
      <a href="index.html">Início</a>
      <span class="breadcrumb__sep">›</span>
      <a href="categoria.html?cat=${esc(n.categoria)}">${esc(catLabel)}</a>
      ${mun ? `<span class="breadcrumb__sep">›</span><a href="municipio.html?cidade=${esc(n.municipio)}">${esc(mun.label)}</a>` : ''}
    </nav>

    <span class="article__editoria article__editoria--${esc(n.categoria)}">${esc(catLabel)}</span>

    <h1 class="article__title">${esc(n.titulo)}</h1>
    <p class="article__lide">${esc(n.lide)}</p>

    <div class="article__meta">
      <span title="${n.data}">${esc(dataFmt)} (${tempoRelativo(n.data)})</span>
      <span class="meta-sep">|</span>
      <span>Por: <strong>${esc(n.autor)}</strong></span>
      <span class="meta-sep">|</span>
      <span>Fonte: <strong>${esc(n.fonte || 'Redação Jacaré Tucujú')}</strong></span>
      ${n.tempoLeitura ? `<span class="meta-sep">|</span><span class="reading-time">${n.tempoLeitura} min de leitura</span>` : ''}
    </div>

    ${audioReaderTemplate()}

    <figure class="article__figure">
      ${renderCapaPrincipal(n)}
      <figcaption class="article__caption">${esc(n.capa?.metadados?.alt || n.titulo)} — Foto: arquivo Portal Jacaré Tucujú.</figcaption>
    </figure>

    ${(n.galeria && n.galeria.length) ? galleryTemplate(n.galeria) : ''}

    <div class="share-counter">
      <div class="share-counter__top">
        <span class="share-counter__num">${(n.views || 0).toLocaleString('pt-BR')}</span>
        <span class="share-counter__label">visualizações</span>
        <span class="share-counter__sublabel">· Compartilhe esta notícia:</span>
      </div>
      <div class="share-counter__buttons">
        <button class="share-btn" data-share="whatsapp" aria-label="Compartilhar no WhatsApp">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></span>
          WhatsApp
        </button>
        <button class="share-btn" data-share="facebook" aria-label="Compartilhar no Facebook">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5v1.8H16l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>
          Facebook
        </button>
        <button class="share-btn" data-share="twitter" aria-label="Compartilhar no X">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M18.244 2H21l-6.59 7.53L22.5 22h-6.83l-5.36-7.03L4.13 22H1.37l7.06-8.07L1.5 2h7l4.85 6.42L18.244 2zm-2.4 18.18h1.88L7.27 3.69H5.27l10.575 16.49z"/></svg></span>
          X (Twitter)
        </button>
        <button class="share-btn" data-share="copy" aria-label="Copiar link">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4a5 5 0 0 0 0-10z"/></svg></span>
          Copiar link
        </button>
      </div>
    </div>

    <div class="article__body">
      ${insertWhatsappCta(n.conteudo)}
    </div>

    ${(() => {
      let tags = n.tags;
      if (typeof tags === 'string') {
        // Tentar JSON parse primeiro, se falhar, split por vírgula
        try {
          tags = JSON.parse(tags);
        } catch {
          tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(tags)) tags = [];
      return (tags && tags.length) ? `
        <div class="article__tags">
          <span class="article__tags-label">Tags:</span>
          ${tags.map(t => `<a href="#" class="article__tag">${esc(t)}</a>`).join('')}
        </div>
      ` : '';
    })()}

    ${renderShareBottom()}

    ${rel.length ? renderVejaTambem(rel) : ''}

    ${renderComments(n)}
  `;
}

function renderVejaTambem(rel) {
  return `
    <section class="veja-tambem">
      <span class="veja-tambem__label">Veja também</span>
      <div class="veja-tambem__list">
        ${rel.map(n => {
          const cat = getCategoria(n.categoria);
          const imgUrl = n.capa?.principal || n.imagem || '';
          return `
            <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="veja-item">
              <div class="veja-item__image">
                ${imgUrl ? `<img src="${esc(imgUrl)}" alt="${esc(n.titulo)}" loading="lazy">` : '<svg width="100%" height="100%" viewBox="0 0 200 150" style="background:#f0f0f0"><circle cx="100" cy="50" r="15" fill="#ccc"/><path d="M30 100 L80 50 L150 120 L170 100" fill="none" stroke="#ccc" stroke-width="3"/></svg>'}
              </div>
              <div class="veja-item__body">
                <span class="veja-item__editoria" style="color:var(--cat-${esc(n.categoria)});">${esc(cat?.label || n.categoria)}</span>
                <h3 class="veja-item__titulo">${esc(n.titulo)}</h3>
                <div class="veja-item__meta">
                  <span class="veja-item__author">${esc(n.autor)}</span>
                  <span class="veja-item__time">${tempoRelativo(n.data)}</span>
                </div>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderComments(n) {
  return `
    <section class="comments">
      <h3 class="comments__title">Comentários</h3>
      <p class="comments__empty">Nenhum comentário ainda. Seja o primeiro a comentar.</p>
      <form class="comment-form" id="comment-form" data-id="${esc(String(n.id))}">
        <div class="comment-form__row">
          <div>
            <label for="comment-name">Nome</label>
            <input type="text" id="comment-name" name="name" required maxlength="80" autocomplete="name">
          </div>
          <div>
            <label for="comment-city">Cidade</label>
            <input type="text" id="comment-city" name="city" maxlength="60" autocomplete="address-level2">
          </div>
        </div>
        <div>
          <label for="comment-email">E-mail</label>
          <input type="email" id="comment-email" name="email" required maxlength="120" autocomplete="email">
        </div>
        <div>
          <label for="comment-text">Comentário</label>
          <textarea id="comment-text" name="text" required maxlength="500" placeholder="Escreva seu comentário (máx. 500 caracteres)"></textarea>
        </div>
        <div class="comment-form__footer">
          <span class="comment-form__counter"><span id="char-count">0</span> / 500</span>
          <button type="submit" class="btn btn--primary">Enviar comentário</button>
        </div>
      </form>
    </section>
  `;
}

function initShareButtons(n) {
  const url = window.location.href;
  const titulo = n.titulo;
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.share;
      let share = '';
      if (type === 'whatsapp') share = `https://wa.me/?text=${encodeURIComponent(titulo + ' — ' + url)}`;
      else if (type === 'facebook') share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      else if (type === 'twitter') share = `https://twitter.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url)}`;
      else if (type === 'copy') {
        navigator.clipboard?.writeText(url).then(() => {
          btn.style.background = 'var(--cat-esportes)';
          btn.style.color = '#fff';
          setTimeout(() => { btn.style.background = ''; btn.style.color = ''; }, 1500);
        });
        return;
      }
      if (share) window.open(share, '_blank', 'noopener,width=620,height=540');
    });
  });
}

function initCommentForm() {
  const form = document.getElementById('comment-form');
  if (!form) return;
  const text = form.querySelector('#comment-text');
  const counter = form.querySelector('#char-count');
  text.addEventListener('input', () => {
    counter.textContent = text.value.length;
    counter.style.color = text.value.length > 450 ? 'var(--color-primary)' : '';
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setTimeout(() => {
      alert('Comentário enviado para moderação (demo).');
      form.reset();
      counter.textContent = '0';
      btn.disabled = false;
      btn.textContent = 'Enviar comentário';
    }, 600);
  });
}

function renderShareBottom() {
  return `
    <div class="share-bottom">
      <span class="share-bottom__label">Compartilhe esta notícia:</span>
      <div class="share-counter__buttons">
        <button class="share-btn" data-share="whatsapp" aria-label="Compartilhar no WhatsApp">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg></span>
          WhatsApp
        </button>
        <button class="share-btn" data-share="facebook" aria-label="Compartilhar no Facebook">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5v1.8H16l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></span>
          Facebook
        </button>
        <button class="share-btn" data-share="twitter" aria-label="Compartilhar no X">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M18.244 2H21l-6.59 7.53L22.5 22h-6.83l-5.36-7.03L4.13 22H1.37l7.06-8.07L1.5 2h7l4.85 6.42L18.244 2zm-2.4 18.18h1.88L7.27 3.69H5.27l10.575 16.49z"/></svg></span>
          X (Twitter)
        </button>
        <button class="share-btn" data-share="copy" aria-label="Copiar link">
          <span class="share-btn__icon"><svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4a5 5 0 0 0 0-10z"/></svg></span>
          Copiar link
        </button>
      </div>
    </div>
  `;
}

function insertWhatsappCta(conteudo) {
  if (!conteudo) return conteudo || '';
  let config = {};
  try {
    config = getCache().config || {};
  } catch (err) {
    console.warn('[insertWhatsappCta] cache not loaded:', err.message);
  }
  const link = config.whatsapp?.grupo || '#';
  const cta = `
    <a href="${link}" class="whatsapp-cta" target="_blank" rel="noopener">
      <div class="whatsapp-cta__icon">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </div>
      <div class="whatsapp-cta__text">
        <span class="whatsapp-cta__label">Clique e receba notícias do Portal Jacaré Tucujú em seu WhatsApp:</span>
        <span class="whatsapp-cta__link">Entrar no grupo →</span>
      </div>
    </a>
  `;
  const parts = conteudo.split('</p>');
  const mid = Math.max(2, Math.floor(parts.length / 2));
  parts.splice(mid, 0, cta);
  return parts.join('</p>');
}
