<?php
/** api/enquetes.php */
/** @var Router $router */

function enquete_serialize(array $r): array {
  return [
    'id'       => $r['id'],
    'pergunta' => $r['pergunta'],
    'opcoes'   => is_string($r['opcoes']) ? (json_decode($r['opcoes'], true) ?: []) : ($r['opcoes'] ?? []),
    'ativa'    => (bool) $r['ativa'],
  ];
}

$router->get('/api/enquetes', function (): void {
  Auth::required();
  $rows = DB::fetchAll('SELECT * FROM enquetes ORDER BY criado_em DESC');
  Response::ok(array_map('enquete_serialize', $rows));
});

$router->get('/api/enquetes/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM enquetes WHERE id = ?', [$p['id']]);
  if (!$row) Response::notFound('Enquete não encontrada');
  Response::ok(enquete_serialize($row));
});

$router->post('/api/enquetes', function (): void {
  Auth::requirePermissao('enquetes');
  $b = Request::body();
  if (empty($b['pergunta'])) Response::badRequest('Pergunta obrigatória');
  if (!is_array($b['opcoes'] ?? null) || count($b['opcoes']) < 2) {
    Response::badRequest('Inclua pelo menos 2 opções');
  }
  $baseId = $b['id'] ?? Slug::make($b['pergunta']);
  $id = $baseId; $n = 2;
  while (DB::fetchColumn('SELECT 1 FROM enquetes WHERE id = ?', [$id])) {
    $id = $baseId . '-' . $n++;
  }
  $opcoes = [];
  foreach ($b['opcoes'] as $i => $o) {
    $oid = $o['id'] ?? Slug::make($o['label'] ?? '');
    if ($oid === '') $oid = 'opc-' . ($i + 1);
    $opcoes[] = ['id' => $oid, 'label' => $o['label'] ?? '', 'votos' => (int) ($o['votos'] ?? 0)];
  }
  $ativa = !isset($b['ativa']) || $b['ativa'] !== false ? 1 : 0;
  DB::transaction(function () use ($id, $b, $opcoes, $ativa) {
    if ($ativa) DB::execute('UPDATE enquetes SET ativa = 0');
    DB::execute(
      'INSERT INTO enquetes (id, pergunta, opcoes, ativa) VALUES (?, ?, ?, ?)',
      [$id, $b['pergunta'], json_encode($opcoes, JSON_UNESCAPED_UNICODE), $ativa]
    );
  });
  Response::created(enquete_serialize(DB::fetch('SELECT * FROM enquetes WHERE id = ?', [$id])));
});

$router->put('/api/enquetes/:id', function (array $p): void {
  Auth::requirePermissao('enquetes');
  $b = Request::body();
  $id = $p['id'];
  $prev = DB::fetch('SELECT * FROM enquetes WHERE id = ?', [$id]);
  if (!$prev) Response::notFound('Enquete não encontrada');
  $opcoes = $b['opcoes'] ?? null;
  if ($opcoes !== null) {
    $tmp = [];
    foreach ($opcoes as $i => $o) {
      $oid = $o['id'] ?? Slug::make($o['label'] ?? '') ?: ('opc-' . ($i + 1));
      $tmp[] = ['id' => $oid, 'label' => $o['label'] ?? '', 'votos' => (int) ($o['votos'] ?? 0)];
    }
    $opcoes = $tmp;
  } else {
    $opcoes = json_decode($prev['opcoes'], true) ?: [];
  }
  $ativa = array_key_exists('ativa', $b) ? ($b['ativa'] ? 1 : 0) : (int) $prev['ativa'];
  DB::transaction(function () use ($id, $b, $prev, $opcoes, $ativa) {
    if ($ativa) DB::execute('UPDATE enquetes SET ativa = 0 WHERE id != ?', [$id]);
    DB::execute(
      'UPDATE enquetes SET pergunta = ?, opcoes = ?, ativa = ? WHERE id = ?',
      [$b['pergunta'] ?? $prev['pergunta'], json_encode($opcoes, JSON_UNESCAPED_UNICODE), $ativa, $id]
    );
  });
  Response::ok(enquete_serialize(DB::fetch('SELECT * FROM enquetes WHERE id = ?', [$id])));
});

$router->patch('/api/enquetes/:id/ativar', function (array $p): void {
  Auth::requirePermissao('enquetes');
  $id = $p['id'];
  $cur = DB::fetchColumn('SELECT ativa FROM enquetes WHERE id = ?', [$id]);
  if ($cur === null) Response::notFound('Enquete não encontrada');
  $novo = $cur ? 0 : 1;
  DB::transaction(function () use ($id, $novo) {
    if ($novo) DB::execute('UPDATE enquetes SET ativa = 0');
    DB::execute('UPDATE enquetes SET ativa = ? WHERE id = ?', [$novo, $id]);
  });
  Response::ok(['id' => $id, 'ativa' => (bool) $novo]);
});

$router->delete('/api/enquetes/:id', function (array $p): void {
  Auth::requirePermissao('enquetes');
  $changed = DB::execute('DELETE FROM enquetes WHERE id = ?', [$p['id']]);
  if (!$changed) Response::notFound('Enquete não encontrada');
  Response::ok(['ok' => true]);
});
