<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddToCartApiRequest extends FormRequest
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
        $tenantId = $this->route('shop')->tenant_id;

        return [
            'variant_id' => [
                'required',
                'integer',
                Rule::exists('product_variants', 'id')->where(function ($query) use ($tenantId) {
                    $query->whereIn('product_id', function ($sub) use ($tenantId) {
                        $sub->select('id')->from('products')->where('tenant_id', $tenantId);
                    });
                }),
            ],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'packaging_type_id' => ['nullable', 'integer', Rule::exists('product_packaging_types', 'id')->where('tenant_id', $tenantId)],
        ];
    }
}
