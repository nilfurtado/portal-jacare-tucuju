/**
 * Sistema Global de Autenticação do Painel DM
 * Use em qualquer página adicionando: <script src="/auth-client.js"></script>
 *
 * Fornece:
 * - getToken() - retorna o token JWT
 * - getUser() - retorna dados do usuário
 * - logout() - faz logout
 * - requireAuth() - redireciona para login se não autenticado
 */

const Auth = {
  getToken() {
    return localStorage.getItem('painel-dm:token');
  },

  getUser() {
    try {
      const userStr = localStorage.getItem('painel-dm:user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Erro ao parsear usuário:', e);
      return null;
    }
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user?.id;
  },

  logout() {
    localStorage.removeItem('painel-dm:token');
    localStorage.removeItem('painel-dm:user');
    window.location.replace('/painel/login/');
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.replace('/painel/login/');
    }
  },

  async apiCall(endpoint, options = {}) {
    const token = this.getToken();
    return fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  }
};

// Fazer requireAuth() disponível globalmente se a página exigir
if (document.currentScript?.dataset.requireAuth === 'true') {
  Auth.requireAuth();
}
