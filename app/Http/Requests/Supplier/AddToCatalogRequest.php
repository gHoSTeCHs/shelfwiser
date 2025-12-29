<?php

namespace App\Http\Requests\Supplier;

use App\Enums\CatalogVisibility;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AddToCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('manageCatalog', auth()->user()->tenant);
    }

    public function rules(): array
    {
        $tenantId = auth()->user()->tenant_id;

        return [
            'product_id' => [
                'bail',
                'required',
                Rule::exists('products', 'id')->where(function ($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                }),
            ],
            'is_available' => ['sometimes', 'boolean'],
            'base_wholesale_price' => ['bail', 'required', 'numeric', 'min:0'],
            'min_order_quantity' => ['sometimes', 'integer', 'min:1'],
            'visibility' => ['sometimes', Rule::enum(CatalogVisibility::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'pricing_tiers' => ['sometimes', 'array'],
            'pricing_tiers.*.min_quantity' => ['bail', 'required', 'integer', 'min:1'],
            'pricing_tiers.*.max_quantity' => ['nullable', 'integer', 'gt:pricing_tiers.*.min_quantity'],
            'pricing_tiers.*.price' => ['bail', 'required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.exists' => 'The selected product does not exist or does not belong to your organization.',
        ];
    }
}
