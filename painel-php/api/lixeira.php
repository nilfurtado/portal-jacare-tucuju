<?php
/** api/lixeira.php — soft-delete unificada
 * Tipos suportados: noticias, videos, anuncios, comentarios, classificados
 */
/** @var Router $router */

/** Mapa tipo => [tabela, campo de ID, função de serialização] */
function lixeira_tipos(): array {
  return [
    'noticias'      => ['tabela' => 'noticias',      'serialize' => 'noticia_serialize'],
    'videos'        => ['tabela' => 'videos',        'serialize' => 'video_serialize'],
    'anuncios'      => ['tabela' => 'anuncios',      'serialize' => 'anuncio_serialize'],
    'comentarios'   => ['tabela' => 'comentarios',   'serialize' => 'comentario_serialize'],
    'classificados' => ['tabela' => 'classificados', 'serialize' => 'classificado_serialize'],
  ];
}

$router->get('/api/lixeira/:tipo', function (array $p): void {
  Auth::requirePermissao('lixeira');
  $map = lixeira_tipos();
  if (!isset($map[$p['tipo']])) Response::notFound('Tipo de lixeira inválido');
  $tabela = $map[$p['tipo']]['tabela'];
  $rows = DB::fetchAll("SELECT * FROM $tabela WHERE removido_em IS NOT NULL ORDER BY removido_em DESC");
  $ser = $map[$p['tipo']]['serialize'];
  $out = [];
  foreach ($rows as $r) {
    $item = function_exists($ser) ? $ser($r) : $r;
    $item['id']         = $r['id'];
    $item['removidoEm'] = $r['removido_em'];
    $out[] = $item;
  }
  Response::ok($out);
});

$router->post('/api/lixeira/:tipo/:id/restaurar', function (array $p): void {
  Auth::requirePermissao('lixeira');
  $map = lixeira_tipos();
  if (!isset($map[$p['tipo']])) Response::notFound('Tipo inválido');
  $tabela = $map[$p['tipo']]['tabela'];
  $changed = DB::execute(
    "UPDATE $tabela SET removido_em = NULL, removido_por = NULL WHERE id = ? AND removido_em IS NOT NULL",
    [(int) $p['id']]
  );
  if (!$changed) Response::notFound('Item não encontrado na lixeira');
  Response::ok(['ok' => true, 'id' => (int) $p['id']]);
});

$router->delete('/api/lixeira/:tipo/:id', function (array $p): void {
  Auth::requirePermissao('lixeira');
  $map = lixeira_tipos();
  if (!isset($map[$p['tipo']])) Response::notFound('Tipo inválido');
  $tabela = $map[$p['tipo']]['tabela'];
  $changed = DB::execute("DELETE FROM $tabela WHERE id = ? AND removido_em IS NOT NULL", [(int) $p['id']]);
  if (!$changed) Response::notFound('Item não encontrado');
  Response::ok(['ok' => true, 'id' => (int) $p['id']]);
});

$router->delete('/api/lixeira/:tipo', function (array $p): void {
  Auth::requirePermissao('lixeira');
  $map = lixeira_tipos();
  if (!isset($map[$p['tipo']])) Response::notFound('Tipo inválido');
  $tabela = $map[$p['tipo']]['tabela'];
  DB::execute("DELETE FROM $tabela WHERE removido_em IS NOT NULL");
  Response::ok(['ok' => true]);
});
