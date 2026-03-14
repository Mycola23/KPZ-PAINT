<?php

declare(strict_types=1);

namespace Paint\Model;

use Paint\Database\DB;
use PDO;


class DrawingModel
{
    public function all(): array
    {
        return DB::get()
            ->query("SELECT * FROM drawings ORDER BY updated_at DESC")
            ->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = DB::get()->prepare("SELECT * FROM drawings WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $cols   = implode(', ', array_keys($data));
        $places = implode(', ', array_fill(0, count($data), '?'));
        $stmt   = DB::get()->prepare("INSERT INTO drawings ($cols) VALUES ($places)");
        $stmt->execute(array_values($data));
        return (int) DB::get()->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($data)));
        $stmt = DB::get()->prepare("UPDATE drawings SET $sets WHERE id = ?");
        $stmt->execute([...array_values($data), $id]);
    }

    public function delete(int $id): void
    {
        $stmt = DB::get()->prepare("DELETE FROM drawings WHERE id = ?");
        $stmt->execute([$id]);
    }
}
