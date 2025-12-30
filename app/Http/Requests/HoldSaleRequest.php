<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HoldSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.name' => ['required', 'string'],
            'items.*.sku' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.packaging_type_id' => ['nullable', 'integer', 'exists:product_packaging_types,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Cannot hold an empty cart.',
            'items.min' => 'Cannot hold an empty cart.',
            'items.*.variant_id.required' => 'Each item must have a valid product variant.',
            'items.*.variant_id.exists' => 'One or more products are no longer available.',
            'items.*.quantity.min' => 'Item quantity must be at least 0.01.',
            'items.*.unit_price.min' => 'Item price cannot be negative.',
        ];
    }
}
