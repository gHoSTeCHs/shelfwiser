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
