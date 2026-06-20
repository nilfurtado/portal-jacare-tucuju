/**
 * PLUGINS LOADER
 * Lê os plugins instalados no painel (GET /api/plugins/public) e ativa
 * cada um no portal. Cada plugin tem um "ativador" no registry ATIVADORES.
 *
 * Espelha o padrão de js/ads-loader.js: API pública com fallback silencioso.
 * Incluído em todas as páginas via <script defer src="js/plugins-loader.js">.
 */
(function () {
  'use strict';

  // ---------- Base da API (mesma meta usada pelo data.js) ----------
  function apiBase() {
    const meta = document.querySelector('meta[name="painel-api"]');
    if (meta?.content) {
      return meta.content.replace(/\/+$/, '');
    }
    if (location.hostname === 'localhost' && location.port === '8000') {
      return 'http://localhost:3000/api';
    }
    return '/api';
  }

  // ---------- Helpers de contexto ----------
  const isArtigo = () =>
    !!document.querySelector('#article-root, .article, [data-page="noticia"]');

  function conteudoNoticia() {
    return document.querySelector('.article__body, .article-body, [data-article-body]');
  }

  // ===================================================================
  // REGISTRY DE ATIVADORES — um por plugin instalável
  // ===================================================================
  const ATIVADORES = {

    // 1) Google Analytics — injeta gtag.js
    'google-analytics'(cfg) {
      const id = (cfg.measurementId || '').trim();
      if (!id || window.__ga_loaded) return;
      window.__ga_loaded = true;
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id);
    },

    // 2) Aviso LGPD — banner de cookies com dismiss em localStorage
    'aviso-lgpd'(cfg) {
      const KEY = 'jt:lgpd-ok';
      if (localStorage.getItem(KEY) || document.getElementById('jt-lgpd')) return;
      const texto = cfg.texto || 'Usamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa Política de Privacidade.';
      const botao = cfg.textoBotao || 'Entendi';
      const bar = document.createElement('div');
      bar.id = 'jt-lgpd';
      bar.setAttribute('role', 'dialog');
      bar.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;z-index:9000;background:#14110d;color:#fafaf7;' +
        'padding:14px 20px;display:flex;gap:16px;align-items:center;justify-content:center;' +
        'flex-wrap:wrap;font:14px/1.5 system-ui,sans-serif;box-shadow:0 -2px 12px rgba(0,0,0,.2)';
      bar.innerHTML =
        `<span style="max-width:760px">${texto}</span>` +
        `<button type="button" style="background:#c9551d;color:#fff;border:0;border-radius:999px;` +
        `padding:9px 22px;font-weight:600;cursor:pointer;white-space:nowrap">${botao}</button>`;
      bar.querySelector('button').addEventListener('click', () => {
        localStorage.setItem(KEY, '1');
        bar.remove();
      });
      document.body.appendChild(bar);
    },

    // 3) Proteção contra cópia — bloqueia no conteúdo do artigo
    'protecao-copia'() {
      const alvo = conteudoNoticia() || document.querySelector('#article-root, .article');
      if (!alvo) return;
      const bloquear = (e) => { e.preventDefault(); return false; };
      alvo.addEventListener('contextmenu', bloquear);
      alvo.addEventListener('copy', bloquear);
      alvo.addEventListener('cut', bloquear);
      alvo.addEventListener('selectstart', bloquear);
      alvo.style.userSelect = 'none';
      alvo.style.webkitUserSelect = 'none';
    },

    // 4) Vocaliza — botão "Ouvir notícia" com SpeechSynthesis
    'vocaliza'() {
      if (!isArtigo() || !('speechSynthesis' in window)) return;
      // Se já existe o audio-reader nativo, não duplica
      if (document.querySelector('.audio-reader') || document.getElementById('jt-vocaliza')) return;
      const corpo = conteudoNoticia();
      const titulo = document.querySelector('h1')?.textContent || '';
      if (!corpo) return;

      const btn = document.createElement('button');
      btn.id = 'jt-vocaliza';
      btn.type = 'button';
      btn.style.cssText =
        'display:inline-flex;align-items:center;gap:8px;margin:0 0 20px;background:#c9551d;' +
        'color:#fff;border:0;border-radius:999px;padding:10px 20px;font:600 14px system-ui;cursor:pointer';
      btn.innerHTML = '🔊 <span>Ouvir notícia</span>';

      let falando = false;
      btn.addEventListener('click', () => {
        if (falando) {
          speechSynthesis.cancel();
          falando = false;
          btn.querySelector('span').textContent = 'Ouvir notícia';
          return;
        }
        const texto = `${titulo}. ${corpo.textContent}`.slice(0, 6000);
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'pt-BR';
        u.rate = 1;
        u.onend = () => { falando = false; btn.querySelector('span').textContent = 'Ouvir notícia'; };
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        falando = true;
        btn.querySelector('span').textContent = 'Parar';
      });
      corpo.parentNode.insertBefore(btn, corpo);
    },

    // 5) PDF Incorporado — substitui shortcode [pdf:URL] e links .pdf por iframe
    'pdf-incorporado'() {
      const corpo = conteudoNoticia();
      if (!corpo) return;

      // Shortcode [pdf:https://...]
      corpo.innerHTML = corpo.innerHTML.replace(
        /\[pdf:\s*(https?:\/\/[^\]\s]+)\s*\]/gi,
        (_m, url) => embedHtml(url)
      );

      // Links diretos para .pdf
      corpo.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]').forEach(a => {
        const wrap = document.createElement('div');
        wrap.innerHTML = embedHtml(a.href);
        a.replaceWith(wrap.firstElementChild);
      });

      function embedHtml(url) {
        return `<div style="margin:20px 0"><iframe src="${url}" ` +
          `style="width:100%;height:600px;border:1px solid #ddd;border-radius:8px" ` +
          `loading="lazy" title="Documento PDF"></iframe>` +
          `<div style="font:12px system-ui;margin-top:6px"><a href="${url}" target="_blank" rel="noopener">Abrir PDF em nova aba ↗</a></div></div>`;
      }
    },

    // 6) Ads Texto — insere bloco HTML entre parágrafos do artigo
    'ads-texto'(cfg) {
      const html = (cfg.html || '').trim();
      if (!html) return;
      const corpo = conteudoNoticia();
      if (!corpo) return;
      const paras = corpo.querySelectorAll(':scope > p');
      if (paras.length < 3) return;
      if (corpo.querySelector('.jt-ads-texto')) return;
      const bloco = document.createElement('div');
      bloco.className = 'jt-ads-texto';
      bloco.style.cssText = 'margin:24px 0;padding:8px 0;text-align:center';
      bloco.innerHTML = html;
      // insere após o 2º parágrafo
      paras[1].insertAdjacentElement('afterend', bloco);
    },
  };

  // ===================================================================
  // BOOTSTRAP
  // ===================================================================
  function ativarTodos(instalados) {
    instalados.forEach(p => {
      const fn = ATIVADORES[p.id];
      if (typeof fn === 'function') {
        try { fn(p.config || {}); }
        catch (err) { console.warn(`[plugins-loader] falha ao ativar "${p.id}"`, err); }
      }
    });
  }

  async function init() {
    let instalados = [];
    try {
      const res = await fetch(`${apiBase()}/plugins/public`, { cache: 'no-cache' });
      if (res.ok) instalados = await res.json();
    } catch { /* portal funciona sem plugins — silencioso */ }
    if (!instalados.length) return;

    // 1ª passada (GA, LGPD funcionam já; os de artigo saem se não houver conteúdo ainda)
    ativarTodos(instalados);

    // O artigo é renderizado por JS de forma assíncrona. Observa o #article-root
    // e re-roda os ativadores quando o conteúdo aparece. Ativadores são idempotentes.
    const root = document.getElementById('article-root') ||
                 document.querySelector('.article, [data-page="noticia"]');
    if (root) {
      let feito = false;
      const obs = new MutationObserver(() => {
        if (feito) return;
        if (conteudoNoticia()) {
          feito = true;
          ativarTodos(instalados);
          obs.disconnect();
        }
      });
      obs.observe(root, { childList: true, subtree: true });
      // segurança: tenta de novo após 1.5s caso o observer não dispare
      setTimeout(() => { if (!feito && conteudoNoticia()) { feito = true; ativarTodos(instalados); obs.disconnect(); } }, 1500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
