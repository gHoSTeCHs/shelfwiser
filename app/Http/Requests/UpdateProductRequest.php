<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => [
                'nullable',
                Rule::exists('product_categories', 'id')->where('tenant_id', $tenantId),
            ],
            'product_type_slug' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'has_variants' => ['sometimes', 'boolean'],
            'size_guide' => ['nullable', 'string'],
        ];

        if ($this->has('custom_attributes') && $this->route('product')->type !== null) {
            $productType = $this->getProductType();
            $rules['custom_attributes'] = ['nullable', 'array', function ($attribute, $value, $fail) use ($productType) {
                if (empty($value)) {
                    return;
                }
                $handler = \App\Services\ProductConfigHandlerFactory::make($productType);
                if (! $handler->validate($value)) {
                    $fail('Custom attributes validation failed for product type: '.$productType->label);
                }
            }];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please provide a name for this product.',
            'name.max' => 'Product name cannot exceed 255 characters.',
            'category_id.exists' => 'The selected category does not exist in your organization.',
        ];
    }

    protected function getProductType(): \App\Models\ProductType
    {
        return $this->route('product')->type;
    }
}
