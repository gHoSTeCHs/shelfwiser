<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordWageAdvanceRepaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'repayment_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'in:deducted_from_salary,cash,bank_transfer'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
