<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('product'));
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'is_active' => ['sometimes', 'boolean'],
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
