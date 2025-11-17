<?php

namespace Database\Seeders;

use App\Enums\PayType;
use App\Enums\TaxHandling;
use App\Models\EmployeePayrollDetail;
use App\Models\Shop;
use App\Models\TaxJurisdiction;
use App\Models\User;
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

        $nigeriaJurisdiction = TaxJurisdiction::where('code', 'NG-FED')->first();

        foreach ($users as $user) {
            $shop = Shop::where('tenant_id', $user->tenant_id)->first();

            if (!$shop) {
                continue;
            }

            $payrollData = $this->getPayrollDataForUser($user, $shop, $nigeriaJurisdiction);

            EmployeePayrollDetail::create($payrollData);
        }
    }

    /**
     * Generate appropriate payroll data based on user role
     */
    protected function getPayrollDataForUser(User $user, Shop $shop, ?TaxJurisdiction $jurisdiction): array
    {
        $baseData = [
            'user_id' => $user->id,
            'shop_id' => $shop->id,
            'tenant_id' => $user->tenant_id,
            'enable_tax_calculations' => true,
            'tax_handling' => TaxHandling::SHOP_CALCULATES,
            'tax_jurisdiction_id' => $jurisdiction?->id,
            'pension_enabled' => true,
            'pension_employee_rate' => 8.0,
            'pension_employer_rate' => 10.0,
            'nhf_enabled' => true,
            'nhf_rate' => 2.5,
            'nhis_enabled' => true,
            'nhis_rate' => 5.0,
        ];

        $roleLevel = $user->role->level();

        if ($roleLevel >= 80) {
            return array_merge($baseData, [
                'pay_type' => PayType::SALARY,
                'pay_amount' => 500000,
                'payroll_frequency' => 'monthly',
            ]);
        }

        if ($roleLevel >= 60) {
            return array_merge($baseData, [
                'pay_type' => PayType::SALARY,
                'pay_amount' => 300000,
                'payroll_frequency' => 'monthly',
            ]);
        }

        if ($roleLevel >= 50) {
            return array_merge($baseData, [
                'pay_type' => PayType::SALARY,
                'pay_amount' => 200000,
                'payroll_frequency' => 'monthly',
            ]);
        }

        if ($roleLevel >= 40) {
            return array_merge($baseData, [
                'pay_type' => PayType::HOURLY,
                'pay_amount' => 3000,
                'payroll_frequency' => 'monthly',
            ]);
        }

        return array_merge($baseData, [
            'pay_type' => PayType::HOURLY,
            'pay_amount' => 2000,
            'payroll_frequency' => 'monthly',
        ]);
    }
}
