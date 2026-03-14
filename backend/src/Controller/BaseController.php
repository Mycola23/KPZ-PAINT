<?php

declare(strict_types=1);

namespace Paint\Controller;


abstract class BaseController
{
    protected function ok(mixed $data): void
    {
        $this->json(['success' => true, 'data' => $data], 200);
    }

    protected function created(mixed $data): void
    {
        $this->json(['success' => true, 'data' => $data], 201);
    }

    protected function error(string $message, int $code = 400): void
    {
        $this->json(['success' => false, 'error' => $message], $code);
    }

    protected function body(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw ?: '{}', true) ?? [];
    }

    private function json(array $payload, int $status): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
