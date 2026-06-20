/**
 * Middleware de permissões.
 * Admin tem acesso total. Colaborador precisa ter o módulo em permissoes.paginas.
 *
 * Uso: router.use(requerePermissao('noticias'))
 */
function requerePermissao(modulo) {
  return (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ erro: 'Não autenticado' });
    if (u.tipo === 'admin') return next();
    // Colunista e autor podem postar noticias (como colunas)
    if (modulo === 'noticias' && (u.tipo === 'colunista' || u.tipo === 'autor')) return next();
    const paginas = u.permissoes?.paginas || [];
    if (paginas.includes(modulo)) return next();
    return res.status(403).json({ erro: 'Sem permissão para acessar este módulo' });
  };
}

module.exports = { requerePermissao };
