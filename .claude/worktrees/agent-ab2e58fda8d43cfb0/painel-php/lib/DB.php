<?php
/**
 * DB — Singleton PDO MySQL.
 * Métodos auxiliares para queries seguras.
 */
class DB {
  private static ?PDO $pdo = null;

  public static function pdo(): PDO {
    if (self::$pdo) return self::$pdo;
    Env::load();
    $host    = Env::get('DB_HOST', 'localhost');
    $port    = (int) Env::get('DB_PORT', 3306);
    $name    = Env::require('DB_NAME');
    $user    = Env::require('DB_USER');
    $pass    = Env::get('DB_PASS', '');
    $charset = Env::get('DB_CHARSET', 'utf8mb4');

    $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=$charset";
    $opts = [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES   => false,
      PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '-03:00'",
    ];
    self::$pdo = new PDO($dsn, $user, $pass, $opts);
    return self::$pdo;
  }

  /** Conexão sem nome de banco (para criar / verificar existência). */
  public static function pdoServer(): PDO {
    Env::load();
    $dsn = sprintf('mysql:host=%s;port=%d;charset=%s',
      Env::get('DB_HOST', 'localhost'),
      (int) Env::get('DB_PORT', 3306),
      Env::get('DB_CHARSET', 'utf8mb4')
    );
    return new PDO($dsn, Env::require('DB_USER'), Env::get('DB_PASS', ''), [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
  }

  public static function fetch(string $sql, array $params = []): ?array {
    $st = self::pdo()->prepare($sql);
    $st->execute($params);
    $row = $st->fetch();
    return $row === false ? null : $row;
  }

  public static function fetchAll(string $sql, array $params = []): array {
    $st = self::pdo()->prepare($sql);
    $st->execute($params);
    return $st->fetchAll();
  }

  public static function fetchColumn(string $sql, array $params = []) {
    $st = self::pdo()->prepare($sql);
    $st->execute($params);
    $v = $st->fetchColumn();
    return $v === false ? null : $v;
  }

  public static function execute(string $sql, array $params = []): int {
    $st = self::pdo()->prepare($sql);
    $st->execute($params);
    return $st->rowCount();
  }

  public static function insert(string $sql, array $params = []): int {
    self::execute($sql, $params);
    return (int) self::pdo()->lastInsertId();
  }

  public static function transaction(callable $fn) {
    $pdo = self::pdo();
    $pdo->beginTransaction();
    try {
      $r = $fn($pdo);
      $pdo->commit();
      return $r;
    } catch (Throwable $e) {
      $pdo->rollBack();
      throw $e;
    }
  }
}
