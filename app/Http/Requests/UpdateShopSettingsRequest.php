<?php

namespace App\Http\Requests;

use App\Enums\PayFrequency;
use App\Enums\TaxHandling;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateShopSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tax_jurisdiction_id' => ['nullable', 'exists:tax_jurisdictions,id'],
            'enable_tax_calculations' => ['required', 'boolean'],
            'default_tax_handling' => ['required', Rule::in(array_column(TaxHandling::cases(), 'value'))],
            'overtime_threshold_hours' => ['required', 'numeric', 'min:0', 'max:168'],
            'overtime_multiplier' => ['required', 'numeric', 'min:1', 'max:5'],
            'default_payroll_frequency' => ['required', Rule::in(array_column(PayFrequency::cases(), 'value'))],
            'wage_advance_max_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'default_pension_enabled' => ['nullable', 'boolean'],
            'default_nhf_enabled' => ['nullable', 'boolean'],
            'default_nhis_enabled' => ['nullable', 'boolean'],
        ];
    }
}
