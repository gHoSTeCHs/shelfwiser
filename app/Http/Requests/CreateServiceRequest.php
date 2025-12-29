<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateServiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Service::class);
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        $rules = [
            'shop_id' => [
                'required',
                Rule::exists('shops', 'id')->where('tenant_id', $tenantId),
            ],
            'service_category_id' => [
                'nullable',
                Rule::exists('service_categories', 'id')->where('tenant_id', $tenantId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'url', 'max:500'],
            'has_material_options' => ['boolean'],
            'is_active' => ['boolean'],
            'is_available_online' => ['boolean'],
        ];

        // Variants are required
        $rules['variants'] = ['required', 'array', 'min:1'];
        $rules['variants.*.name'] = ['required', 'string', 'max:255'];
        $rules['variants.*.description'] = ['nullable', 'string'];
        $rules['variants.*.base_price'] = ['required', 'numeric', 'min:0'];
        $rules['variants.*.estimated_duration_minutes'] = ['nullable', 'integer', 'min:1'];
        $rules['variants.*.sort_order'] = ['nullable', 'integer', 'min:0'];
        $rules['variants.*.is_active'] = ['boolean'];

        // If has_material_options is true, validate material pricing
        if ($this->boolean('has_material_options')) {
            $rules['variants.*.customer_materials_price'] = ['nullable', 'numeric', 'min:0'];
            $rules['variants.*.shop_materials_price'] = ['nullable', 'numeric', 'min:0'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'shop_id.required' => 'Please select a shop for this service.',
            'shop_id.exists' => 'The selected shop does not exist.',
            'name.required' => 'Service name is required.',
            'variants.required' => 'At least one service variant is required.',
            'variants.min' => 'At least one service variant is required.',
            'variants.*.name.required' => 'Each variant must have a name.',
            'variants.*.base_price.required' => 'Each variant must have a base price.',
        ];
    }
}
