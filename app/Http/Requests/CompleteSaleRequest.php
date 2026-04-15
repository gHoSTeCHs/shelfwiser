<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CompleteSaleRequest extends FormRequest
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
            'items.*.packaging_type_id' => [
                'nullable',
                'integer',
                'exists:product_packaging_types,id,tenant_id,'.$tenantId,
            ],
            'items.*.discount_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id,tenant_id,'.$tenantId],
            'payment_method' => ['required', 'string', Rule::enum(PaymentMethod::class)],
            'amount_tendered' => ['nullable', 'decimal:0,2', 'min:0'],
            'discount_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
