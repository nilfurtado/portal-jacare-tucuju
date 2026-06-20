/**
 * Proteção de Rota - Verifica se usuário está autenticado
 */

(function() {
  const path = window.location.pathname;

  // Se está em login, permitir
  if (path.includes('/painel/login')) {
    return;
  }

  // Verificar token
  let token = localStorage.getItem('painel-dm:token');

  // Se não tem token, mas está em /painel/ - pode ser primeira carga após redirect
  // Aguardar um pouco para ver se o token foi salvo
  if (!token && path.includes('/painel/')) {
    console.log('⏳ Aguardando token...');
    setTimeout(() => {
      token = localStorage.getItem('painel-dm:token');
      if (!token) {
        console.log('❌ Sem token após espera - redirecionando para login');
        window.location.replace('/painel/login/');
      } else {
        console.log('✅ Token encontrado!');
      }
    }, 500);
    return;
  }

  // Sem token e não está em login - redireciona
  if (!token && !path.includes('/painel/login')) {
    console.log('❌ Sem token - redirecionando para login');
    window.location.replace('/painel/login/');
  }
})();
