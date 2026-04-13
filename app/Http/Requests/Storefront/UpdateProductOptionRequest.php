<?php

namespace App\Http\Requests\Storefront;

use App\Enums\OptionVisualType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductOptionRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'display_name' => ['nullable', 'string', 'max:100'],
            'position' => ['sometimes', 'required', 'integer', 'min:0'],
            'visual_type' => ['sometimes', 'required', 'string', Rule::in(array_column(OptionVisualType::cases(), 'value'))],
            'values' => ['sometimes', 'required', 'array', 'min:1'],
            'values.*.label' => ['required_with:values', 'string', 'max:100'],
            'values.*.value' => ['required_with:values', 'string', 'max:100', 'distinct'],
            'values.*.position' => ['required_with:values', 'integer', 'min:0', 'distinct'],
            'values.*.visual_data' => ['nullable', 'array'],
        ];
    }
}
