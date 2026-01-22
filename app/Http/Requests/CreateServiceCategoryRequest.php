<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateServiceCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        return $this->user()->role->hasPermission('manage_inventory');
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'parent_id' => [
                'nullable',
                Rule::exists('service_categories', 'id')->where('tenant_id', $tenantId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                "unique:service_categories,slug,NULL,id,tenant_id,{$tenantId}",
            ],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Category name is required.',
            'slug.required' => 'Category slug is required.',
            'slug.regex' => 'Category slug must be lowercase letters, numbers, and hyphens only.',
            'slug.unique' => 'This category slug already exists in your organization.',
            'parent_id.exists' => 'The selected parent category does not exist.',
        ];
    }
}
