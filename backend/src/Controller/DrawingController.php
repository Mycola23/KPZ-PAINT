<?php

declare(strict_types=1);

namespace Paint\Controller;

use Paint\Model\DrawingModel;


class DrawingController extends BaseController
{
    private DrawingModel $model;

    public function __construct()
    {
        $this->model = new DrawingModel();
    }

    public function list(): void
    {
        $drawings = $this->model->all();
        $this->ok([
            'drawings' => array_map(fn($d) => $this->toListItem($d), $drawings),
            'total'    => count($drawings),
        ]);
    }

    public function show(string $id): void
    {
        $drawing = $this->model->find((int) $id);
        if (!$drawing) {
            $this->error('Drawing not found', 404);
        }
        $this->ok(['drawing' => $drawing]);
    }

    public function create(): void
    {
        $body = $this->body();

        if (empty($body['canvas_json'])) {
            $this->error('canvas_json is required');
        }

        $id = $this->model->create([
            'title'        => mb_substr(strip_tags($body['title'] ?? 'Untitled'), 0, 255),
            'canvas_json'  => $body['canvas_json'],
            'thumbnail'    => $this->extractThumbnail($body['image_base64'] ?? null),
            'canvas_width' => (int) ($body['width']  ?? 800),
            'canvas_height' => (int) ($body['height'] ?? 600),
        ]);


        if (!empty($body['image_base64'])) {
            $filePath = $this->saveImageFile($body['image_base64'], $id);
            if ($filePath) {
                $this->model->update($id, ['file_path' => $filePath]);
            }
        }

        $this->created(['id' => $id, 'message' => 'Saved']);
    }

    public function update(string $id): void
    {
        $drawingId = (int) $id;
        if (!$this->model->find($drawingId)) {
            $this->error('Not found', 404);
        }

        $body   = $this->body();
        $fields = array_filter([
            'title'       => isset($body['title'])       ? mb_substr(strip_tags($body['title']), 0, 255) : null,
            'canvas_json' => $body['canvas_json'] ?? null,
            'thumbnail'   => isset($body['image_base64']) ? $this->extractThumbnail($body['image_base64']) : null,
        ], fn($v) => $v !== null);

        if (empty($fields)) {
            $this->error('Nothing to update');
        }

        $this->model->update($drawingId, $fields);
        $this->ok(['updated' => true]);
    }

    public function destroy(string $id): void
    {
        $this->model->delete((int) $id);
        $this->ok(['deleted' => true]);
    }





    private function extractThumbnail(?string $base64): ?string
    {
        if ($base64 === null || !function_exists('imagecreatefrompng')) {
            return null;
        }
        $clean = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $src   = @imagecreatefromstring(base64_decode($clean));
        if (!$src) return null;

        $thumb = imagecreatetruecolor(200, 150);
        imagecopyresampled($thumb, $src, 0, 0, 0, 0, 200, 150, imagesx($src), imagesy($src));

        ob_start();
        imagepng($thumb, null, 7);
        $data = ob_get_clean();

        imagedestroy($src);
        imagedestroy($thumb);

        return base64_encode($data);
    }


    private function saveImageFile(string $base64, int $drawingId): ?string
    {
        $uploadDir = __DIR__ . '/../../public/uploads/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0755, true);
        }

        $clean    = preg_replace('/^data:image\/\w+;base64,/', '', $base64);
        $data     = base64_decode($clean);
        $filename = sprintf('drawing_%d_%s.png', $drawingId, substr(md5((string)time()), 0, 8));
        $fullPath = $uploadDir . $filename;

        if ($data && file_put_contents($fullPath, $data) !== false) {
            return 'uploads/' . $filename;
        }
        return null;
    }


    // helpers 

    private function toListItem(array $d): array
    {
        return [
            'id'         => $d['id'],
            'title'      => $d['title'],
            'thumbnail'  => $d['thumbnail'],
            'width'      => $d['canvas_width'],
            'height'     => $d['canvas_height'],
            'updated_at' => $d['updated_at'],
        ];
    }
}
