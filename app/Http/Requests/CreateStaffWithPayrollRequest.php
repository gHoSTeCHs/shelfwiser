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
use Illuminate\Validation\Rules\Password;

class CreateStaffWithPayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', \App\Models\User::class);
    }

    public function rules(): array
    {
        $tenantId = auth()->user()->tenant_id;

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'string', Rule::in($this->getAssignableRoles())],
            'shop_ids' => ['nullable', 'array'],
            'shop_ids.*' => [
                'integer',
                Rule::exists('shops', 'id')->where('tenant_id', $tenantId),
            ],
            'send_invitation' => ['boolean'],

            'employment_type' => ['required', Rule::enum(EmploymentType::class)],
            'position_title' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => [
                'nullable',
                'date',
                'after:start_date',
                Rule::requiredIf($this->requiresEndDate()),
            ],

            'pay_type' => ['required', Rule::enum(PayType::class)],
            'pay_amount' => ['required', 'numeric', 'min:0'],
            'pay_frequency' => ['required', Rule::enum(PayFrequency::class)],
            'pay_calendar_id' => [
                'nullable',
                'integer',
                Rule::exists('pay_calendars', 'id')->where('tenant_id', $tenantId),
            ],
            'standard_hours_per_week' => ['nullable', 'numeric', 'min:1', 'max:168'],
            'commission_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100',
                Rule::requiredIf($this->isCommissionBased()),
            ],
            'commission_cap' => ['nullable', 'numeric', 'min:0'],

            'tax_handling' => ['nullable', Rule::enum(TaxHandling::class)],
            'tax_id_number' => ['nullable', 'string', 'max:50'],
            'pension_enabled' => ['boolean'],
            'pension_employee_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'nhf_enabled' => ['boolean'],
            'nhis_enabled' => ['boolean'],

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
            'end_date.required_if' => 'End date is required for contract, seasonal, and intern positions.',
            'commission_rate.required_if' => 'Commission rate is required for commission-based pay.',
            'email.unique' => 'An employee with this email already exists in your organization.',
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

    protected function requiresEndDate(): bool
    {
        $type = $this->input('employment_type');
        if (!$type) {
            return false;
        }

        return in_array($type, ['contract', 'seasonal', 'intern']);
    }

    protected function isCommissionBased(): bool
    {
        return $this->input('pay_type') === 'commission_based';
    }

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        $data['pension_enabled'] = $data['pension_enabled'] ?? false;
        $data['nhf_enabled'] = $data['nhf_enabled'] ?? false;
        $data['nhis_enabled'] = $data['nhis_enabled'] ?? false;
        $data['send_invitation'] = $data['send_invitation'] ?? false;
        $data['standard_hours_per_week'] = $data['standard_hours_per_week'] ?? 40;
        $data['pension_employee_rate'] = $data['pension_employee_rate'] ?? 8;
        $data['tax_handling'] = $data['tax_handling'] ?? 'shop_calculates';

        return $data;
    }
}
