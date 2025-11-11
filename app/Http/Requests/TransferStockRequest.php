<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('transferStock', \App\Models\StockMovement::class);
    }

    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'exists:product_variants,id'],
            'from_location_id' => ['required', 'exists:inventory_locations,id', 'different:to_location_id'],
            'to_location_id' => ['required', 'exists:inventory_locations,id', 'different:from_location_id'],
            'quantity' => ['required', 'integer', 'min:1'],
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
