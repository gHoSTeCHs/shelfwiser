<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateServiceAddonRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        // Check if this is service-specific or category-wide
        if ($this->route('service')) {
            $service = $this->route('service');
            return $this->user()->can('manage', $service);
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'allows_quantity' => ['boolean'],
            'max_quantity' => ['nullable', 'integer', 'min:1', 'required_if:allows_quantity,true'],
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
            'name.required' => 'Add-on name is required.',
            'price.required' => 'Add-on price is required.',
            'price.min' => 'Add-on price must be at least 0.',
            'max_quantity.required_if' => 'Maximum quantity is required when quantity is allowed.',
        ];
    }
}
