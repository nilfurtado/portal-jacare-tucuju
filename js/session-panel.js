/**
 * Painel de Sessão - Interface visível para gerenciar sessões do usuário
 * Integra com window.portalSession
 */

class SessionPanel {
  constructor() {
    this.panel = null;
    this.toggleBtn = null;
    this.isOpen = false;
  }

  init() {
    console.log('[session-panel] Inicializando painel de sessões...');

    // Criar botão de toggle
    this.createToggleButton();

    // Criar painel
    this.createPanel();

    // Event listeners
    this.attachEventListeners();

    console.log('[session-panel] ✅ Painel de sessões ativado');
  }

  createToggleButton() {
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'session-toggle';
    this.toggleBtn.className = 'session-toggle';
    this.toggleBtn.setAttribute('aria-label', 'Menu de Sessão');
    this.toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
      </svg>
    `;

    // Inserir após o logo ou no header
    const header = document.querySelector('[data-include*="header"]') || document.querySelector('header');
    if (header) {
      header.parentElement.appendChild(this.toggleBtn);
    }
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'session-panel';
    this.panel.className = 'session-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-labelledby', 'session-panel-title');
    this.panel.innerHTML = this.getSessionHTML();

    document.body.appendChild(this.panel);
  }

  getSessionHTML() {
    const session = window.portalSession?.getSession();
    if (!session) return '<p>Sessão não inicializada</p>';

    const dataC = new Date(session.criadoEm).toLocaleString('pt-BR');
    const dataU = new Date(session.ultimaAtividadeEm).toLocaleString('pt-BR');
    const tema = session.preferencias?.tema === 'dark' ? '🌙 Escuro' : '☀️ Claro';
    const lidos = session.dados?.artigos_lidos?.length || 0;
    const favoritos = session.dados?.favoritos?.length || 0;

    return `
      <div class="session-panel__backdrop"></div>
      <div class="session-panel__content">
        <div class="session-panel__header">
          <h2 id="session-panel-title">Minha Sessão</h2>
          <button class="session-panel__close" aria-label="Fechar painel">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" fill="currentColor"/></svg>
          </button>
        </div>

        <div class="session-panel__body">
          <!-- Informações da Sessão -->
          <section class="session-section">
            <h3 class="session-section__title">📱 Informações</h3>
            <div class="session-info">
              <div class="session-info__row">
                <span class="session-info__label">ID da Sessão:</span>
                <code class="session-info__value">${session.id.substring(0, 20)}...</code>
                <button class="session-info__copy" data-copy="${session.id}" title="Copiar">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
                </button>
              </div>
              <div class="session-info__row">
                <span class="session-info__label">Criada em:</span>
                <span class="session-info__value">${dataC}</span>
              </div>
              <div class="session-info__row">
                <span class="session-info__label">Última atividade:</span>
                <span class="session-info__value">${dataU}</span>
              </div>
            </div>
          </section>

          <!-- Preferências -->
          <section class="session-section">
            <h3 class="session-section__title">⚙️ Preferências</h3>
            <div class="session-prefs">
              <div class="session-pref">
                <label for="pref-tema">Tema:</label>
                <button class="session-pref__toggle" id="pref-tema" data-pref="tema">
                  ${tema}
                </button>
              </div>
              <div class="session-pref">
                <label for="pref-notif">Notificações:</label>
                <input type="checkbox" id="pref-notif" class="session-pref__checkbox"
                  ${session.preferencias?.notificacoes ? 'checked' : ''}>
              </div>
            </div>
          </section>

          <!-- Estatísticas -->
          <section class="session-section">
            <h3 class="session-section__title">📊 Estatísticas</h3>
            <div class="session-stats">
              <div class="session-stat">
                <span class="session-stat__label">Artigos lidos:</span>
                <span class="session-stat__value">${lidos}</span>
              </div>
              <div class="session-stat">
                <span class="session-stat__label">Favoritos:</span>
                <span class="session-stat__value">${favoritos}</span>
              </div>
              <div class="session-stat">
                <span class="session-stat__label">Idioma:</span>
                <span class="session-stat__value">${session.preferencias?.idioma || 'pt-BR'}</span>
              </div>
            </div>
          </section>

          <!-- Ações -->
          <section class="session-section">
            <div class="session-actions">
              <button class="session-action session-action--primary" id="export-session">
                📥 Exportar Sessão
              </button>
              <button class="session-action session-action--secondary" id="clear-session">
                🗑️ Limpar Sessão
              </button>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Toggle painel
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Fechar painel
    const closeBtn = this.panel?.querySelector('.session-panel__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop
    const backdrop = this.panel?.querySelector('.session-panel__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }

    // Copiar ID
    const copyBtns = this.panel?.querySelectorAll('.session-info__copy');
    if (copyBtns) {
      copyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => this.copyToClipboard(e));
      });
    }

    // Toggle tema
    const themePref = this.panel?.querySelector('#pref-tema');
    if (themePref) {
      themePref.addEventListener('click', () => this.toggleTheme());
    }

    // Notificações
    const notifPref = this.panel?.querySelector('#pref-notif');
    if (notifPref) {
      notifPref.addEventListener('change', (e) => this.updateNotifications(e));
    }

    // Exportar sessão
    const exportBtn = this.panel?.querySelector('#export-session');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportSession());
    }

    // Limpar sessão
    const clearBtn = this.panel?.querySelector('#clear-session');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSession());
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.panel) {
      this.panel.classList.add('session-panel--open');
      this.isOpen = true;
      console.log('[session-panel] Painel aberto');
    }
  }

  close() {
    if (this.panel) {
      this.panel.classList.remove('session-panel--open');
      this.isOpen = false;
      console.log('[session-panel] Painel fechado');
    }
  }

  copyToClipboard(e) {
    const btn = e.currentTarget;
    const text = btn.getAttribute('data-copy');
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = '✅ Copiado!';
      setTimeout(() => {
        btn.innerHTML = original;
      }, 2000);
    });
  }

  toggleTheme() {
    const current = window.portalSession?.getPreferencia('tema') || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';

    window.portalSession?.setPreferencia('tema', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Atualizar botão
    const btn = this.panel?.querySelector('#pref-tema');
    if (btn) {
      btn.textContent = newTheme === 'dark' ? '🌙 Escuro' : '☀️ Claro';
    }

    console.log('[session-panel] Tema alterado para:', newTheme);
  }

  updateNotifications(e) {
    const enabled = e.target.checked;
    window.portalSession?.setPreferencia('notificacoes', enabled);
    console.log('[session-panel] Notificações:', enabled ? 'ativadas' : 'desativadas');
  }

  exportSession() {
    window.portalSession?.exportarDados();
    console.log('[session-panel] Sessão exportada');
  }

  clearSession() {
    if (confirm('⚠️ Tem certeza? Isso vai limpar toda a sua sessão e histórico.')) {
      window.portalSession?.clearSession();
      location.reload();
    }
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  window.sessionPanel = new SessionPanel();
  window.sessionPanel.init();
  console.log('[session-panel] 🎉 Sistema de sessão visível ativado!');
});
