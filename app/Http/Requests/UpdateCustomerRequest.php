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
            'email.unique' => 'A customer with this email already exists.',
            'preferred_shop_id.exists' => 'The selected shop is invalid.',
        ];
    }
}
