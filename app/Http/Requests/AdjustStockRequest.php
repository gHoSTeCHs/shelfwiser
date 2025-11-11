<?php

namespace App\Http\Requests;

use App\Enums\StockMovementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('adjustStock', \App\Models\StockMovement::class);
    }

    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'exists:product_variants,id'],
            'inventory_location_id' => ['required', 'exists:inventory_locations,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'type' => [
                'required',
                Rule::in([
                    StockMovementType::ADJUSTMENT_IN->value,
                    StockMovementType::ADJUSTMENT_OUT->value,
                    StockMovementType::DAMAGE->value,
                    StockMovementType::LOSS->value,
                    StockMovementType::RETURN->value,
                ]),
            ],
            'reason' => ['nullable', 'string', 'max:500'],
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
            'quantity.required' => 'Quantity is required.',
            'quantity.min' => 'Quantity must be at least 1.',
            'type.required' => 'Adjustment type is required.',
            'type.in' => 'Invalid adjustment type selected.',
        ];
    }
}
