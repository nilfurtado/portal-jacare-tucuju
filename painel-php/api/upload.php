<?php
/** api/upload.php — upload de imagem multipart */
/** @var Router $router */

$router->post('/api/upload', function (): void {
  Auth::required();

  if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    Response::badRequest('Envie um arquivo no campo "file"');
  }
  $file = $_FILES['file'];

  // Limite
  $maxBytes = (int) Env::get('UPLOAD_MAX_BYTES', 8 * 1024 * 1024);
  if ($file['size'] > $maxBytes) {
    Response::badRequest('Arquivo excede o tamanho máximo de ' . round($maxBytes / 1024 / 1024) . ' MB');
  }

  // Detecta MIME real
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = $finfo->file($file['tmp_name']);
  $allowed = ['image/jpeg','image/png','image/webp','image/svg+xml','image/gif'];
  if (!in_array($mime, $allowed, true)) {
    Response::badRequest('Tipo de arquivo não suportado: ' . $mime);
  }

  // Extensão segura derivada do MIME
  $ext = match ($mime) {
    'image/jpeg'    => 'jpg',
    'image/png'     => 'png',
    'image/webp'    => 'webp',
    'image/svg+xml' => 'svg',
    'image/gif'     => 'gif',
  };

  // Destino: portal/img/uploads/AAAA/MM/<timestamp>-<hash>.<ext>
  $portalDir = realpath(__DIR__ . '/../../') ?: dirname(dirname(__DIR__));
  $sub = date('Y/m');
  $dir = $portalDir . "/img/uploads/$sub";
  if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
    Response::serverError('Não consegui criar pasta de upload');
  }
  $hash = bin2hex(random_bytes(6));
  $fname = sprintf('%d-%s.%s', (int) (microtime(true) * 1000), $hash, $ext);
  $abs = "$dir/$fname";
  if (!move_uploaded_file($file['tmp_name'], $abs)) {
    Response::serverError('Falha ao mover arquivo');
  }

  Response::created([
    'url'          => "/img/uploads/$sub/$fname",
    'mime'         => $mime,
    'size'         => (int) $file['size'],
    'originalName' => $file['name'] ?? null,
  ]);
});
