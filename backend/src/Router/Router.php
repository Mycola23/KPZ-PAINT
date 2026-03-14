<?php

declare(strict_types=1);

namespace Paint\Router;

class Router
{
    private array $routes = [];

    public function get(string $path, string $class, string $method): void
    {
        $this->routes['GET'][$path] = compact('class', 'method');
    }

    public function post(string $path, string $class, string $method): void
    {
        $this->routes['POST'][$path] = compact('class', 'method');
    }

    public function put(string $path, string $class, string $method): void
    {
        $this->routes['PUT'][$path] = compact('class', 'method');
    }

    public function delete(string $path, string $class, string $method): void
    {
        $this->routes['DELETE'][$path] = compact('class', 'method');
    }

    public function dispatch(): void
    {
        $httpMethod  = $_SERVER['REQUEST_METHOD'];
        $requestPath = strtok($_SERVER['REQUEST_URI'] ?? '/', '?');
        $requestPath = '/' . trim((string)$requestPath, '/');

        foreach ($this->routes[$httpMethod] ?? [] as $pattern => $route) {
            $regex  = '#^' . preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $pattern) . '$#';
            if (preg_match($regex, $requestPath, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $obj    = new $route['class']();
                $obj->{$route['method']}(...array_values($params));
                return;
            }
        }

        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Not found']);
    }
}
