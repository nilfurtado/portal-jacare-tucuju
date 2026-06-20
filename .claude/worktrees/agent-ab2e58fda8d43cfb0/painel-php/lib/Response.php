<?php
/** Response — helpers para responder JSON com status correto. */
class Response {
  public static function json($data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }

  public static function ok($data = ['ok' => true]): never {
    self::json($data, 200);
  }

  public static function created($data): never {
    self::json($data, 201);
  }

  public static function badRequest(string $msg, $extra = null): never {
    self::json(['erro' => $msg] + ($extra ? ['detalhes' => $extra] : []), 400);
  }

  public static function unauthorized(string $msg = 'Não autenticado'): never {
    self::json(['erro' => $msg], 401);
  }

  public static function forbidden(string $msg = 'Sem permissão'): never {
    self::json(['erro' => $msg], 403);
  }

  public static function notFound(string $msg = 'Não encontrado'): never {
    self::json(['erro' => $msg], 404);
  }

  public static function conflict(string $msg): never {
    self::json(['erro' => $msg], 409);
  }

  public static function serverError(string $msg = 'Erro interno'): never {
    self::json(['erro' => $msg], 500);
  }
}
