export function initUI() {
  initDataAtual();
  initStickyHeader();
  initBackToTop();
  // initHamburger removido: o drawer estruturado (components.js initDrawer)
  // já cobre o menu mobile via [data-drawer-open] no .header__hamburger.
}

function initDataAtual() {
  const el = document.querySelector('[data-today]');
  if (!el) return;

  function atualizar() {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const hora = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dataFormatada = data.toLowerCase().replace(/^./, c => c.toUpperCase());
    el.textContent = `${dataFormatada} — ${hora}`;
  }

  atualizar();
  setInterval(atualizar, 60_000);
}

function initStickyHeader() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const threshold = 240;
  let ticking = false;

  function update() {
    const sticky = window.scrollY > threshold;
    nav.classList.toggle('is-sticky', sticky);
    document.body.classList.toggle('has-sticky', sticky);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;
  let ticking = false;

  function update() {
    btn.classList.toggle('is-visible', window.scrollY > 400);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initHamburger() {
  const btn = document.querySelector('.header__hamburger');
  const nav = document.querySelector('.nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('nav-open')) return;
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    document.body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
  });
}
