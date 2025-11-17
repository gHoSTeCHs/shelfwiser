<?php

namespace Database\Seeders;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Models\EmployeePayrollDetail;
use App\Models\Shop;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EmployeePayrollDetailSeeder extends Seeder
{
    /**
     * Seed employee payroll details for all non-customer users
     */
    public function run(): void
    {
        $users = User::where('is_customer', false)
            ->where('is_active', true)
            ->with('tenant')
            ->get();

        foreach ($users as $user) {
            $shop = Shop::where('tenant_id', $user->tenant_id)->first();

            if (!$shop) {
                continue;
            }

            $payrollData = $this->getPayrollDataForUser($user, $shop);

            EmployeePayrollDetail::create($payrollData);
        }
    }

    /**
     * Generate appropriate payroll data based on user role
     */
    protected function getPayrollDataForUser(User $user, Shop $shop): array
    {
        $roleLevel = $user->role->level();

        $baseData = [
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'employment_type' => EmploymentType::FULL_TIME,
            'pay_frequency' => PayFrequency::MONTHLY,
            'enable_tax_calculations' => true,
            'tax_handling' => TaxHandling::SHOP_CALCULATES,
            'pension_enabled' => true,
            'pension_employee_rate' => 8.0,
            'pension_employer_rate' => 10.0,
            'nhf_enabled' => true,
            'nhf_rate' => 2.5,
            'nhis_enabled' => true,
            'nhis_amount' => 5000,
            'start_date' => Carbon::now()->subYear(),
            'position_title' => $user->role->label(),
            'department' => $this->getDepartmentForRole($roleLevel),
        ];

        if ($roleLevel >= 80) {
            return array_merge($baseData, [
                'pay_type' => PayType::SALARY,
                'pay_amount' => 500000,
            ]);
        }

        if ($roleLevel >= 60) {
            return array_merge($baseData, [
                'pay_type' => PayType::SALARY,
                'pay_amount' => 300000,
            ]);
        }

        if ($roleLevel >= 50) {
            return array_merge($baseData, [
                'pay_type' => PayType::SALARY,
                'pay_amount' => 200000,
            ]);
        }

        if ($roleLevel >= 40) {
            return array_merge($baseData, [
                'pay_type' => PayType::HOURLY,
                'pay_amount' => 3000,
            ]);
        }

        return array_merge($baseData, [
            'pay_type' => PayType::HOURLY,
            'pay_amount' => 2000,
        ]);
    }

    /**
     * Map role level to department name
     */
    protected function getDepartmentForRole(int $roleLevel): string
    {
        return match (true) {
            $roleLevel >= 80 => 'Executive Management',
            $roleLevel >= 60 => 'Store Management',
            $roleLevel >= 50 => 'Operations',
            $roleLevel >= 40 => 'Sales',
            default => 'Operations',
        };
    }
}
