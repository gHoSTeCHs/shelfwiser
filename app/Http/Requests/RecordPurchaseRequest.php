<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', \App\Models\Product::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'product_variant_id' => [
                'bail',
                'required',
                Rule::exists('product_variants', 'id')
                    ->where(fn ($query) => $query->whereIn(
                        'product_id',
                        \App\Models\Product::where('tenant_id', $tenantId)->select('id')
                    )),
            ],
            'location_id' => [
                'bail',
                'required',
                Rule::exists('inventory_locations', 'id')->where('tenant_id', $tenantId),
            ],
            'product_packaging_type_id' => [
                'bail',
                'required',
                Rule::exists('product_packaging_types', 'id')
                    ->where(fn ($query) => $query->whereIn(
                        'product_variant_id',
                        \App\Models\ProductVariant::whereIn(
                            'product_id',
                            \App\Models\Product::where('tenant_id', $tenantId)->select('id')
                        )->select('id')
                    )),
            ],
            'package_quantity' => ['bail', 'required', 'integer', 'min:1'],
            'cost_per_package' => ['bail', 'required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_variant_id.required' => 'Please select a product.',
            'location_id.required' => 'Please select a storage location.',
            'product_packaging_type_id.required' => 'Please select how you purchased this product.',
            'package_quantity.required' => 'Please enter the quantity purchased.',
            'package_quantity.min' => 'Quantity must be at least 1.',
            'cost_per_package.required' => 'Please enter the cost per package.',
            'cost_per_package.min' => 'Cost must be greater than or equal to 0.',
        ];
    }
}
