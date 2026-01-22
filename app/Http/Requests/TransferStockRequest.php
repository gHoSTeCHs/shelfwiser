<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransferStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('transferStock', \App\Models\StockMovement::class);
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
            'from_location_id' => [
                'bail',
                'required',
                Rule::exists('inventory_locations', 'id')->where('tenant_id', $tenantId),
                'different:to_location_id',
            ],
            'to_location_id' => [
                'bail',
                'required',
                Rule::exists('inventory_locations', 'id')->where('tenant_id', $tenantId),
                'different:from_location_id',
            ],
            'quantity' => ['bail', 'required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_variant_id.required' => 'Please select a product variant.',
            'product_variant_id.exists' => 'The selected product variant is invalid.',
            'from_location_id.required' => 'Source location is required.',
            'from_location_id.exists' => 'The selected source location is invalid.',
            'from_location_id.different' => 'Source and destination locations must be different.',
            'to_location_id.required' => 'Destination location is required.',
            'to_location_id.exists' => 'The selected destination location is invalid.',
            'to_location_id.different' => 'Source and destination locations must be different.',
            'quantity.required' => 'Quantity is required.',
            'quantity.min' => 'Quantity must be at least 1.',
        ];
    }
}
