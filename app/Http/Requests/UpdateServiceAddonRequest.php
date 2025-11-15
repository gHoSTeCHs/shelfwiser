<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceAddonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $addon = $this->route('addon');

        // Check if this is service-specific
        if ($addon->service_id) {
            return $this->user()->can('manage', $addon->service);
        }

        // For category-wide addons, check if user has inventory management permission
        return $this->user()->role->hasPermission('manage_inventory');
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'allows_quantity' => ['sometimes', 'boolean'],
            'max_quantity' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Add-on name is required.',
            'price.required' => 'Add-on price is required.',
            'price.min' => 'Add-on price must be at least 0.',
        ];
    }
}
