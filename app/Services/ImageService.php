<?php

namespace App\Services;

use App\Models\Image;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageService
{
    /**
     * Upload an image for a model
     */
    public function upload(
        Model $model,
        UploadedFile $file,
        array $additionalData = []
    ): Image {
        return DB::transaction(function () use ($model, $file, $additionalData) {
            $tenantId = $model->tenant_id ?? auth()->user()->tenant_id;

            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $modelType = class_basename($model);
            $path = "tenants/{$tenantId}/" . Str::plural(strtolower($modelType)) . "/{$model->id}/{$filename}";

            $disk = config('images.disk', 'public');
            Storage::disk($disk)->put($path, file_get_contents($file));

            $dimensions = $this->getImageDimensions($file);

            $isPrimary = $additionalData['is_primary'] ?? !$model->images()->exists();

            if ($isPrimary) {
                $model->images()->update(['is_primary' => false]);
            }

            $sortOrder = $additionalData['sort_order'] ?? $model->images()->max('sort_order') + 1;

            return $model->images()->create([
                'tenant_id' => $tenantId,
                'filename' => $filename,
                'path' => $path,
                'disk' => $disk,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'width' => $dimensions['width'],
                'height' => $dimensions['height'],
                'alt_text' => $additionalData['alt_text'] ?? null,
                'title' => $additionalData['title'] ?? null,
                'caption' => $additionalData['caption'] ?? null,
                'is_primary' => $isPrimary,
                'sort_order' => $sortOrder,
                'metadata' => $additionalData['metadata'] ?? null,
            ]);
        });
    }

    /**
     * Upload multiple images for a model
     */
    public function uploadMultiple(
        Model $model,
        array $files,
        array $additionalData = []
    ): array {
        $uploadedImages = [];

        foreach ($files as $index => $file) {
            $data = $additionalData[$index] ?? [];
            $uploadedImages[] = $this->upload($model, $file, $data);
        }

        return $uploadedImages;
    }

    /**
     * Delete an image
     */
    public function delete(Image $image): bool
    {
        return DB::transaction(function () use ($image) {
            $wasPrimary = $image->is_primary;
            $imageable = $image->imageable;

            $deleted = $image->delete();

            if ($deleted && $wasPrimary && $imageable) {
                $newPrimary = $imageable->images()->ordered()->first();
                if ($newPrimary) {
                    $newPrimary->update(['is_primary' => true]);
                }
            }

            return $deleted;
        });
    }

    /**
     * Set an image as primary
     */
    public function setPrimary(Image $image): bool
    {
        return DB::transaction(function () use ($image) {
            $image->imageable->images()->update(['is_primary' => false]);

            return $image->update(['is_primary' => true]);
        });
    }

    /**
     * Reorder images for a model
     */
    public function reorder(Model $model, array $imageIds): void
    {
        DB::transaction(function () use ($model, $imageIds) {
            foreach ($imageIds as $index => $imageId) {
                $model->images()
                    ->where('id', $imageId)
                    ->update(['sort_order' => $index]);
            }
        });
    }

    /**
     * Update image metadata
     */
    public function updateMetadata(Image $image, array $data): bool
    {
        $updateData = [];

        if (isset($data['alt_text'])) {
            $updateData['alt_text'] = $data['alt_text'];
        }

        if (isset($data['title'])) {
            $updateData['title'] = $data['title'];
        }

        if (isset($data['caption'])) {
            $updateData['caption'] = $data['caption'];
        }

        if (isset($data['metadata'])) {
            $updateData['metadata'] = array_merge(
                $image->metadata ?? [],
                $data['metadata']
            );
        }

        return $image->update($updateData);
    }

    /**
     * Get image dimensions from uploaded file
     */
    protected function getImageDimensions(UploadedFile $file): array
    {
        try {
            $imageSize = getimagesize($file->getRealPath());

            return [
                'width' => $imageSize[0] ?? null,
                'height' => $imageSize[1] ?? null,
            ];
        } catch (\Exception $e) {
            return [
                'width' => null,
                'height' => null,
            ];
        }
    }

    /**
     * Get all images for a model
     */
    public function getImages(Model $model, bool $orderedOnly = true)
    {
        $query = $model->images();

        if ($orderedOnly) {
            $query->ordered();
        }

        return $query->get();
    }

    /**
     * Get primary image for a model
     */
    public function getPrimaryImage(Model $model): ?Image
    {
        return $model->images()->primary()->first();
    }

    /**
     * Get image URL or fallback to placeholder
     */
    public function getImageUrl(Model $model, string $placeholder = null): string
    {
        $primaryImage = $this->getPrimaryImage($model);

        if ($primaryImage) {
            return $primaryImage->url;
        }

        return $placeholder ?? config('images.placeholder', 'https://placehold.co/600x400');
    }
}
