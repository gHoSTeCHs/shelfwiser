<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockTakeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'counts' => ['required', 'array'],
            'counts.*.variant_id' => ['required', 'exists:product_variants,id'],
            'counts.*.location_id' => ['required', 'exists:inventory_locations,id'],
            'counts.*.physical_count' => ['required', 'integer', 'min:0'],
            'counts.*.system_count' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
