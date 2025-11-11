<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockTakeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('stockTake', \App\Models\StockMovement::class);
    }

    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'exists:product_variants,id'],
            'inventory_location_id' => ['required', 'exists:inventory_locations,id'],
            'actual_quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_variant_id.required' => 'Please select a product variant.',
            'product_variant_id.exists' => 'The selected product variant is invalid.',
            'inventory_location_id.required' => 'Please select an inventory location.',
            'inventory_location_id.exists' => 'The selected inventory location is invalid.',
            'actual_quantity.required' => 'Actual quantity is required.',
            'actual_quantity.min' => 'Actual quantity cannot be negative.',
        ];
    }
}
