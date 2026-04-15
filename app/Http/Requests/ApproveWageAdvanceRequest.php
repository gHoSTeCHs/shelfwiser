<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveWageAdvanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_approved' => ['nullable', 'numeric', 'min:0.01'],
            'repayment_installments' => ['nullable', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
