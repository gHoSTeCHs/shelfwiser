<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Product::class);
    }

    public function rules(): array
    {
        $rules = [
            'shop_id' => ['required', 'exists:shops,id'],
            'product_type_slug' => ['required', 'exists:product_types,slug'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'has_variants' => ['boolean'],
        ];

        if ($this->has('custom_attributes') && $this->has('product_type_slug')) {
            $productType = $this->getProductType();
            $rules['custom_attributes'] = ['nullable', 'array', function ($attribute, $value, $fail) use ($productType) {
                if (empty($value)) {
                    return;
                }
                $handler = \App\Services\ProductConfigHandlerFactory::make($productType);
                if (!$handler->validate($value)) {
                    $fail('Custom attributes validation failed for product type: ' . $productType->label);
                }
            }];
        }

        if ($this->boolean('has_variants')) {
            $rules['variants'] = ['required', 'array', 'min:1'];
            $rules['variants.*.sku'] = ['required', 'string', 'unique:product_variants,sku'];
            $rules['variants.*.name'] = ['nullable', 'string'];
            $rules['variants.*.price'] = ['required', 'numeric', 'min:0'];
            $rules['variants.*.cost_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['variants.*.barcode'] = ['nullable', 'string', 'unique:product_variants,barcode'];
            $rules['variants.*.attributes'] = ['nullable', 'array'];
        } else {
            $rules['sku'] = ['required', 'string', 'unique:product_variants,sku'];
            $rules['price'] = ['required', 'numeric', 'min:0'];
            $rules['cost_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['barcode'] = ['nullable', 'string', 'unique:product_variants,barcode'];
        }

        return $rules;
    }

    protected function getProductType(): \App\Models\ProductType
    {
        $tenantId = $this->user()->tenant_id;
        $slug = $this->input('product_type_slug');

        $cacheKey = "tenant:{$tenantId}:product_type:slug:{$slug}";

        return \Illuminate\Support\Facades\Cache::tags(["tenant:{$tenantId}:product_types"])
            ->remember($cacheKey, 3600, function () use ($tenantId, $slug) {
                return \App\Models\ProductType::accessibleTo($tenantId)
                    ->where('slug', $slug)
                    ->firstOrFail();
            });
    }
}
