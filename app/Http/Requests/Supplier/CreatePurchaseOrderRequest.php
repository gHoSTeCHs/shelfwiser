<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class CreatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $shop = \App\Models\Shop::find($this->input('shop_id'));

        return $shop && Gate::allows('create', [$shop, $shop]);
    }

    public function rules(): array
    {
        return [
            'supplier_tenant_id' => ['required', 'exists:tenants,id'],
            'shop_id' => ['required', 'exists:shops,id'],
            'expected_delivery_date' => ['nullable', 'date', 'after:today'],
            'buyer_notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.catalog_item_id' => ['required', 'exists:supplier_catalog_items,id'],
            'items.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Purchase order must contain at least one item',
            'items.*.catalog_item_id.exists' => 'Invalid catalog item selected',
            'items.*.product_variant_id.exists' => 'Invalid product variant selected',
        ];
    }
}
