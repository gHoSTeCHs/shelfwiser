<?php

namespace App\Http\Requests\Storefront;

use App\Enums\OptionVisualType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreProductOptionRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'display_name' => ['nullable', 'string', 'max:100'],
            'position' => ['required', 'integer', 'min:0'],
            'visual_type' => ['required', 'string', Rule::in(array_column(OptionVisualType::cases(), 'value'))],
            'values' => ['required', 'array', 'min:1'],
            'values.*.label' => ['required', 'string', 'max:100'],
            'values.*.value' => ['required', 'string', 'max:100', 'distinct'],
            'values.*.position' => ['required', 'integer', 'min:0', 'distinct'],
            'values.*.visual_data' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var \App\Models\Product $product */
            $product = $this->route('product');

            if ($product->variants()->exists()) {
                $validator->errors()->add(
                    'name',
                    'Cannot add a new option axis to a product that already has variants. Delete the variants first.'
                );

                return;
            }

            $productType = $product->type;

            if ($productType === null || $productType->option_templates === null) {
                return;
            }

            $maxOptions = $productType->option_templates['max_options'] ?? null;

            if ($maxOptions === null) {
                return;
            }

            $currentCount = $product->options()->count();

            if ($currentCount >= (int) $maxOptions) {
                $validator->errors()->add(
                    'name',
                    "This product type allows a maximum of {$maxOptions} option(s). This product already has {$currentCount}."
                );
            }
        });
    }
}
