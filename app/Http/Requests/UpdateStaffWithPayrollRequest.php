<?php

namespace App\Http\Requests;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateStaffWithPayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        $staff = $this->route('staff');

        return Gate::allows('update', $staff);
    }

    public function rules(): array
    {
        $tenantId = auth()->user()->tenant_id;
        $staffId = $this->route('staff')->id;

        return [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users')->where(fn ($q) => $q->where('tenant_id', $tenantId))->ignore($staffId),
            ],
            'role' => ['sometimes', 'string', Rule::in($this->getAssignableRoles())],
            'shop_ids' => ['nullable', 'array'],
            'shop_ids.*' => [
                'integer',
                Rule::exists('shops', 'id')->where('tenant_id', $tenantId),
            ],
            'is_active' => ['sometimes', 'boolean'],

            'employment_type' => ['sometimes', Rule::enum(EmploymentType::class)],
            'position_title' => ['sometimes', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],

            'pay_type' => ['sometimes', Rule::enum(PayType::class)],
            'pay_amount' => ['sometimes', 'numeric', 'min:0'],
            'pay_frequency' => ['sometimes', Rule::enum(PayFrequency::class)],
            'pay_calendar_id' => [
                'nullable',
                'integer',
                Rule::exists('pay_calendars', 'id')->where('tenant_id', $tenantId),
            ],
            'standard_hours_per_week' => ['nullable', 'numeric', 'min:1', 'max:168'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_cap' => ['nullable', 'numeric', 'min:0'],

            'tax_handling' => ['nullable', Rule::enum(TaxHandling::class)],
            'tax_id_number' => ['nullable', 'string', 'max:50'],
            'tax_state' => ['nullable', 'string', 'max:50'],
            'is_homeowner' => ['sometimes', 'boolean'],
            'pension_enabled' => ['sometimes', 'boolean'],
            'pension_employee_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'nhf_enabled' => ['sometimes', 'boolean'],
            'nhis_enabled' => ['sometimes', 'boolean'],

            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:20'],
            'routing_number' => ['nullable', 'string', 'max:20'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Please provide the employee\'s first name.',
            'last_name.required' => 'Please provide the employee\'s last name.',
            'email.required' => 'Please provide an email address for this employee.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already in use within your organization.',
            'role.in' => 'The selected role is not valid.',
            'shop_ids.*.exists' => 'One or more selected shops do not exist or are not accessible.',
            'end_date.after' => 'End date must be after the start date.',
            'pay_amount.required' => 'Please enter the employee\'s pay amount.',
            'pay_amount.min' => 'Pay amount cannot be negative.',
            'pay_calendar_id.exists' => 'The selected pay calendar does not exist.',
            'standard_hours_per_week.min' => 'Standard hours must be at least 1 hour per week.',
            'standard_hours_per_week.max' => 'Standard hours cannot exceed 168 hours per week.',
            'commission_rate.min' => 'Commission rate cannot be negative.',
            'commission_rate.max' => 'Commission rate cannot exceed 100%.',
            'pension_employee_rate.min' => 'Pension contribution rate cannot be negative.',
            'pension_employee_rate.max' => 'Pension contribution rate cannot exceed 100%.',
            'bank_account_number.max' => 'Bank account number cannot exceed 20 characters.',
        ];
    }

    protected function getAssignableRoles(): array
    {
        $currentUser = auth()->user();
        $currentRole = $currentUser->role;
        $currentLevel = $currentRole instanceof UserRole ? $currentRole->level() : UserRole::from($currentRole)->level();

        return collect(UserRole::cases())
            ->filter(fn ($role) => $role->level() < $currentLevel && $role !== UserRole::SUPER_ADMIN)
            ->map(fn ($role) => $role->value)
            ->values()
            ->toArray();
    }
}
