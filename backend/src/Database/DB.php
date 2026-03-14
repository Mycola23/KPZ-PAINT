<?php

declare(strict_types=1);

namespace Paint\Database;

use PDO;
use PDOException;
use RuntimeException;

final class DB
{
    private static ?DB $instance = null;
    private readonly PDO $pdo;

    private function __construct()
    {
        $env = self::loadEnv();

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $env['DB_HOST']     ?? 'localhost',
            $env['DB_PORT']     ?? '3306',
            $env['DB_NAME']     ?? 'paint_stand'
        );

        try {
            $this->pdo = new PDO($dsn, $env['DB_USER'] ?? 'root', $env['DB_PASSWORD'] ?? '', [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            throw new RuntimeException('DB connection failed: ' . $e->getMessage());
        }
    }

    private function __clone(): void {}

    public static function get(): PDO
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->pdo;
    }

    private static function loadEnv(): array
    {
        $envFile = __DIR__ . '/../../.env';
        if (!file_exists($envFile)) {
            return [];
        }

        $env = [];
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value]  = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
        return $env;
    }
}
