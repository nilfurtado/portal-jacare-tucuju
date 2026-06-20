/**
 * Sistema de sessões permanentes do Portal
 * Mantém estado do usuário em localStorage + servidor
 */

class PortalSession {
  constructor() {
    this.sessionKey = 'portal-session';
    this.storageKey = 'portal-storage';
    this.init();
  }

  // Inicializar sessão
  init() {
    // Obter ou criar sessão
    let session = this.getSession();

    if (!session) {
      session = {
        id: this.generateId(),
        criadoEm: new Date().toISOString(),
        ultimaAtividadeEm: new Date().toISOString(),
        preferencias: {
          tema: localStorage.getItem('portal-tema') || 'light',
          idioma: 'pt-BR',
          notificacoes: true
        },
        dados: {
          artigos_lidos: [],
          favoritos: [],
          historico: [],
          perfil: null
        }
      };
      this.saveSession(session);
    }

    // Atualizar ultima atividade
    session.ultimaAtividadeEm = new Date().toISOString();
    this.saveSession(session);

    console.log('[session] ✅ Sessão iniciada:', session.id);
    return session;
  }

  // Obter sessão atual
  getSession() {
    try {
      const data = localStorage.getItem(this.sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[session] ❌ Erro ao obter sessão:', err);
      return null;
    }
  }

  // Salvar sessão
  saveSession(session) {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
      // Sincronização com servidor removida (Portal é frontend-only)
    } catch (err) {
      console.error('[session] ❌ Erro ao salvar sessão:', err);
    }
  }

  // Registrar artigo como lido
  marcarArticuloLido(articuloId) {
    const session = this.getSession();
    if (!session.dados.artigos_lidos.includes(articuloId)) {
      session.dados.artigos_lidos.push(articuloId);
      session.dados.historico.push({
        tipo: 'leitura',
        articuloId,
        data: new Date().toISOString()
      });
      this.saveSession(session);
      console.log('[session] 📖 Artigo marcado como lido:', articuloId);
    }
  }

  // Adicionar aos favoritos
  adicionarFavorito(articuloId) {
    const session = this.getSession();
    if (!session.dados.favoritos.includes(articuloId)) {
      session.dados.favoritos.push(articuloId);
      this.saveSession(session);
      console.log('[session] ⭐ Adicionado aos favoritos:', articuloId);
    }
  }

  // Remover dos favoritos
  removerFavorito(articuloId) {
    const session = this.getSession();
    session.dados.favoritos = session.dados.favoritos.filter(id => id !== articuloId);
    this.saveSession(session);
    console.log('[session] ❌ Removido dos favoritos:', articuloId);
  }

  // Definir preferência
  setPreferencia(chave, valor) {
    const session = this.getSession();
    session.preferencias[chave] = valor;
    this.saveSession(session);
    console.log('[session] ⚙️ Preferência salva:', chave, '=', valor);
  }

  // Obter preferência
  getPreferencia(chave) {
    const session = this.getSession();
    return session?.preferencias?.[chave];
  }

  // Gerar ID único
  generateId() {
    return 'session-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  }

  // Limpar sessão (logout)
  clearSession() {
    localStorage.removeItem(this.sessionKey);
    console.log('[session] 🗑️ Sessão limpa');
  }

  // Exportar dados da sessão
  exportarDados() {
    const session = this.getSession();
    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portal-sessao-${session.id}.json`;
    a.click();
  }
}

// Inicializar globalmente
window.portalSession = new PortalSession();
console.log('[session] 🚀 Sistema de sessões carregado');
