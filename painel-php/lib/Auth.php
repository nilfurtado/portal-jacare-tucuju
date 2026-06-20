<?php
/**
 * Auth — verifica Bearer token e injeta user atual no contexto.
 * Uso:
 *   $user = Auth::required();        // 401 se ausente / inválido
 *   Auth::requirePermissao('noticias'); // 403 se sem permissão
 */
class Auth {
  private static ?array $user = null;

  /** Retorna o usuário corrente ou null. */
  public static function current(): ?array {
    if (self::$user !== null) return self::$user;
    $token = Request::bearerToken();
    if (!$token) return null;
    try {
      $payload = JWT::decode($token);
      self::$user = $payload;
      return self::$user;
    } catch (Throwable $e) {
      return null;
    }
  }

  /** Garante que há usuário autenticado, senão responde 401. */
  public static function required(): array {
    $u = self::current();
    if (!$u) Response::unauthorized('Token ausente ou inválido');
    return $u;
  }

  /**
   * Garante que o usuário tem permissão para o módulo (ou é admin).
   * Aceita string ou array de módulos (qualquer um basta).
   */
  public static function requirePermissao(string|array $modulos): array {
    $u = self::required();
    if (($u['tipo'] ?? '') === 'admin') return $u;
    $lista = is_array($modulos) ? $modulos : [$modulos];
    $paginas = $u['permissoes']['paginas'] ?? [];
    foreach ($lista as $m) {
      if (in_array($m, $paginas, true)) return $u;
    }
    Response::forbidden('Sem permissão para acessar este módulo');
  }
}
