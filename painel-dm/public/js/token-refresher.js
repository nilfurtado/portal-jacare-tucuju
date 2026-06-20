/**
 * Token Refresher — Auto-renovar token antes de expirar
 *
 * Comportamento:
 * - Verifica validade do token a cada 5 minutos
 * - Se faltar <30min para expirar: faz refresh automático
 * - Atualiza localStorage com novo token
 * - Totalmente transparente para o usuário
 */

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 min antes de expirar

/**
 * Decodificar JWT (sem validar assinatura - apenas ler payload)
 */
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Verificar se token está próximo de expirar
 */
function shouldRefresh(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;

  const expiresAt = payload.exp * 1000; // converter para ms
  const agora = Date.now();
  const tempoRestante = expiresAt - agora;

  return tempoRestante > 0 && tempoRestante < REFRESH_THRESHOLD;
}

/**
 * Fazer refresh do token
 */
async function refreshToken() {
  const token = localStorage.getItem('painel-dm:token');
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Token inválido, fazer logout
        localStorage.removeItem('painel-dm:token');
        localStorage.removeItem('painel-dm:user');
        sessionStorage.setItem('logout_reason', 'token_expirou');
        window.location.href = '/painel/login/';
      }
      return false;
    }

    const { token: novoToken } = await res.json();
    localStorage.setItem('painel-dm:token', novoToken);

    console.log('[Token] ✅ Token renovado automaticamente');
    return true;
  } catch (err) {
    console.error('[Token] ❌ Erro ao renovar token:', err);
    return false;
  }
}

/**
 * Loop de verificação periódica
 */
function startTokenRefreshLoop() {
  // Verificar imediatamente
  const token = localStorage.getItem('painel-dm:token');
  if (token && shouldRefresh(token)) {
    refreshToken();
  }

  // Depois a cada 5 minutos
  setInterval(() => {
    const token = localStorage.getItem('painel-dm:token');
    if (!token) return; // sem login

    if (shouldRefresh(token)) {
      refreshToken();
    }
  }, CHECK_INTERVAL);
}

/**
 * Inicializar Token Refresher
 */
export function initTokenRefresher() {
  // Apenas no painel (não no login)
  if (window.location.pathname === '/painel/login/') {
    return;
  }

  const token = localStorage.getItem('painel-dm:token');
  if (!token) {
    console.log('[Token] Nenhum token encontrado');
    return;
  }

  startTokenRefreshLoop();
  console.log('[Token] 🔄 Auto-refresh de token ativado (a cada 5 min)');
}

// Auto-inicializar se não estiver em modo de teste
if (typeof window !== 'undefined' && !window.__TESTING__) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTokenRefresher);
  } else {
    initTokenRefresher();
  }
}
