<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('order'));
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_variant_id' => [
                'required',
                Rule::exists('product_variants', 'id')
                    ->where(fn ($query) => $query->whereIn(
                        'product_id',
                        \App\Models\Product::where('tenant_id', $tenantId)->select('id')
                    )),
            ],
            'items.*.product_packaging_type_id' => [
                'nullable',
                Rule::exists('product_packaging_types', 'id')
                    ->where(fn ($query) => $query->whereIn(
                        'product_variant_id',
                        \App\Models\ProductVariant::whereIn(
                            'product_id',
                            \App\Models\Product::where('tenant_id', $tenantId)->select('id')
                        )->select('id')
                    )),
            ],
            'items.*.package_quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_amount' => ['nullable', 'numeric', 'min:0'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'customer_notes' => ['nullable', 'string'],
            'internal_notes' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'billing_address' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.min' => 'Order must contain at least one item.',
            'items.*.product_variant_id.required' => 'Each item must have a product variant.',
            'items.*.product_variant_id.exists' => 'One or more selected products are no longer available.',
            'items.*.product_packaging_type_id.exists' => 'One or more selected packaging types are invalid.',
            'items.*.quantity.required' => 'Please specify the quantity for each item.',
            'items.*.quantity.min' => 'Item quantity must be at least 1.',
            'items.*.unit_price.min' => 'Item price cannot be negative.',
            'items.*.discount_amount.min' => 'Discount amount cannot be negative.',
            'items.*.tax_amount.min' => 'Tax amount cannot be negative.',
            'shipping_cost.min' => 'Shipping cost cannot be negative.',
        ];
    }
}
