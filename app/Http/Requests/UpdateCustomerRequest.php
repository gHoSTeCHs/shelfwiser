<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('customer'));
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;
        $customerId = $this->route('customer')->id;

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('customers', 'email')
                    ->where(function ($query) use ($tenantId) {
                        return $query->where('tenant_id', $tenantId);
                    })
                    ->ignore($customerId),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'preferred_shop_id' => [
                'nullable',
                'integer',
                Rule::exists('shops', 'id')->where(function ($query) use ($tenantId) {
                    return $query->where('tenant_id', $tenantId);
                }),
            ],
            'is_active' => ['boolean'],
            'marketing_opt_in' => ['boolean'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'array'],
            'address.street' => ['required_with:address', 'string', 'max:255'],
            'address.city' => ['required_with:address', 'string', 'max:255'],
            'address.state' => ['required_with:address', 'string', 'max:255'],
            'address.postal_code' => ['required_with:address', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Please provide the customer\'s first name.',
            'first_name.max' => 'First name cannot exceed 255 characters.',
            'last_name.required' => 'Please provide the customer\'s last name.',
            'last_name.max' => 'Last name cannot exceed 255 characters.',
            'email.required' => 'Please provide an email address for this customer.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'A customer with this email already exists.',
            'phone.max' => 'Phone number cannot exceed 50 characters.',
            'preferred_shop_id.exists' => 'The selected shop is invalid.',
            'credit_limit.min' => 'Credit limit cannot be negative.',
            'address.street.required_with' => 'Street address is required when providing an address.',
            'address.city.required_with' => 'City is required when providing an address.',
            'address.state.required_with' => 'State is required when providing an address.',
            'address.postal_code.required_with' => 'Postal code is required when providing an address.',
        ];
    }
}
