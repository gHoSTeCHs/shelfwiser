<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeTaxSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to update employee tax settings.
     * Only users who can manage staff can update tax settings.
     */
    public function authorize(): bool
    {
        $staff = $this->route('user');

        if (! $staff) {
            return false;
        }

        return $this->user()->can('update', $staff);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tax_id_number' => ['nullable', 'string', 'max:50'],
            'tax_state' => ['nullable', 'string', 'max:50'],
            'is_tax_exempt' => ['boolean'],
            'exemption_reason' => [
                'nullable',
                'string',
                'max:500',
                Rule::requiredIf($this->boolean('is_tax_exempt')),
            ],
            'exemption_expires_at' => ['nullable', 'date', 'after:today'],
            'is_homeowner' => ['boolean'],
            'annual_rent_paid' => [
                'nullable',
                'numeric',
                'min:0',
                'max:50000000',
                Rule::requiredIf(! $this->boolean('is_homeowner') && $this->has('annual_rent_paid')),
            ],
            'active_reliefs' => ['nullable', 'array'],
            'active_reliefs.*' => ['string', 'exists:tax_reliefs,code'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'exemption_reason.required_if' => 'Please provide a reason for the tax exemption.',
            'annual_rent_paid.required_if' => 'Please provide the annual rent amount for non-homeowners.',
            'active_reliefs.*.exists' => 'One or more selected reliefs are invalid.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'tax_id_number' => 'Tax ID Number',
            'tax_state' => 'Tax State',
            'is_tax_exempt' => 'Tax Exempt Status',
            'exemption_reason' => 'Exemption Reason',
            'exemption_expires_at' => 'Exemption Expiry Date',
            'is_homeowner' => 'Homeowner Status',
            'annual_rent_paid' => 'Annual Rent Paid',
            'active_reliefs' => 'Tax Reliefs',
        ];
    }
}
