<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveProductAsTemplateRequest extends FormRequest
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
            'images' => ['nullable', 'array'],
            'has_variants' => ['boolean'],
        ];
    }
}
