<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HoldSaleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to hold sales.
     * Users must have process_orders permission to hold sales at POS.
     */
    public function authorize(): bool
    {
        return $this->user()->role->hasPermission('process_orders');
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
            'items.required' => 'Cannot hold an empty cart. Please add items before holding.',
            'items.min' => 'Cannot hold an empty cart. Please add at least one item.',
            'items.*.variant_id.required' => 'Each item must have a valid product variant.',
            'items.*.variant_id.exists' => 'One or more products are no longer available.',
            'items.*.name.required' => 'Product name is required for each item.',
            'items.*.sku.required' => 'Product SKU is required for each item.',
            'items.*.quantity.required' => 'Please specify the quantity for each item.',
            'items.*.quantity.min' => 'Item quantity must be at least 0.01.',
            'items.*.unit_price.required' => 'Unit price is required for each item.',
            'items.*.unit_price.min' => 'Item price cannot be negative.',
            'items.*.packaging_type_id.exists' => 'The selected packaging type is invalid.',
            'customer_id.exists' => 'The selected customer does not exist.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
        ];
    }
}
