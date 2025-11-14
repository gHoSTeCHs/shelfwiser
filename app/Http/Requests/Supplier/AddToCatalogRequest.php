<?php

namespace App\Http\Requests\Supplier;

use App\Enums\CatalogVisibility;
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
        return [
            'product_id' => ['required', 'exists:products,id'],
            'is_available' => ['sometimes', 'boolean'],
            'base_wholesale_price' => ['required', 'numeric', 'min:0'],
            'min_order_quantity' => ['sometimes', 'integer', 'min:1'],
            'visibility' => ['sometimes', Rule::enum(CatalogVisibility::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'pricing_tiers' => ['sometimes', 'array'],
            'pricing_tiers.*.min_quantity' => ['required', 'integer', 'min:1'],
            'pricing_tiers.*.max_quantity' => ['nullable', 'integer', 'gt:pricing_tiers.*.min_quantity'],
            'pricing_tiers.*.price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
