<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateCustomerCreditLimitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('manage', $this->route('customer'));
    }

    public function rules(): array
    {
        return [
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'credit_limit.min' => 'Credit limit cannot be negative.',
        ];
    }
}
