<?php
/** api/plugins.php */
/** @var Router $router */

function plugin_serialize(array $r): array {
  return [
    'id'           => $r['id'],
    'nome'         => $r['nome'],
    'descricao'    => $r['descricao']    ?? '',
    'categoria'    => $r['categoria']    ?? '',
    'tipo'         => $r['tipo'],
    'instalado'    => (bool) $r['instalado'],
    'versao'       => $r['versao'],
    'ultimaVersao' => $r['ultima_versao'],
    'icone'        => $r['icone']        ?? '',
    'cor'          => $r['cor']          ?? '',
  ];
}

$router->get('/api/plugins', function (): void {
  Auth::required();
  $q         = trim((string) Request::query('q', ''));
  $categoria = trim((string) Request::query('categoria', ''));
  $tipo      = trim((string) Request::query('tipo', ''));
  $status    = trim((string) Request::query('status', ''));

  $where = []; $params = [];
  if ($q !== '')         { $where[] = '(nome LIKE ? OR descricao LIKE ?)'; $params[] = "%$q%"; $params[] = "%$q%"; }
  if ($categoria !== '') { $where[] = 'categoria = ?'; $params[] = $categoria; }
  if ($tipo !== '')      { $where[] = 'tipo = ?';      $params[] = $tipo; }
  if ($status === 'instalado')   $where[] = 'instalado = 1';
  if ($status === 'disponivel')  $where[] = 'instalado = 0';
  if ($status === 'atualizavel') $where[] = 'instalado = 1 AND versao <> ultima_versao';

  $sql = 'SELECT * FROM plugins' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY nome';
  Response::ok(array_map('plugin_serialize', DB::fetchAll($sql, $params)));
});

$router->get('/api/plugins/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM plugins WHERE id = ?', [$p['id']]);
  if (!$row) Response::notFound('Plugin não encontrado');
  Response::ok(plugin_serialize($row));
});

$router->patch('/api/plugins/:id/instalar', function (array $p): void {
  Auth::requirePermissao('plugins');
  $row = DB::fetch('SELECT * FROM plugins WHERE id = ?', [$p['id']]);
  if (!$row) Response::notFound('Plugin não encontrado');
  DB::execute(
    'UPDATE plugins SET instalado = 1, versao = ultima_versao, instalado_em = NOW() WHERE id = ?',
    [$p['id']]
  );
  Response::ok(['id' => $p['id'], 'instalado' => true, 'versao' => $row['ultima_versao']]);
});

$router->patch('/api/plugins/:id/desinstalar', function (array $p): void {
  Auth::requirePermissao('plugins');
  $changed = DB::execute('UPDATE plugins SET instalado = 0, instalado_em = NULL WHERE id = ?', [$p['id']]);
  if (!$changed) Response::notFound('Plugin não encontrado');
  Response::ok(['id' => $p['id'], 'instalado' => false]);
});

$router->patch('/api/plugins/:id/atualizar', function (array $p): void {
  Auth::requirePermissao('plugins');
  $row = DB::fetch('SELECT * FROM plugins WHERE id = ? AND instalado = 1', [$p['id']]);
  if (!$row) Response::notFound('Plugin não encontrado ou não instalado');
  DB::execute(
    'UPDATE plugins SET versao = ultima_versao, atualizado_em = NOW() WHERE id = ?',
    [$p['id']]
  );
  Response::ok(['id' => $p['id'], 'versao' => $row['ultima_versao']]);
});
