<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreStockTakeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'counts' => ['required', 'array'],
            'counts.*.variant_id' => [
                'required',
                'integer',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->whereIn(
                        'product_id',
                        DB::table('products')->where('tenant_id', $tenantId)->select('id')
                    )
                ),
            ],
            'counts.*.location_id' => ['required', 'integer', 'exists:inventory_locations,id,tenant_id,'.$tenantId],
            'counts.*.physical_count' => ['required', 'integer', 'min:0'],
            'counts.*.system_count' => ['required', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
