<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Product::class);
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        $rules = [
            'shop_id' => [
                'required',
                Rule::exists('shops', 'id')->where('tenant_id', $tenantId),
            ],
            'product_type_slug' => ['required', 'exists:product_types,slug'],
            'category_id' => [
                'nullable',
                Rule::exists('product_categories', 'id')->where('tenant_id', $tenantId),
            ],
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
                if (! $handler->validate($value)) {
                    $fail('Custom attributes validation failed for product type: '.$productType->label);
                }
            }];
        }

        if ($this->boolean('has_variants')) {
            $rules['variants'] = ['required', 'array', 'min:1'];
            $rules['variants.*.sku'] = [
                'required',
                'string',
                Rule::unique('product_variants', 'sku')
                    ->where(fn ($query) => $query->whereExists(
                        fn ($q) => $q->select(\DB::raw(1))
                            ->from('products')
                            ->whereColumn('products.id', 'product_variants.product_id')
                            ->where('products.tenant_id', $tenantId)
                    )),
            ];
            $rules['variants.*.name'] = ['nullable', 'string'];
            $rules['variants.*.price'] = ['required', 'numeric', 'min:0'];
            $rules['variants.*.cost_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['variants.*.barcode'] = [
                'nullable',
                'string',
                Rule::unique('product_variants', 'barcode')
                    ->where(fn ($query) => $query->whereExists(
                        fn ($q) => $q->select(\DB::raw(1))
                            ->from('products')
                            ->whereColumn('products.id', 'product_variants.product_id')
                            ->where('products.tenant_id', $tenantId)
                    )),
            ];
            $rules['variants.*.attributes'] = ['nullable', 'array'];
            $rules['variants.*.base_unit_name'] = ['required', 'string', 'max:50'];
            $rules['variants.*.packaging_types'] = ['nullable', 'array'];
            $rules['variants.*.packaging_types.*.name'] = ['required', 'string', 'max:100'];
            $rules['variants.*.packaging_types.*.display_name'] = ['nullable', 'string', 'max:100'];
            $rules['variants.*.packaging_types.*.units_per_package'] = ['required', 'integer', 'min:1'];
            $rules['variants.*.packaging_types.*.is_sealed_package'] = ['boolean'];
            $rules['variants.*.packaging_types.*.price'] = ['required', 'numeric', 'min:0'];
            $rules['variants.*.packaging_types.*.cost_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['variants.*.packaging_types.*.is_base_unit'] = ['boolean'];
            $rules['variants.*.packaging_types.*.can_break_down'] = ['boolean'];
            $rules['variants.*.packaging_types.*.min_order_quantity'] = ['nullable', 'integer', 'min:1'];
            $rules['variants.*.packaging_types.*.display_order'] = ['nullable', 'integer', 'min:0'];
        } else {
            $rules['sku'] = [
                'required',
                'string',
                Rule::unique('product_variants', 'sku')
                    ->where(fn ($query) => $query->whereExists(
                        fn ($q) => $q->select(\DB::raw(1))
                            ->from('products')
                            ->whereColumn('products.id', 'product_variants.product_id')
                            ->where('products.tenant_id', $tenantId)
                    )),
            ];
            $rules['price'] = ['required', 'numeric', 'min:0'];
            $rules['cost_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['barcode'] = [
                'nullable',
                'string',
                Rule::unique('product_variants', 'barcode')
                    ->where(fn ($query) => $query->whereExists(
                        fn ($q) => $q->select(\DB::raw(1))
                            ->from('products')
                            ->whereColumn('products.id', 'product_variants.product_id')
                            ->where('products.tenant_id', $tenantId)
                    )),
            ];
            $rules['base_unit_name'] = ['required', 'string', 'max:50'];
            $rules['packaging_types'] = ['nullable', 'array'];
            $rules['packaging_types.*.name'] = ['required', 'string', 'max:100'];
            $rules['packaging_types.*.display_name'] = ['nullable', 'string', 'max:100'];
            $rules['packaging_types.*.units_per_package'] = ['required', 'integer', 'min:1'];
            $rules['packaging_types.*.is_sealed_package'] = ['boolean'];
            $rules['packaging_types.*.price'] = ['required', 'numeric', 'min:0'];
            $rules['packaging_types.*.cost_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['packaging_types.*.is_base_unit'] = ['boolean'];
            $rules['packaging_types.*.can_break_down'] = ['boolean'];
            $rules['packaging_types.*.min_order_quantity'] = ['nullable', 'integer', 'min:1'];
            $rules['packaging_types.*.display_order'] = ['nullable', 'integer', 'min:0'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'shop_id.required' => 'Please select a shop for this product.',
            'shop_id.exists' => 'The selected shop does not exist or is not accessible.',
            'product_type_slug.required' => 'Please select a product type.',
            'product_type_slug.exists' => 'The selected product type does not exist.',
            'category_id.exists' => 'The selected category does not exist in your organization.',
            'name.required' => 'Please provide a name for this product.',
            'name.max' => 'Product name cannot exceed 255 characters.',
            'variants.required' => 'Please add at least one variant for this product.',
            'variants.min' => 'Please add at least one variant for this product.',
            'variants.*.sku.required' => 'SKU is required for each variant.',
            'variants.*.sku.unique' => 'This SKU is already in use. Please choose a unique SKU.',
            'variants.*.price.required' => 'Selling price is required for each variant.',
            'variants.*.price.min' => 'Selling price cannot be negative.',
            'variants.*.cost_price.min' => 'Cost price cannot be negative.',
            'variants.*.barcode.unique' => 'This barcode is already assigned to another product.',
            'variants.*.base_unit_name.required' => 'Base unit name is required for each variant.',
            'variants.*.packaging_types.*.units_per_package.required' => 'Units per package is required.',
            'variants.*.packaging_types.*.units_per_package.min' => 'Units per package must be at least 1.',
            'sku.required' => 'Please provide a SKU (Stock Keeping Unit) for this product.',
            'sku.unique' => 'This SKU is already in use. Please choose a unique SKU.',
            'price.required' => 'Please enter the selling price.',
            'price.min' => 'Selling price cannot be negative.',
            'cost_price.min' => 'Cost price cannot be negative.',
            'barcode.unique' => 'This barcode is already assigned to another product.',
            'base_unit_name.required' => 'Please specify the base unit name (e.g., piece, kg, liter).',
        ];
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
