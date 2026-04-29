<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdminProductTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'product_type_id' => ['required', 'exists:product_types,id'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'custom_attributes' => ['nullable', 'array'],
            'template_structure' => ['required', 'array'],
            'template_structure.variants' => ['required', 'array', 'min:1'],
            'template_structure.variants.*.name' => ['required', 'string'],
            'template_structure.variants.*.attributes' => ['nullable', 'array'],
            'template_structure.variants.*.packaging_types' => ['nullable', 'array'],
            'images' => ['nullable', 'array'],
            'seo_metadata' => ['nullable', 'array'],
            'has_variants' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
