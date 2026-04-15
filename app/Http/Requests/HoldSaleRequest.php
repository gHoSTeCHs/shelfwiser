<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HoldSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => [
                'required',
                'integer',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->whereIn(
                        'product_id',
                        DB::table('products')->where('tenant_id', $tenantId)->select('id')
                    )
                ),
            ],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.packaging_type_id' => ['nullable', 'integer', 'exists:product_packaging_types,id,tenant_id,'.$tenantId],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id,tenant_id,'.$tenantId],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Cannot hold an empty cart. Please add items before holding.',
            'items.min' => 'Cannot hold an empty cart. Please add at least one item.',
            'items.*.variant_id.required' => 'Each item must have a valid product variant.',
            'items.*.variant_id.exists' => 'One or more products are no longer available.',
            'items.*.quantity.required' => 'Please specify the quantity for each item.',
            'items.*.quantity.min' => 'Item quantity must be at least 0.01.',
            'items.*.packaging_type_id.exists' => 'The selected packaging type is invalid.',
            'customer_id.exists' => 'The selected customer does not exist.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
        ];
    }
}
