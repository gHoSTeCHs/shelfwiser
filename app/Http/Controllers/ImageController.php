<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderImagesRequest;
use App\Http\Requests\UpdateImageRequest;
use App\Http\Requests\UploadImageRequest;
use App\Models\Image;
use App\Services\ImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ImageController extends Controller
{
    public function __construct(
        protected ImageService $imageService
    ) {}

    /**
     * Upload an image for a model
     */
    public function upload(UploadImageRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $model = $this->imageService->resolveImageable($validated['model_type'], $validated['model_id']);

        Gate::authorize('update', $model);

        if ($request->hasFile('images')) {
            $files = is_array($request->file('images'))
                ? $request->file('images')
                : [$request->file('images')];

            $images = $this->imageService->uploadMultiple($model, $files, $request->user()->tenant_id, []);

            return response()->json([
                'message' => 'Images uploaded successfully',
                'images' => $images,
            ], 201);
        }

        if ($request->hasFile('image')) {
            $image = $this->imageService->upload(
                $model,
                $request->file('image'),
                $request->user()->tenant_id,
                $request->safe()->only(['alt_text', 'title', 'caption', 'is_primary'])
            );

            return response()->json([
                'message' => 'Image uploaded successfully',
                'image' => $image,
            ], 201);
        }

        return response()->json([
            'message' => 'No image file provided',
        ], 422);
    }

    /**
     * Delete an image
     */
    public function destroy(Image $image): JsonResponse
    {
        Gate::authorize('delete', $image);

        $this->imageService->delete($image);

        return response()->json([
            'message' => 'Image deleted successfully',
        ]);
    }

    /**
     * Set an image as primary
     */
    public function setPrimary(Image $image): JsonResponse
    {
        Gate::authorize('update', $image);

        $this->imageService->setPrimary($image);

        return response()->json([
            'message' => 'Primary image updated successfully',
            'image' => $image->fresh(),
        ]);
    }

    /**
     * Update image metadata
     */
    public function update(UpdateImageRequest $request, Image $image): JsonResponse
    {
        Gate::authorize('update', $image);

        $this->imageService->updateMetadata($image, $request->validated());

        return response()->json([
            'message' => 'Image updated successfully',
            'image' => $image->fresh(),
        ]);
    }

    /**
     * Reorder images for a model
     */
    public function reorder(ReorderImagesRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $model = $this->imageService->resolveImageable($validated['model_type'], $validated['model_id']);

        Gate::authorize('update', $model);

        $this->imageService->reorder($model, $validated['image_ids']);

        return response()->json([
            'message' => 'Images reordered successfully',
        ]);
    }
}
