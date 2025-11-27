<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadImageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $allowedMimeTypes = implode(',', config('images.allowed_mime_types'));
        $allowedExtensions = implode(',', config('images.allowed_extensions'));
        $maxFileSize = config('images.max_file_size');

        return [
            'model_type' => 'required|string|in:Product,ProductVariant,Service,User',
            'model_id' => 'required|integer',
            'image' => "nullable|file|mimes:{$allowedExtensions}|max:{$maxFileSize}",
            'images' => 'nullable|array',
            'images.*' => "file|mimes:{$allowedExtensions}|max:{$maxFileSize}",
            'alt_text' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string',
            'is_primary' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'image.mimes' => 'The image must be a file of type: '.implode(', ', config('images.allowed_extensions')),
            'image.max' => 'The image may not be greater than '.(config('images.max_file_size') / 1024).' MB.',
            'images.*.mimes' => 'Each image must be a file of type: '.implode(', ', config('images.allowed_extensions')),
            'images.*.max' => 'Each image may not be greater than '.(config('images.max_file_size') / 1024).' MB.',
        ];
    }
}
