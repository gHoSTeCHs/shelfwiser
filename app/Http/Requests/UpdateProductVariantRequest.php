<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('variant'));
    }

    public function rules(): array
    {
        $variant = $this->route('variant');
        $tenantId = $this->user()->tenant_id;

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('product_variants', 'sku')
                    ->ignore($variant->id)
                    ->where(fn ($query) => $query->whereIn(
                        'product_id',
                        \App\Models\Product::where('tenant_id', $tenantId)->select('id')
                    )),
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'barcode')
                    ->ignore($variant->id)
                    ->where(fn ($query) => $query->whereIn(
                        'product_id',
                        \App\Models\Product::where('tenant_id', $tenantId)->select('id')
                    )),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'base_unit_name' => ['nullable', 'string', 'max:50'],
            'attributes' => ['nullable', 'array'],
            'batch_number' => ['nullable', 'string', 'max:100'],
            'expiry_date' => ['nullable', 'date'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'is_available_online' => ['boolean'],
            'max_order_quantity' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'sku' => 'SKU',
            'price' => 'selling price',
            'cost_price' => 'cost price',
            'reorder_level' => 'reorder level',
            'base_unit_name' => 'base unit name',
            'is_active' => 'active status',
            'is_available_online' => 'online availability',
            'max_order_quantity' => 'maximum order quantity',
        ];
    }
}
