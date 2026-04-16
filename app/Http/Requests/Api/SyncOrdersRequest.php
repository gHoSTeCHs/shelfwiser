<?php

namespace App\Http\Requests\Api;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncOrdersRequest extends FormRequest
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
            'orders' => ['required', 'array'],
            'orders.*.offline_id' => ['required', 'string'],
            'orders.*.shop_id' => [
                'required',
                'integer',
                Rule::exists('shops', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'orders.*.items' => ['required', 'array'],
            'orders.*.items.*.variant_id' => [
                'required',
                'integer',
                Rule::exists('product_variants', 'id')->where(fn ($q) => $q
                    ->whereIn('product_id', fn ($sub) => $sub
                        ->select('id')
                        ->from('products')
                        ->where('tenant_id', $tenantId)
                    )
                ),
            ],
            'orders.*.items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'orders.*.items.*.unit_price' => ['required', 'decimal:0,2', 'min:0'],
            'orders.*.items.*.packaging_type_id' => ['nullable', 'integer', 'exists:product_packaging_types,id'],
            'orders.*.items.*.discount_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'orders.*.customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'orders.*.payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'orders.*.amount_tendered' => ['nullable', 'decimal:0,2', 'min:0'],
            'orders.*.discount_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'orders.*.notes' => ['nullable', 'string'],
            'orders.*.created_at' => ['required', 'date'],
        ];
    }
}
