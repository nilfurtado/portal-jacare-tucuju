import { initPageShell } from './page-shell.js';
import { esc } from './render.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await initPageShell({ route: 'enquetes' });
    renderEnquetes(data.enquetes);
  } catch (err) {
    console.error('Erro:', err);
  }
});

function renderEnquetes(enquetes) {
  const el = document.getElementById('enquetes-lista');
  if (!el) return;
  if (!enquetes.length) {
    el.innerHTML = '<p style="text-align:center;padding:3rem 0;color:var(--color-text-muted);">Nenhuma enquete disponível no momento.</p>';
    return;
  }
  el.innerHTML = enquetes.map(renderEnqueteCard).join('');
  initVoting();
}

function renderEnqueteCard(enq) {
  const total = enq.opcoes.reduce((a, o) => a + o.votos, 0);
  const ativa = enq.ativa;
  return `
    <article class="enquete-card" data-enq-id="${esc(enq.id)}" data-total="${total}">
      <span class="enquete-card__status enquete-card__status--${ativa ? 'ativa' : 'encerrada'}">
        ${ativa ? '● Aberta para votação' : 'Encerrada'}
      </span>
      <h2 class="enquete-card__pergunta">${esc(enq.pergunta)}</h2>
      <div class="enquete-card__opcoes">
        ${enq.opcoes.map(opt => {
          const perc = total ? Math.round((opt.votos / total) * 100) : 0;
          return `
            <button class="enquete-card__opcao" type="button" data-opt-id="${esc(opt.id)}" ${ativa ? '' : 'disabled'}>
              <span class="bar" style="width:${perc}%;"></span>
              <span class="label">${esc(opt.label)}</span>
              <span class="perc">${perc}%</span>
            </button>
          `;
        }).join('')}
      </div>
      <div class="enquete-card__total">${total.toLocaleString('pt-BR')} votos no total</div>
    </article>
  `;
}

function initVoting() {
  document.querySelectorAll('.enquete-card').forEach(card => {
    const enqId = card.dataset.enqId;
    const voted = localStorage.getItem(`voted_${enqId}`);
    if (voted) card.classList.add('is-voted');

    card.querySelectorAll('.enquete-card__opcao:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (localStorage.getItem(`voted_${enqId}`)) return;
        const optId = btn.dataset.optId;
        localStorage.setItem(`voted_${enqId}`, optId);
        // simula incremento local
        const total = Number(card.dataset.total) + 1;
        card.dataset.total = total;
        card.querySelector('.enquete-card__total').textContent = `${total.toLocaleString('pt-BR')} votos no total`;
        btn.style.boxShadow = '0 0 0 2px var(--color-primary)';
        card.classList.add('is-voted');
        // mostra mensagem
        const status = card.querySelector('.enquete-card__status');
        status.textContent = '✓ Voto registrado · obrigado';
        status.style.background = 'rgba(27,94,32,0.15)';
        status.style.color = 'var(--cat-esportes)';
      });
    });
  });
}
