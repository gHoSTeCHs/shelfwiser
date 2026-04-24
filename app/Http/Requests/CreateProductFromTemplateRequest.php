<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductFromTemplateRequest extends FormRequest
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
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'custom_attributes' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'variants' => ['required', 'array'],
            'variants.*.sku' => ['nullable', 'string', 'unique:product_variants,sku'],
            'variants.*.barcode' => ['nullable', 'string'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.packaging_types' => ['nullable', 'array'],
            'variants.*.packaging_types.*.price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
