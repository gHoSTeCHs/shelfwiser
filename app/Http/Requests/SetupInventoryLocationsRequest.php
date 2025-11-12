<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SetupInventoryLocationsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'shop_ids' => ['required', 'array', 'min:1'],
            'shop_ids.*' => ['required', 'integer', 'exists:shops,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'shop_ids.required' => 'Please select at least one location. id issue',
            'shop_ids.array' => 'The shop IDs must be an array.',
            'shop_ids.min' => 'Please select at least one location.',
            'shop_ids.*.required' => 'Each shop ID is required.',
            'shop_ids.*.integer' => 'Each shop ID must be a valid number. not id issue',
            'shop_ids.*.exists' => 'One or more selected shops do not exist.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'shop_ids' => 'locations',
            'shop_ids.*' => 'location',
        ];
    }
}
