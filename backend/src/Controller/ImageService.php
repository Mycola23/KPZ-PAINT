<?php
declare(strict_types=1);

namespace Paint\Service;

class ImageService
{
    private const THUMBNAIL_WIDTH = 200;
    private const THUMBNAIL_HEIGHT = 150;
    private const UPLOAD_DIR = __DIR__ . '/../../public/uploads/';
    private const BASE64_PATTERN = '/^data:image\/\w+;base64,/';

    public function extractThumbnail(?string $base64): ?string
    {
        if ($base64 === null || !function_exists('imagecreatefrompng')) {
            return null;
        }
        
        $clean = $this->cleanBase64($base64);
        $src = @imagecreatefromstring(base64_decode($clean));
        if (!$src) return null;

        $thumb = imagecreatetruecolor(self::THUMBNAIL_WIDTH, self::THUMBNAIL_HEIGHT);
        imagecopyresampled($thumb, $src, 0, 0, 0, 0, self::THUMBNAIL_WIDTH, self::THUMBNAIL_HEIGHT, imagesx($src), imagesy($src));

        ob_start();
        imagepng($thumb, null, 7);
        $data = ob_get_clean();

        imagedestroy($src);
        imagedestroy($thumb);

        return base64_encode($data);
    }

    public function saveImageFile(string $base64, int $drawingId): ?string
    {
        if (!is_dir(self::UPLOAD_DIR)) {
            @mkdir(self::UPLOAD_DIR, 0755, true);
        }

        $clean = $this->cleanBase64($base64);
        $data = base64_decode($clean);
        $filename = sprintf('drawing_%d_%s.png', $drawingId, substr(md5((string)time()), 0, 8));
        $fullPath = self::UPLOAD_DIR . $filename;

        if ($data && file_put_contents($fullPath, $data) !== false) {
            return 'uploads/' . $filename;
        }
        return null;
    }

    private function cleanBase64(string $base64): string
    {
        return preg_replace(self::BASE64_PATTERN, '', $base64);
    }
}
