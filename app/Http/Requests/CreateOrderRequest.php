<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Order::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'shop_id' => [
                'required',
                Rule::exists('shops', 'id')->where('tenant_id', $tenantId),
            ],
            'customer_id' => [
                'nullable',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
            ],
            'items' => ['required', 'array', 'min:1'],
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
            'items.required' => 'At least one item must be added to the order.',
            'items.*.product_variant_id.required' => 'Product variant is required for each item.',
            'items.*.product_variant_id.exists' => 'Selected product variant does not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be at least 1.',
        ];
    }
}
