<?php

namespace App\Http\Requests;

use App\Models\ProductOptionValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('variant'));
    }

    public function rules(): array
    {
        $variant = $this->route('variant');
        $tenantId = $this->user()->tenant_id;

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('product_variants', 'sku')
                    ->ignore($variant->id)
                    ->where(fn ($query) => $query->whereExists(
                        fn ($q) => $q->select(\DB::raw(1))
                            ->from('products')
                            ->whereColumn('products.id', 'product_variants.product_id')
                            ->where('products.tenant_id', $tenantId)
                    )),
            ],
            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'barcode')
                    ->ignore($variant->id)
                    ->where(fn ($query) => $query->whereExists(
                        fn ($q) => $q->select(\DB::raw(1))
                            ->from('products')
                            ->whereColumn('products.id', 'product_variants.product_id')
                            ->where('products.tenant_id', $tenantId)
                    )),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'base_unit_name' => ['nullable', 'string', 'max:50'],
            'attributes' => ['nullable', 'array'],
            'batch_number' => ['nullable', 'string', 'max:100'],
            'expiry_date' => ['nullable', 'date'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'is_available_online' => ['boolean'],
            'max_order_quantity' => ['nullable', 'integer', 'min:0'],
            'option_value_ids' => ['sometimes', 'array'],
            'option_value_ids.*' => ['integer', Rule::exists('product_option_values', 'id')],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'sku.required' => 'Please provide a SKU (Stock Keeping Unit) for this variant.',
            'sku.unique' => 'This SKU is already in use. Please choose a unique SKU.',
            'barcode.unique' => 'This barcode is already assigned to another product variant.',
            'price.required' => 'Please enter the selling price for this variant.',
            'price.min' => 'Selling price cannot be negative.',
            'cost_price.min' => 'Cost price cannot be negative.',
            'reorder_level.min' => 'Reorder level cannot be negative.',
            'base_unit_name.max' => 'Base unit name cannot exceed 50 characters.',
            'expiry_date.date' => 'Please provide a valid expiry date.',
            'max_order_quantity.min' => 'Maximum order quantity cannot be negative.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $variant = $this->route('variant');

        $validator->after(function (Validator $validator) use ($variant): void {
            $submittedIds = $this->input('option_value_ids', []);

            if (empty($submittedIds)) {
                return;
            }

            $validIds = ProductOptionValue::query()
                ->whereHas('option', fn ($q) => $q->where('product_id', $variant->product_id))
                ->whereIn('id', $submittedIds)
                ->pluck('id')
                ->all();

            $invalidIds = array_diff($submittedIds, $validIds);

            if (! empty($invalidIds)) {
                $validator->errors()->add('option_value_ids', 'One or more option values do not belong to this product.');
            }
        });
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'sku' => 'SKU',
            'price' => 'selling price',
            'cost_price' => 'cost price',
            'reorder_level' => 'reorder level',
            'base_unit_name' => 'base unit name',
            'is_active' => 'active status',
            'is_available_online' => 'online availability',
            'max_order_quantity' => 'maximum order quantity',
        ];
    }
}
