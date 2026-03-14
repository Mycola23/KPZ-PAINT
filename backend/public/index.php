<?php

declare(strict_types=1);
spl_autoload_register(function (string $class): void {
    $base = __DIR__ . '/../src/';
    $file = $base . str_replace(['Paint\\', '\\'], ['', '/'], $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (!str_starts_with(trim($line), '#') && str_contains($line, '=')) {
            [$k, $v] = explode('=', $line, 2);
            $_ENV[trim($k)] = trim($v);
        }
    }
}

$allowedOrigin = $_ENV['FRONTEND_ORIGIN'] ?? 'http://localhost:5173';
$origin        = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin === $allowedOrigin || ($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
    header("Access-Control-Allow-Origin: $allowedOrigin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use Paint\Router\Router;
use Paint\Controller\DrawingController;

$router = new Router();
$router->get('/', DrawingController::class, 'list');
$router->get('/api/drawings',        DrawingController::class, 'list');
$router->post('/api/drawings',       DrawingController::class, 'create');
$router->get('/api/drawings/{id}',   DrawingController::class, 'show');
$router->put('/api/drawings/{id}',   DrawingController::class, 'update');
$router->delete('/api/drawings/{id}', DrawingController::class, 'destroy');

try {
    $router->dispatch();
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    $msg = ($_ENV['APP_DEBUG'] ?? 'false') === 'true' ? $e->getMessage() : 'Server error';
    echo json_encode(['success' => false, 'error' => $msg]);
}
