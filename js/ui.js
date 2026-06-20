export function initUI() {
  initTopbarDateTime();
  initStickyHeader();
  initBackToTop();
  // initHamburger removido: o drawer estruturado (components.js initDrawer)
  // já cobre o menu mobile via [data-drawer-open] no .header__hamburger.
}

function initTopbarDateTime() {
  const el = document.getElementById('topbar-datetime');
  if (!el) return;

  function formatarDataHora() {
    const agora = new Date();

    // Formato data: "seg, 14 jun"
    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    const diaSemana = diasSemana[agora.getDay()];
    const dia = agora.getDate();
    const mes = meses[agora.getMonth()];

    // Formato hora: "14:43"
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');

    const dataFormatada = `${diaSemana}, ${dia} ${mes}`;
    const horaFormatada = `${hora}:${minuto}`;

    // SVG Icons
    const iconCalendar = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline;margin-right:4px;vertical-align:-2px;"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>`;
    const iconClock = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline;margin-right:4px;vertical-align:-2px;"><path d="M11.99 5C6.47 5 2 9.48 2 15s4.47 10 9.99 10C17.52 25 22 20.52 22 15S17.52 5 11.99 5zM15.5 15.5h-4v-4h4v4z"/></svg>`;

    return `${iconCalendar}${dataFormatada} ${iconClock}${horaFormatada}`;
  }

  // Preencher imediatamente sem placeholder
  el.innerHTML = formatarDataHora();

  // Atualizar a cada minuto
  setInterval(() => {
    el.innerHTML = formatarDataHora();
  }, 60_000);
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
