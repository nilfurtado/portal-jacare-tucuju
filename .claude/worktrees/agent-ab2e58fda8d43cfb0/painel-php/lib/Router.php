<?php
/**
 * Router — micro roteador HTTP por método + path com parâmetros.
 * Suporta padrões como '/noticias/:id/destaque' e converte em regex.
 */
class Router {
  /** @var array<int, array{method:string, regex:string, params:array, handler:callable}> */
  private array $routes = [];

  public function add(string $method, string $pattern, callable $handler): void {
    // /usuarios/:id/status  →  ~^/usuarios/(?<id>[^/]+)/status$~
    $params = [];
    $regex = preg_replace_callback('/:(\w+)/', function ($m) use (&$params) {
      $params[] = $m[1];
      return '(?<' . $m[1] . '>[^/]+)';
    }, rtrim($pattern, '/') ?: '/');
    $regex = '~^' . $regex . '$~u';
    $this->routes[] = compact('method', 'regex', 'params', 'handler');
  }

  public function get(string $p, callable $h):    void { $this->add('GET',    $p, $h); }
  public function post(string $p, callable $h):   void { $this->add('POST',   $p, $h); }
  public function put(string $p, callable $h):    void { $this->add('PUT',    $p, $h); }
  public function patch(string $p, callable $h):  void { $this->add('PATCH',  $p, $h); }
  public function delete(string $p, callable $h): void { $this->add('DELETE', $p, $h); }

  /** Despacha; chama handler com array de params. */
  public function dispatch(string $method, string $path): bool {
    foreach ($this->routes as $r) {
      if ($r['method'] !== $method) continue;
      if (preg_match($r['regex'], $path, $m)) {
        $params = [];
        foreach ($r['params'] as $p) $params[$p] = urldecode($m[$p] ?? '');
        ($r['handler'])($params);
        return true;
      }
    }
    return false;
  }
}
