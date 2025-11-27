<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class SetupInventoryLocationsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $variant = $this->route('variant');

        return Gate::allows('manage', $variant->product);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'shop_ids' => ['required', 'array', 'min:1'],
            'shop_ids.*' => [
                'required',
                'integer',
                'exists:shops,id,tenant_id,'.$tenantId.',is_active,1',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'shop_ids.required' => 'Please select at least one location.',
            'shop_ids.array' => 'Invalid location selection format.',
            'shop_ids.min' => 'Please select at least one location.',
            'shop_ids.*.required' => 'Each location ID is required.',
            'shop_ids.*.integer' => 'Invalid location ID format.',
            'shop_ids.*.exists' => 'One or more selected locations are invalid or inactive.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'shop_ids' => 'locations',
            'shop_ids.*' => 'location',
        ];
    }
}
