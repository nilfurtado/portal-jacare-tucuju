import { esc } from './render.js';
import { votarEnquete } from './data.js';

const STORAGE_PREFIX = 'portal_amapa_voted_';

export function initEnqueteGrande(enquete) {
  const container = document.getElementById('enquete-grande');
  if (!container || !enquete) return;

  const total = enquete.opcoes.reduce((sum, o) => sum + o.votos, 0);
  const ja = localStorage.getItem(STORAGE_PREFIX + enquete.id);

  container.innerHTML = `
    <div class="enquete-grande ${ja ? 'show-results' : ''}">
      <span class="enquete-grande__label">Enquete em destaque</span>
      <h2 class="enquete-grande__pergunta">${esc(enquete.pergunta)}</h2>
      <div class="enquete-grande__opcoes" role="radiogroup" aria-label="Opções de voto">
        ${enquete.opcoes.map(o => {
          const perc = total > 0 ? Math.round((o.votos / total) * 100) : 0;
          return `
            <button class="enquete-opcao" data-opcao="${esc(o.id)}" role="radio" aria-checked="false">
              <span class="enquete-opcao__bar" data-perc="${perc}"></span>
              <span class="enquete-opcao__label">${esc(o.label)}</span>
              <span class="enquete-opcao__perc">${perc}%</span>
            </button>
          `;
        }).join('')}
      </div>
      <p class="enquete-grande__footer">
        <span data-total>${total.toLocaleString('pt-BR')}</span> votos · seu voto fica salvo neste navegador
      </p>
    </div>
  `;

  const wrap = container.querySelector('.enquete-grande');
  const bars = container.querySelectorAll('.enquete-opcao__bar');
  const buttons = container.querySelectorAll('.enquete-opcao');

  function showResults(animated = true) {
    wrap.classList.add('show-results');
    bars.forEach(bar => {
      const perc = bar.dataset.perc;
      requestAnimationFrame(() => {
        bar.style.width = perc + '%';
      });
    });
  }

  if (ja) {
    showResults(false);
    const voted = container.querySelector(`[data-opcao="${ja}"]`);
    if (voted) voted.classList.add('is-voted');
  }

  function aplicarPlacar(opcoes) {
    const novoTotal = opcoes.reduce((sum, o) => sum + (o.votos || 0), 0);
    opcoes.forEach(o => {
      const novaPerc = novoTotal > 0 ? Math.round((o.votos / novoTotal) * 100) : 0;
      const bar = container.querySelector(`[data-opcao="${o.id}"] .enquete-opcao__bar`);
      const percEl = container.querySelector(`[data-opcao="${o.id}"] .enquete-opcao__perc`);
      if (bar) { bar.dataset.perc = novaPerc; bar.style.width = novaPerc + '%'; }
      if (percEl) percEl.textContent = novaPerc + '%';
    });
    const totalEl = container.querySelector('[data-total]');
    if (totalEl) totalEl.textContent = novoTotal.toLocaleString('pt-BR');
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (localStorage.getItem(STORAGE_PREFIX + enquete.id)) return;
      const opcaoId = btn.dataset.opcao;
      const opcao = enquete.opcoes.find(o => o.id === opcaoId);
      if (!opcao) return;

      // UX otimista: atualiza imediatamente na tela
      opcao.votos = (opcao.votos || 0) + 1;
      aplicarPlacar(enquete.opcoes);
      btn.classList.add('is-voted');
      btn.setAttribute('aria-checked', 'true');
      localStorage.setItem(STORAGE_PREFIX + enquete.id, opcaoId);
      showResults(true);

      // Sincroniza com o servidor em background. Se falhar (backend offline),
      // o voto local fica registrado e o usuário não vê erro.
      try {
        const r = await votarEnquete(enquete.id, opcaoId);
        if (r?.opcoes) {
          // Substitui pelo placar autoritativo do servidor
          enquete.opcoes = r.opcoes;
          aplicarPlacar(enquete.opcoes);
        }
      } catch { /* silencioso — UX otimista já atualizou */ }
    });
  });
}

export function initEnqueteSidebar(enquete) {
  const container = document.getElementById('enquete-sidebar');
  if (!container || !enquete) return;

  const ja = localStorage.getItem(STORAGE_PREFIX + enquete.id);
  if (ja) {
    const total = enquete.opcoes.reduce((sum, o) => sum + o.votos, 0);
    container.innerHTML = `
      <p class="enquete-sidebar__pergunta">${esc(enquete.pergunta)}</p>
      <div class="enquete-sidebar__opcoes">
        ${enquete.opcoes.map(o => {
          const perc = total > 0 ? Math.round((o.votos / total) * 100) : 0;
          return `
            <div style="display:flex;justify-content:space-between;font-size:0.875rem;padding:0.5rem 0;">
              <span>${esc(o.label)}</span>
              <strong>${perc}%</strong>
            </div>
          `;
        }).join('')}
      </div>
      <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.5rem;">Você já votou. Veja a versão completa abaixo.</p>
    `;
    return;
  }

  container.innerHTML = `
    <p class="enquete-sidebar__pergunta">${esc(enquete.pergunta)}</p>
    <div class="enquete-sidebar__opcoes">
      ${enquete.opcoes.map(o => `
        <label class="enquete-sidebar__opcao">
          <input type="radio" name="enquete-sb" value="${esc(o.id)}">
          <span>${esc(o.label)}</span>
        </label>
      `).join('')}
    </div>
    <button type="button" class="btn btn--primary enquete-sidebar__cta">Votar</button>
  `;

  container.querySelector('.enquete-sidebar__cta').addEventListener('click', () => {
    const checked = container.querySelector('input[name="enquete-sb"]:checked');
    if (!checked) {
      alert('Escolha uma opção antes de votar.');
      return;
    }
    localStorage.setItem(STORAGE_PREFIX + enquete.id, checked.value);
    document.getElementById('enquete-destaque')?.scrollIntoView({ behavior: 'smooth' });
    initEnqueteGrande(enquete);
    initEnqueteSidebar(enquete);
  });
}
