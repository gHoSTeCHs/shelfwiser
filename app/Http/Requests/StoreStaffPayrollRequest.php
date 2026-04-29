<?php

namespace App\Http\Requests;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffPayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employment_type' => ['required', Rule::enum(EmploymentType::class)],
            'pay_type' => ['required', Rule::enum(PayType::class)],
            'pay_amount' => ['required', 'numeric', 'min:0'],
            'pay_frequency' => ['required', Rule::enum(PayFrequency::class)],
            'tax_handling' => ['required', Rule::enum(TaxHandling::class)],
            'enable_tax_calculations' => ['nullable', 'boolean'],
            'tax_id_number' => ['nullable', 'string', 'max:255'],
            'pension_enabled' => ['nullable', 'boolean'],
            'pension_employee_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'pension_employer_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'nhf_enabled' => ['nullable', 'boolean'],
            'nhf_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'nhis_enabled' => ['nullable', 'boolean'],
            'nhis_amount' => ['nullable', 'numeric', 'min:0'],
            'other_deductions_enabled' => ['nullable', 'boolean'],
            'bank_account_number' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'routing_number' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:255'],
            'position_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
        ];
    }
}
