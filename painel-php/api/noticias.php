<?php
/**
 * api/noticias.php — CRUD de notícias
 */
/** @var Router $router */

// Helper: serializa notícia para JSON consistente
function noticia_serialize(array $row): array {
  $row['id']            = (int) $row['id'];
  $row['destaque']      = (bool) $row['destaque'];
  $row['views']         = (int) $row['views'];
  $row['tempoLeitura'] = (int) ($row['tempo_leitura'] ?? 1);
  $row['autorAvatar']  = $row['autor_avatar'] ?? '';
  $row['tags']          = is_string($row['tags']) ? (json_decode($row['tags'], true) ?: []) : ($row['tags'] ?? []);
  unset($row['tempo_leitura'], $row['autor_avatar'], $row['removido_em'], $row['removido_por']);
  return $row;
}

function tempo_leitura_estimar(string $html): int {
  $texto = trim(strip_tags($html));
  $palavras = $texto === '' ? 0 : count(preg_split('/\s+/u', $texto));
  return max(1, (int) ceil($palavras / 220));
}

// ------ GET / (listar) ------
$router->get('/api/noticias', function (): void {
  Auth::required();

  $q         = trim((string) Request::query('q', ''));
  $categoria = trim((string) Request::query('categoria', ''));
  $autor     = trim((string) Request::query('autor', ''));
  $status    = trim((string) Request::query('status', ''));
  $page      = max(1, (int) Request::query('page', 1));
  $perPage   = max(1, min(100, (int) Request::query('perPage', 20)));

  $where = ['removido_em IS NULL'];
  $params = [];
  if ($q !== '') {
    $where[] = '(titulo LIKE ? OR lide LIKE ? OR JSON_SEARCH(LOWER(tags), "one", LOWER(?)) IS NOT NULL)';
    $like = '%' . $q . '%';
    $params[] = $like; $params[] = $like; $params[] = $q;
  }
  if ($categoria !== '') { $where[] = 'categoria = ?'; $params[] = $categoria; }
  if ($autor !== '')     { $where[] = 'autor LIKE ?'; $params[] = '%' . $autor . '%'; }
  if ($status === 'destaque') $where[] = 'destaque = 1';
  if ($status === 'normal')   $where[] = 'destaque = 0';

  $whereSql = implode(' AND ', $where);
  $total = (int) DB::fetchColumn("SELECT COUNT(*) FROM noticias WHERE $whereSql", $params);
  $offset = ($page - 1) * $perPage;

  $items = DB::fetchAll(
    "SELECT * FROM noticias WHERE $whereSql ORDER BY data DESC LIMIT $perPage OFFSET $offset",
    $params
  );

  Response::ok([
    'total'      => $total,
    'page'       => $page,
    'perPage'    => $perPage,
    'totalPages' => (int) ceil($total / $perPage),
    'items'      => array_map('noticia_serialize', $items),
  ]);
});

// ------ GET /:id ------
$router->get('/api/noticias/:id', function (array $p): void {
  Auth::required();
  $row = DB::fetch('SELECT * FROM noticias WHERE id = ? AND removido_em IS NULL', [(int) $p['id']]);
  if (!$row) Response::notFound('Notícia não encontrada');
  Response::ok(noticia_serialize($row));
});

// ------ POST / (criar) ------
$router->post('/api/noticias', function (): void {
  $user = Auth::requirePermissao('noticias');
  $body = Request::body();
  if (empty($body['titulo'])) Response::badRequest('Título obrigatório');

  $slugs = array_column(DB::fetchAll('SELECT slug FROM noticias'), 'slug');
  $slug  = isset($body['slug']) && $body['slug'] !== ''
    ? Slug::make($body['slug'])
    : Slug::unique($body['titulo'], $slugs);
  if (in_array($slug, $slugs, true)) Response::conflict('Slug já existe');

  $conteudo = $body['conteudo'] ?? '';
  $tempo = $body['tempoLeitura'] ?? tempo_leitura_estimar($conteudo);

  $id = DB::insert(
    "INSERT INTO noticias
       (slug, titulo, lide, conteudo, imagem, categoria, municipio, autor, autor_avatar, data,
        tags, destaque, views, tempo_leitura, criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      $slug,
      $body['titulo'],
      $body['lide'] ?? '',
      $conteudo,
      $body['imagem'] ?? '',
      $body['categoria'] ?? 'politica',
      $body['municipio'] ?? '',
      $body['autor'] ?? $user['nome'],
      $body['autorAvatar'] ?? '',
      $body['data'] ?? date('Y-m-d H:i:s'),
      json_encode($body['tags'] ?? [], JSON_UNESCAPED_UNICODE),
      !empty($body['destaque']) ? 1 : 0,
      (int) ($body['views'] ?? 0),
      (int) $tempo,
      (int) $user['sub'],
    ]
  );

  $row = DB::fetch('SELECT * FROM noticias WHERE id = ?', [$id]);
  Response::created(noticia_serialize($row));
});

