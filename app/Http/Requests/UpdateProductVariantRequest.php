<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductVariantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('variant'));
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $variant = $this->route('variant');

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku,' . $variant->id],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:product_variants,barcode,' . $variant->id],
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
