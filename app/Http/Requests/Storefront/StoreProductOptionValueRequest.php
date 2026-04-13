<?php

namespace App\Http\Requests\Storefront;

use App\Models\ProductOptionValue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProductOptionValueRequest extends FormRequest
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
            'label' => ['required', 'string', 'max:100'],
            'value' => ['required', 'string', 'max:100'],
            'position' => ['required', 'integer', 'min:0'],
            'visual_data' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $option = $this->route('option');

        $validator->after(function (Validator $validator) use ($option): void {
            $value = $this->input('value');

            if ($value === null) {
                return;
            }

            $exists = ProductOptionValue::query()
                ->where('product_option_id', $option->id)
                ->where('value', $value)
                ->exists();

            if ($exists) {
                $validator->errors()->add('value', 'This value already exists for the option.');
            }
        });
    }
}
