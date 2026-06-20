/**
 * Session Manager — Logout automático por inatividade
 *
 * Comportamento:
 * - Monitora atividade do usuário (mouse, clicks, teclado)
 * - Após 30 min inativo: aviso
 * - Após 35 min inativo: logout automático
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutos (aviso 5 min antes)
let inactivityTimer = null;
let warningTimer = null;
let lastActivity = Date.now();

/**
 * Registrar atividade do usuário
 */
function recordActivity() {
  lastActivity = Date.now();

  // Se houver modal de aviso, fechar
  const modal = document.getElementById('session-warning-modal');
  if (modal) {
    modal.style.display = 'none';
  }

  // Reset timers
  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);
  startInactivityTimers();
}

/**
 * Iniciar timers de inatividade
 */
function startInactivityTimers() {
  // Mostrar aviso em 25 minutos
  warningTimer = setTimeout(() => {
    showWarningModal();
  }, WARNING_TIMEOUT);

  // Logout em 30 minutos
  inactivityTimer = setTimeout(() => {
    performLogout();
  }, SESSION_TIMEOUT);
}

/**
 * Mostrar modal de aviso
 */
function showWarningModal() {
  const html = `
    <div id="session-warning-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        border-radius: 8px;
        padding: 32px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        text-align: center;
        font-family: var(--font-base, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      ">
        <h2 style="margin: 0 0 16px; color: #333; font-size: 1.25rem;">
          ⏱️ Sessão expirando
        </h2>
        <p style="margin: 0 0 24px; color: #666; font-size: 0.95rem; line-height: 1.5;">
          Você ficou inativo por 25 minutos.<br/>
          Sua sessão será encerrada em <strong>5 minutos</strong>.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="session-extend-btn" style="
            padding: 8px 16px;
            background: #1f2937;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
          ">
            Continuar navegando
          </button>
          <button id="session-logout-btn" style="
            padding: 8px 16px;
            background: #e5e7eb;
            color: #333;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
          ">
            Sair agora
          </button>
        </div>
      </div>
    </div>
  `;

  // Remover modal anterior se existir
  const existing = document.getElementById('session-warning-modal');
  if (existing) existing.remove();

  // Inserir novo modal
  document.body.insertAdjacentHTML('beforeend', html);

  // Listeners
  document.getElementById('session-extend-btn').addEventListener('click', () => {
    recordActivity();
    console.log('[Session] Sessão estendida pelo usuário');
  });

  document.getElementById('session-logout-btn').addEventListener('click', () => {
    performLogout();
  });
}

/**
 * Realizar logout
 */
async function performLogout() {
  console.log('[Session] Logout automático por inatividade');

  try {
    // Remover token
    localStorage.removeItem('painel-dm:token');
    localStorage.removeItem('painel-dm:user');

    // Notificar API (opcional)
    const token = localStorage.getItem('painel-dm:token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[Session] Erro no logout:', err);
  }

  // Redirecionar para login com motivo
  sessionStorage.setItem('logout_reason', 'inatividade');
  window.location.href = '/painel/login/';
}

/**
 * Inicializar Session Manager
 */
export function initSessionManager() {
  // Apenas no painel (não no login)
  if (window.location.pathname === '/painel/login/') {
    return;
  }

  // Eventos que indicam atividade
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  activityEvents.forEach(event => {
    document.addEventListener(event, recordActivity, true);
  });

  // Iniciar timers
  startInactivityTimers();

  console.log('[Session] Gerenciador de sessão ativado (30 min inativo)');
}

// Auto-inicializar se não estiver em modo de teste
if (typeof window !== 'undefined' && !window.__TESTING__) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionManager);
  } else {
    initSessionManager();
  }
}
