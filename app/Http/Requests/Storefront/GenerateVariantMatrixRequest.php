<?php

namespace App\Http\Requests\Storefront;

use App\Models\ProductOptionValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class GenerateVariantMatrixRequest extends FormRequest
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
        return [
            'option_axes' => ['required', 'array', 'min:1'],
            'option_axes.*' => ['required', 'array', 'min:1'],
            'option_axes.*.*' => ['required', 'integer', Rule::exists('product_option_values', 'id')],
            'defaults' => ['required', 'array'],
            'defaults.price' => ['required', 'numeric', 'min:0'],
            'defaults.cost_price' => ['nullable', 'numeric', 'min:0'],
            'defaults.stock_quantity' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $product = $this->route('product');

        $validator->after(function (Validator $validator) use ($product): void {
            $submittedIds = collect($this->input('option_axes', []))
                ->flatten()
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (empty($submittedIds)) {
                return;
            }

            $validIds = ProductOptionValue::query()
                ->whereHas('option', fn ($q) => $q->where('product_id', $product->id))
                ->whereIn('id', $submittedIds)
                ->pluck('id')
                ->all();

            $invalidIds = array_diff($submittedIds, $validIds);

            if (! empty($invalidIds)) {
                $validator->errors()->add('option_axes', 'One or more option values do not belong to this product.');
            }
        });
    }
}
