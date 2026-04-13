<?php

namespace App\Http\Requests;

use App\Enums\DeductionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeCustomDeductionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deduction_name' => ['required', 'string', 'max:255'],
            'deduction_type' => ['required', Rule::enum(DeductionType::class)],
            'amount' => ['required_if:deduction_type,fixed_amount,loan_repayment,advance_repayment,insurance,union_dues,savings,other', 'nullable', 'numeric', 'min:0'],
            'percentage' => ['required_if:deduction_type,percentage', 'nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['nullable', 'date', 'after:effective_from'],
        ];
    }
}
