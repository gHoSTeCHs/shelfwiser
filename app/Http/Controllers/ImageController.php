<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadImageRequest;
use App\Models\Image;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ImageController extends Controller
{
    public function __construct(
        protected ImageService $imageService
    ) {}

    /**
     * Upload an image for a model
     */
    public function upload(UploadImageRequest $request)
    {
        $modelClass = 'App\\Models\\' . $request->input('model_type');
        $model = $modelClass::findOrFail($request->input('model_id'));

        Gate::authorize('update', $model);

        if ($request->hasFile('images')) {
            $files = is_array($request->file('images'))
                ? $request->file('images')
                : [$request->file('images')];

            $images = $this->imageService->uploadMultiple($model, $files, []);

            return response()->json([
                'message' => 'Images uploaded successfully',
                'images' => $images,
            ], 201);
        }

        if ($request->hasFile('image')) {
            $image = $this->imageService->upload(
                $model,
                $request->file('image'),
                $request->only(['alt_text', 'title', 'caption', 'is_primary'])
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
    public function destroy(Image $image)
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
    public function setPrimary(Image $image)
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
    public function update(Request $request, Image $image)
    {
        Gate::authorize('update', $image);

        $validated = $request->validate([
            'alt_text' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string',
        ]);

        $this->imageService->updateMetadata($image, $validated);

        return response()->json([
            'message' => 'Image updated successfully',
            'image' => $image->fresh(),
        ]);
    }

    /**
     * Reorder images for a model
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'model_type' => 'required|string',
            'model_id' => 'required|integer',
            'image_ids' => 'required|array',
            'image_ids.*' => 'required|integer|exists:images,id',
        ]);

        $modelClass = 'App\\Models\\' . $validated['model_type'];
        $model = $modelClass::findOrFail($validated['model_id']);

        Gate::authorize('update', $model);

        $this->imageService->reorder($model, $validated['image_ids']);

        return response()->json([
            'message' => 'Images reordered successfully',
        ]);
    }
}