// ------ PUT /:id ------
$router->put('/api/noticias/:id', function (array $p): void {
  $user = Auth::requirePermissao('noticias');
  $body = Request::body();
  $id = (int) $p['id'];

  $prev = DB::fetch('SELECT * FROM noticias WHERE id = ? AND removido_em IS NULL', [$id]);
  if (!$prev) Response::notFound('Notícia não encontrada');

  $slug = $prev['slug'];
  if (!empty($body['slug']) && $body['slug'] !== $prev['slug']) {
    $novo = Slug::make($body['slug']);
    $exists = DB::fetchColumn('SELECT id FROM noticias WHERE slug = ? AND id != ?', [$novo, $id]);
    if ($exists) Response::conflict('Slug já existe');
    $slug = $novo;
  }

  $conteudo = $body['conteudo'] ?? $prev['conteudo'];
  $tempo = $body['conteudo'] ?? false ? tempo_leitura_estimar($conteudo) : $prev['tempo_leitura'];

  DB::execute(
    "UPDATE noticias SET
       slug = ?, titulo = ?, lide = ?, conteudo = ?, imagem = ?,
       categoria = ?, municipio = ?, autor = ?, autor_avatar = ?, data = ?,
       tags = ?, destaque = ?, views = ?, tempo_leitura = ?,
       atualizado_em = NOW(), atualizado_por = ?
     WHERE id = ?",
    [
      $slug,
      $body['titulo']      ?? $prev['titulo'],
      $body['lide']        ?? $prev['lide'],
      $conteudo,
      $body['imagem']      ?? $prev['imagem'],
      $body['categoria']   ?? $prev['categoria'],
      $body['municipio']   ?? $prev['municipio'],
      $body['autor']       ?? $prev['autor'],
      $body['autorAvatar'] ?? $prev['autor_avatar'],
      $body['data']        ?? $prev['data'],
      json_encode($body['tags'] ?? (json_decode($prev['tags'] ?? '[]', true) ?: []), JSON_UNESCAPED_UNICODE),
      isset($body['destaque']) ? ($body['destaque'] ? 1 : 0) : (int) $prev['destaque'],
      isset($body['views']) ? (int) $body['views'] : (int) $prev['views'],
      (int) $tempo,
      (int) $user['sub'],
      $id,
    ]
  );

  $row = DB::fetch('SELECT * FROM noticias WHERE id = ?', [$id]);
  Response::ok(noticia_serialize($row));
});

// ------ PATCH /:id/destaque ------
$router->patch('/api/noticias/:id/destaque', function (array $p): void {
  Auth::requirePermissao('noticias');
  $id = (int) $p['id'];
  $cur = DB::fetchColumn('SELECT destaque FROM noticias WHERE id = ? AND removido_em IS NULL', [$id]);
  if ($cur === null) Response::notFound('Notícia não encontrada');
  $novo = $cur ? 0 : 1;
  DB::execute('UPDATE noticias SET destaque = ? WHERE id = ?', [$novo, $id]);
  Response::ok(['id' => $id, 'destaque' => (bool) $novo]);
});

// ------ DELETE /:id (soft) ------
$router->delete('/api/noticias/:id', function (array $p): void {
  $user = Auth::requirePermissao('noticias');
  $id = (int) $p['id'];
  $changed = DB::execute(
    'UPDATE noticias SET removido_em = NOW(), removido_por = ? WHERE id = ? AND removido_em IS NULL',
    [(int) $user['sub'], $id]
  );
  if (!$changed) Response::notFound('Notícia não encontrada');
  Response::ok(['ok' => true, 'id' => $id]);
});
