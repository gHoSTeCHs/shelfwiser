<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateServiceVariantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $service = $this->route('service');

        return $this->user()->can('manage', $service);
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $service = $this->route('service');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'estimated_duration_minutes' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];

        // If service has material options, require material pricing
        if ($service && $service->has_material_options) {
            $rules['customer_materials_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['shop_materials_price'] = ['nullable', 'numeric', 'min:0'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Variant name is required.',
            'base_price.required' => 'Base price is required.',
            'base_price.min' => 'Base price must be at least 0.',
        ];
    }
}
