<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'variants.*.sku' => [
                'nullable',
                'string',
                Rule::unique('product_variants', 'sku')->where(
                    fn ($query) => $query->whereIn(
                        'product_id',
                        \App\Models\Product::query()
                            ->where('tenant_id', $this->user()->tenant_id)
                            ->select('id')
                    )
                ),
            ],
            'variants.*.barcode' => ['nullable', 'string'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.packaging_types' => ['nullable', 'array'],
            'variants.*.packaging_types.*.name' => ['required', 'string', 'max:100'],
            'variants.*.packaging_types.*.display_name' => ['nullable', 'string', 'max:100'],
            'variants.*.packaging_types.*.units_per_package' => ['required', 'integer', 'min:1'],
            'variants.*.packaging_types.*.is_sealed_package' => ['boolean'],
            'variants.*.packaging_types.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.packaging_types.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.packaging_types.*.is_base_unit' => ['boolean'],
            'variants.*.packaging_types.*.can_break_down' => ['boolean'],
            'variants.*.packaging_types.*.min_order_quantity' => ['nullable', 'integer', 'min:1'],
            'variants.*.packaging_types.*.display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
