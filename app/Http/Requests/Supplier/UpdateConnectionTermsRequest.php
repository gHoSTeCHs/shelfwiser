<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateConnectionTermsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('updateTerms', $this->route('connection'));
    }

    public function rules(): array
    {
        return [
            'credit_limit' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'payment_terms_override' => ['sometimes', 'nullable', 'string', 'max:50'],
            'supplier_notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'credit_limit.min' => 'Credit limit cannot be negative.',
            'payment_terms_override.max' => 'Payment terms cannot exceed 50 characters.',
            'supplier_notes.max' => 'Notes cannot exceed 1000 characters.',
        ];
    }
}
