<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UploadImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }

            $modelType = $this->input('model_type');
            $modelId = $this->input('model_id');
            $tenantId = $this->user()?->tenant_id;

            if (! $modelType || ! $modelId || ! $tenantId) {
                return;
            }

            $modelClasses = [
                'Product' => \App\Models\Product::class,
                'ProductVariant' => \App\Models\ProductVariant::class,
                'Service' => \App\Models\Service::class,
            ];

            $modelClass = $modelClasses[$modelType] ?? null;
            if (! $modelClass) {
                return;
            }

            $exists = $modelClass::query()
                ->where('id', $modelId)
                ->where('tenant_id', $tenantId)
                ->exists();

            if (! $exists) {
                $v->errors()->add('model_id', 'The selected model does not belong to your account.');
            }
        });
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
            'model_id' => ['required', 'integer', 'min:1'],
            'image' => [
                'nullable',
                'file',
                'mimes:'.$allowedExtensions,
                'mimetypes:'.$allowedMimeTypes,
                'max:'.$maxFileSize,
                'image',
                $dimensionRule,
            ],
            'images' => ['nullable', 'array', 'max:'.config('images.max_images_per_model', 10)],
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
