<?php

namespace App\Services\Storefront;

use App\Models\Shop;
use App\Models\StorefrontMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Encoders\AutoEncoder;
use Intervention\Image\ImageManager;

class StorefrontMediaService
{
    private const MAX_WIDTH = 1920;

    private const MAX_HEIGHT = 1920;

    private const ENCODE_QUALITY = 80;

    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    public function upload(Shop $shop, UploadedFile $file, ?string $altText = null, ?string $usageContext = null): StorefrontMedia
    {
        $this->validateFileType($file);

        $manager = new ImageManager(new \Intervention\Image\Drivers\Gd\Driver);
        $image = $manager->decodePath($file->getPathname());

        $originalWidth = $image->width();
        $originalHeight = $image->height();

        if ($originalWidth > self::MAX_WIDTH || $originalHeight > self::MAX_HEIGHT) {
            $image->scaleDown(self::MAX_WIDTH, self::MAX_HEIGHT);
        }

        $encoded = $image->encode(new AutoEncoder(quality: self::ENCODE_QUALITY));

        $filename = Str::ulid().'.'.$this->resolveExtension($file);
        $path = "storefront/{$shop->id}/{$filename}";

        Storage::disk('public')->put($path, (string) $encoded);

        return StorefrontMedia::query()->create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => strlen((string) $encoded),
            'dimensions' => [
                'width' => $image->width(),
                'height' => $image->height(),
            ],
            'alt_text' => $altText,
            'usage_context' => $usageContext,
        ]);
    }

    public function delete(StorefrontMedia $media): void
    {
        Storage::disk('public')->delete($media->file_path);

        $media->delete();
    }

    private function validateFileType(UploadedFile $file): void
    {
        if (! in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            throw new \InvalidArgumentException(
                "File type '{$file->getMimeType()}' is not allowed. Accepted types: ".implode(', ', self::ALLOWED_MIME_TYPES)
            );
        }
    }

    private function resolveExtension(UploadedFile $file): string
    {
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];

        return $mimeToExt[$file->getMimeType()] ?? $file->guessExtension() ?? 'jpg';
    }
}
