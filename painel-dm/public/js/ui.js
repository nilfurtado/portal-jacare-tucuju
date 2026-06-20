/**
 * UI helpers: toast, modal de confirmação, sidebar mobile, stagger reveal.
 */

let toastEl = null;
let toastTimer = null;

export function toast(message, type = 'info', duration = 3000) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.dataset.type = type;
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, duration);
}

export function confirmar({ titulo = 'Confirmar', mensagem = '', okText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const mensagemHtml = mensagem.replace(/\n/g, '<br>');
    const cancelBtn = cancelText ? `<button class="btn btn--ghost" data-cancel>${cancelText}</button>` : '';
    modal.innerHTML = `
      <div class="modal__backdrop"></div>
      <div class="modal__box">
        <h3 class="modal__title">${titulo}</h3>
        <div class="modal__msg" style="white-space: pre-wrap; word-break: break-word;">${mensagemHtml}</div>
        <div class="modal__actions">
          ${cancelBtn}
          <button class="btn btn--primary" data-ok>${okText}</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = (val) => { modal.remove(); resolve(val); };
    modal.querySelector('[data-ok]').onclick = () => close(true);
    const cancelBtnEl = modal.querySelector('[data-cancel]');
    if (cancelBtnEl) cancelBtnEl.onclick = () => close(false);
    modal.querySelector('.modal__backdrop').onclick = () => close(false);
  });
}

/** Aplica delay incremental em filhos para stagger reveal */
export function staggerChildren(parent, opts = {}) {
  const els = parent.querySelectorAll(':scope > *');
  els.forEach((el, i) => {
    el.style.setProperty('--i', i);
    el.classList.add(opts.x ? 'reveal-x' : 'reveal');
  });
}

/** Sidebar mobile toggle */
export function initSidebar() {
  const btn = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('is-open'));
}

/** Marca link ativo na sidebar por data-route */
export function setActiveRoute(route) {
  document.querySelectorAll('.sidebar__link[data-route]').forEach(a => {
    a.classList.toggle('is-active', a.dataset.route === route);
  });
}
