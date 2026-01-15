<?php

namespace App\Services;

use App\Models\EarningType;
use App\Models\EmployeeEarning;
use App\Models\EmployeePayrollDetail;
use App\Models\EmployeeTaxSetting;
use App\Models\ShopUser;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class StaffOnboardingService
{
    public function __construct(
        protected EmployeeTemplateService $templateService
    ) {}

    /**
     * Create a new staff member with complete payroll configuration
     */
    public function createStaffWithPayroll(array $data, Tenant $tenant, User $creator): User
    {
        return DB::transaction(function () use ($data, $tenant, $creator) {
            $staff = $this->createUser($data, $tenant);

            $this->assignShops($staff, $data['shop_ids'] ?? [], $tenant);

            $payrollDetail = $this->createPayrollDetail($staff, $data);

            $this->createTaxSettings($staff, $data);

            $this->assignDefaultEarnings($staff, $payrollDetail);

            $staff->update([
                'onboarding_status' => 'completed',
                'onboarded_at' => now(),
                'onboarded_by' => $creator->id,
            ]);

            if ($data['send_invitation'] ?? false) {
                $this->sendInvitationEmail($staff);
            }

            $this->templateService->autoSaveTemplate($staff, $data);

            $this->clearCaches($tenant);

            return $staff->load(['shops', 'employeePayrollDetail', 'taxSettings']);
        });
    }

    /**
     * Update an existing staff member with payroll configuration
     */
    public function updateStaffWithPayroll(User $staff, array $data): User
    {
        return DB::transaction(function () use ($staff, $data) {
            $this->updateUser($staff, $data);

            if (isset($data['shop_ids'])) {
                $this->syncShops($staff, $data['shop_ids']);
            }

            $this->updatePayrollDetail($staff, $data);

            $this->updateTaxSettings($staff, $data);

            $this->clearCaches($staff->tenant);

            return $staff->fresh(['shops', 'employeePayrollDetail', 'taxSettings']);
        });
    }

    /**
     * Create a new user record
     */
    protected function createUser(array $data, Tenant $tenant): User
    {
        return User::create([
            'tenant_id' => $tenant->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
            'is_tenant_owner' => false,
            'is_active' => true,
            'onboarding_status' => 'in_progress',
        ]);
    }

    /**
     * Update user basic information
     */
    protected function updateUser(User $staff, array $data): void
    {
        $userFields = ['first_name', 'last_name', 'email', 'role', 'is_active'];
        $userData = array_intersect_key($data, array_flip($userFields));

        if (! empty($userData)) {
            $staff->update($userData);
        }
    }

    /**
     * Assign shops to a staff member
     */
    protected function assignShops(User $staff, array $shopIds, Tenant $tenant): void
    {
        if (empty($shopIds)) {
            return;
        }

        foreach ($shopIds as $shopId) {
            ShopUser::create([
                'tenant_id' => $tenant->id,
                'user_id' => $staff->id,
                'shop_id' => $shopId,
            ]);
        }
    }

    /**
     * Sync shops for an existing staff member
     */
    protected function syncShops(User $staff, array $shopIds): void
    {
        ShopUser::where('user_id', $staff->id)->delete();

        foreach ($shopIds as $shopId) {
            ShopUser::create([
                'tenant_id' => $staff->tenant_id,
                'user_id' => $staff->id,
                'shop_id' => $shopId,
            ]);
        }
    }

    /**
     * Create payroll detail for a staff member
     */
    protected function createPayrollDetail(User $staff, array $data): EmployeePayrollDetail
    {
        $this->validateEnumFields($data);

        return EmployeePayrollDetail::create([
            'user_id' => $staff->id,
            'tenant_id' => $staff->tenant_id,
            'employment_type' => $data['employment_type'],
            'position_title' => $data['position_title'],
            'department' => $data['department'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null,
            'pay_type' => $data['pay_type'],
            'pay_amount' => $data['pay_amount'],
            'pay_frequency' => $data['pay_frequency'],
            'pay_calendar_id' => $data['pay_calendar_id'] ?? null,
            'standard_hours_per_week' => $data['standard_hours_per_week'] ?? 40,
            'commission_rate' => $data['commission_rate'] ?? null,
            'commission_cap' => $data['commission_cap'] ?? null,
            'tax_handling' => $data['tax_handling'] ?? 'shop_calculates',
            'enable_tax_calculations' => true,
            'tax_id_number' => $data['tax_id_number'] ?? null,
            'pension_enabled' => $data['pension_enabled'] ?? false,
            'pension_employee_rate' => $data['pension_employee_rate'] ?? 8,
            'pension_employer_rate' => 10,
            'nhf_enabled' => $data['nhf_enabled'] ?? false,
            'nhf_rate' => 2.5,
            'nhis_enabled' => $data['nhis_enabled'] ?? false,
            'nhis_amount' => null,
            'bank_name' => $data['bank_name'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'routing_number' => $data['routing_number'] ?? null,
            'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
        ]);
    }

    /**
     * Update payroll detail for an existing staff member
     */
    protected function updatePayrollDetail(User $staff, array $data): void
    {
        $payrollFields = [
            'employment_type', 'position_title', 'department', 'start_date', 'end_date',
            'pay_type', 'pay_amount', 'pay_frequency', 'pay_calendar_id',
            'standard_hours_per_week', 'commission_rate', 'commission_cap',
            'tax_handling', 'tax_id_number',
            'pension_enabled', 'pension_employee_rate',
            'nhf_enabled', 'nhis_enabled',
            'bank_name', 'bank_account_number', 'routing_number',
            'emergency_contact_name', 'emergency_contact_phone',
        ];

        $payrollData = array_intersect_key($data, array_flip($payrollFields));

        if (empty($payrollData)) {
            return;
        }

        $this->validateEnumFields($payrollData);

        $payrollDetail = $staff->employeePayrollDetail;

        if ($payrollDetail) {
            $payrollDetail->update($payrollData);
        } else {
            $this->createPayrollDetail($staff, array_merge([
                'employment_type' => 'full_time',
                'position_title' => 'Employee',
                'start_date' => now()->toDateString(),
                'pay_type' => 'salary',
                'pay_amount' => 0,
                'pay_frequency' => 'monthly',
            ], $payrollData));
        }
    }

    /**
     * Create default tax settings for a staff member.
     * Initializes EmployeeTaxSetting with sensible defaults for NTA 2025 compliance.
     */
    protected function createTaxSettings(User $staff, array $data): EmployeeTaxSetting
    {
        return EmployeeTaxSetting::create([
            'user_id' => $staff->id,
            'tenant_id' => $staff->tenant_id,
            'tax_id_number' => $data['tax_id_number'] ?? null,
            'tax_state' => $data['tax_state'] ?? null,
            'is_tax_exempt' => false,
            'is_homeowner' => $data['is_homeowner'] ?? false,
            'annual_rent_paid' => null,
            'active_reliefs' => [],
            'low_income_auto_exempt' => false,
        ]);
    }

    /**
     * Update tax settings for an existing staff member.
     * Creates tax settings if they don't exist.
     */
    protected function updateTaxSettings(User $staff, array $data): void
    {
        $taxFields = ['tax_id_number', 'tax_state', 'is_homeowner'];
        $taxData = array_intersect_key($data, array_flip($taxFields));

        if (empty($taxData)) {
            return;
        }

        $taxSettings = $staff->taxSettings;

        if ($taxSettings) {
            $taxSettings->update($taxData);
        } else {
            $this->createTaxSettings($staff, $data);
        }
    }

    /**
     * Validate enum fields to ensure they contain valid enum values
     */
    protected function validateEnumFields(array $data): void
    {
        if (isset($data['employment_type'])) {
            $employmentType = \App\Enums\EmploymentType::tryFrom($data['employment_type']);
            if ($employmentType === null) {
                throw new \InvalidArgumentException("Invalid employment_type: {$data['employment_type']}");
            }
        }

        if (isset($data['pay_type'])) {
            $payType = \App\Enums\PayType::tryFrom($data['pay_type']);
            if ($payType === null) {
                throw new \InvalidArgumentException("Invalid pay_type: {$data['pay_type']}");
            }
        }

        if (isset($data['pay_frequency'])) {
            $payFrequency = \App\Enums\PayFrequency::tryFrom($data['pay_frequency']);
            if ($payFrequency === null) {
                throw new \InvalidArgumentException("Invalid pay_frequency: {$data['pay_frequency']}");
            }
        }

        if (isset($data['tax_handling'])) {
            $taxHandling = \App\Enums\TaxHandling::tryFrom($data['tax_handling']);
            if ($taxHandling === null) {
                throw new \InvalidArgumentException("Invalid tax_handling: {$data['tax_handling']}");
            }
        }
    }

    /**
     * Assign default earnings based on pay configuration
     */
    protected function assignDefaultEarnings(User $staff, EmployeePayrollDetail $payrollDetail): void
    {
        $basicEarning = EarningType::where('tenant_id', $staff->tenant_id)
            ->where('code', 'BASIC')
            ->first();

        if ($basicEarning) {
            EmployeeEarning::create([
                'tenant_id' => $staff->tenant_id,
                'user_id' => $staff->id,
                'earning_type_id' => $basicEarning->id,
                'amount' => $payrollDetail->pay_amount,
                'effective_from' => $payrollDetail->start_date ?? now(),
                'is_active' => true,
            ]);
        }

        $payTypeValue = $payrollDetail->pay_type instanceof \App\Enums\PayType
            ? $payrollDetail->pay_type->value
            : $payrollDetail->pay_type;

        if ($payTypeValue === 'commission_based' && $payrollDetail->commission_rate) {
            $commissionEarning = EarningType::where('tenant_id', $staff->tenant_id)
                ->where('code', 'COMMISSION')
                ->first();

            if ($commissionEarning) {
                EmployeeEarning::create([
                    'tenant_id' => $staff->tenant_id,
                    'user_id' => $staff->id,
                    'earning_type_id' => $commissionEarning->id,
                    'rate' => $payrollDetail->commission_rate,
                    'effective_from' => $payrollDetail->start_date ?? now(),
                    'is_active' => true,
                    'custom_rules' => $payrollDetail->commission_cap ? ['cap' => $payrollDetail->commission_cap] : null,
                ]);
            }
        }
    }

    /**
     * Send invitation email to the new staff member
     */
    protected function sendInvitationEmail(User $staff): void
    {
        Log::info('Invitation email queued for staff.', ['staff_id' => $staff->id]);
    }

    /**
     * Clear relevant caches
     */
    protected function clearCaches(Tenant $tenant): void
    {
        Cache::tags([
            "tenant:{$tenant->id}:staff",
            "tenant:{$tenant->id}:payroll",
        ])->flush();
    }
}
