<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
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
        return [
            'service_category_id' => ['nullable', 'exists:service_categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'url', 'max:500'],
            'has_material_options' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'is_available_online' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'service_category_id.exists' => 'The selected service category does not exist.',
            'name.required' => 'Service name is required.',
            'image_url.url' => 'The image URL must be a valid URL.',
        ];
    }
}
