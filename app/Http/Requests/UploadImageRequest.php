<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! auth()->check()) {
            return false;
        }

        $modelType = $this->input('model_type');
        $modelId = $this->input('model_id');

        if (! $modelType || ! $modelId) {
            return false;
        }

        $tenantId = auth()->user()->tenant_id;

        return match ($modelType) {
            'Product' => \App\Models\Product::where('id', $modelId)
                ->where('tenant_id', $tenantId)
                ->exists(),
            'ProductVariant' => \App\Models\ProductVariant::where('id', $modelId)
                ->whereHas('product', fn ($q) => $q->where('tenant_id', $tenantId))
                ->exists(),
            'Service' => \App\Models\Service::where('id', $modelId)
                ->where('tenant_id', $tenantId)
                ->exists(),
            'User' => \App\Models\User::where('id', $modelId)
                ->where('tenant_id', $tenantId)
                ->exists(),
            default => false,
        };
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $allowedMimeTypes = implode(',', config('images.allowed_mime_types'));
        $allowedExtensions = implode(',', config('images.allowed_extensions'));
        $maxFileSize = config('images.max_file_size');
        $dimensions = config('images.dimensions');

        $dimensionRule = sprintf(
            'dimensions:min_width=%d,min_height=%d,max_width=%d,max_height=%d',
            $dimensions['min_width'],
            $dimensions['min_height'],
            $dimensions['max_width'],
            $dimensions['max_height']
        );

        return [
            'model_type' => ['required', 'string', 'in:Product,ProductVariant,Service,User'],
            'model_id' => ['required', 'integer'],
            'image' => [
                'nullable',
                'file',
                'mimes:'.$allowedExtensions,
                'mimetypes:'.$allowedMimeTypes,
                'max:'.$maxFileSize,
                'image',
                $dimensionRule,
            ],
            'images' => ['nullable', 'array'],
            'images.*' => [
                'file',
                'mimes:'.$allowedExtensions,
                'mimetypes:'.$allowedMimeTypes,
                'max:'.$maxFileSize,
                'image',
                $dimensionRule,
            ],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string'],
            'is_primary' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        $dimensions = config('images.dimensions');
        $maxSizeMB = config('images.max_file_size') / 1024;

        return [
            'image.mimes' => 'The image file extension must be one of: '.implode(', ', config('images.allowed_extensions')).'.',
            'image.mimetypes' => 'The image file content must be a valid image type.',
            'image.max' => sprintf('The image may not be greater than %.1f MB.', $maxSizeMB),
            'image.image' => 'The file must be a valid image.',
            'image.dimensions' => sprintf(
                'The image dimensions must be between %dx%d and %dx%d pixels.',
                $dimensions['min_width'],
                $dimensions['min_height'],
                $dimensions['max_width'],
                $dimensions['max_height']
            ),
            'images.*.mimes' => 'Each image file extension must be one of: '.implode(', ', config('images.allowed_extensions')).'.',
            'images.*.mimetypes' => 'Each image file content must be a valid image type.',
            'images.*.max' => sprintf('Each image may not be greater than %.1f MB.', $maxSizeMB),
            'images.*.image' => 'Each file must be a valid image.',
            'images.*.dimensions' => sprintf(
                'Each image dimensions must be between %dx%d and %dx%d pixels.',
                $dimensions['min_width'],
                $dimensions['min_height'],
                $dimensions['max_width'],
                $dimensions['max_height']
            ),
        ];
    }
}
