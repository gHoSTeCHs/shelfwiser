<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockMovementExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'variant_id' => [
                'nullable',
                'integer',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->whereIn(
                        'product_id',
                        DB::table('products')->where('tenant_id', $tenantId)->select('id')
                    )
                ),
            ],
        ];
    }
}
