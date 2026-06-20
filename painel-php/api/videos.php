<?php
/** api/videos.php */
/** @var Router $router */

function youtube_id(string $raw): string {
  $s = trim($raw);
  if ($s === '') return '';
  if (preg_match('~(?:youtu\.be/|v=|shorts/|embed/)([A-Za-z0-9_-]{11})~', $s, $m)) return $m[1];
  return strlen($s) === 11 ? $s : '';
}

function video_serialize(array $r): array {
  return [
    'id'        => (int) $r['id'],
    'titulo'    => $r['titulo'],
    'thumb'     => $r['thumb']     ?? '',
    'duracao'   => $r['duracao']   ?? '',
    'youtubeId' => $r['youtube_id'],
    'categoria' => $r['categoria'] ?? '',
  ];
}

$router->get('/api/videos', function (): void {
  Auth::required();
  $q         = trim((string) Request::query('q', ''));
  $categoria = trim((string) Request::query('categoria', ''));
  $page      = max(1, (int) Request::query('page', 1));
  $perPage   = max(1, min(100, (int) Request::query('perPage', 20)));

  $where  = ['removido_em IS NULL'];
  $params = [];
  if ($q !== '')         { $where[] = 'titulo LIKE ?'; $params[] = '%' . $q . '%'; }
  if ($categoria !== '') { $where[] = 'categoria = ?'; $params[] = $categoria; }
  $whereSql = implode(' AND ', $where);

  $total  = (int) DB::fetchColumn("SELECT COUNT(*) FROM videos WHERE $whereSql", $params);
  $offset = ($page - 1) * $perPage;
  $items  = DB::fetchAll("SELECT * FROM videos WHERE $whereSql ORDER BY id DESC LIMIT $perPage OFFSET $offset", $params);

  Response::ok([
    'total' => $total, 'page' => $page, 'perPage' => $perPage,
    'totalPages' => (int) ceil($total / $perPage),
    'items' => array_map('video_serialize', $items),
  ]);
});

$router->get('/api/videos/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM videos WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$row) Response::notFound('Vídeo não encontrado');
  Response::ok(video_serialize($row));
});

$router->post('/api/videos', function (): void {
  Auth::requirePermissao('videos');
  $b = Request::body();
  if (empty($b['titulo']))    Response::badRequest('Título obrigatório');
  $yt = youtube_id((string) ($b['youtubeId'] ?? ''));
  if ($yt === '')             Response::badRequest('YouTube ID inválido');
  $thumb = $b['thumb'] ?? "https://i.ytimg.com/vi/$yt/hqdefault.jpg";
  $id = DB::insert(
    'INSERT INTO videos (titulo, thumb, duracao, youtube_id, categoria) VALUES (?,?,?,?,?)',
    [$b['titulo'], $thumb, $b['duracao'] ?? '', $yt, $b['categoria'] ?? 'geral']
  );
  Response::created(video_serialize(DB::fetch('SELECT * FROM videos WHERE id = ?', [$id])));
});

$router->put('/api/videos/:id', function (array $p): void {
  Auth::requirePermissao('videos');
  $b = Request::body();
  $id = (int) $p['id'];
  $prev = DB::fetch('SELECT * FROM videos WHERE id = ? AND removido_em IS NULL', [$id]);
  if (!$prev) Response::notFound('Vídeo não encontrado');
  $yt = isset($b['youtubeId']) ? youtube_id((string) $b['youtubeId']) : $prev['youtube_id'];
  DB::execute(
    'UPDATE videos SET titulo = ?, thumb = ?, duracao = ?, youtube_id = ?, categoria = ? WHERE id = ?',
    [
      $b['titulo']    ?? $prev['titulo'],
      $b['thumb']     ?? $prev['thumb'],
      $b['duracao']   ?? $prev['duracao'],
      $yt,
      $b['categoria'] ?? $prev['categoria'],
      $id,
    ]
  );
  Response::ok(video_serialize(DB::fetch('SELECT * FROM videos WHERE id = ?', [$id])));
});

$router->delete('/api/videos/:id', function (array $p): void {
  Auth::requirePermissao('videos');
  $changed = DB::execute(
    'UPDATE videos SET removido_em = NOW() WHERE id = ? AND removido_em IS NULL',
    [(int) $p['id']]
  );
  if (!$changed) Response::notFound('Vídeo não encontrado');
  Response::ok(['ok' => true]);
});
