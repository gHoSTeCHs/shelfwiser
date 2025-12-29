<?php

namespace Database\Seeders;

use App\Models\EarningType;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class EarningTypesSeeder extends Seeder
{
    public function run(): void
    {
        $systemEarnings = [
            [
                'code' => 'BASIC',
                'name' => 'Basic Salary',
                'description' => 'Base salary component for employees',
                'category' => 'base',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'is_pensionable' => true,
                'is_recurring' => true,
                'is_system' => true,
                'display_order' => 1,
            ],
            [
                'code' => 'HOUSING',
                'name' => 'Housing Allowance',
                'description' => 'Monthly housing allowance',
                'category' => 'allowance',
                'calculation_type' => 'percentage',
                'default_rate' => 15.00,
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => true,
                'is_system' => true,
                'display_order' => 2,
            ],
            [
                'code' => 'TRANSPORT',
                'name' => 'Transport Allowance',
                'description' => 'Monthly transport allowance',
                'category' => 'allowance',
                'calculation_type' => 'fixed',
                'default_amount' => 10000,
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => true,
                'is_system' => true,
                'display_order' => 3,
            ],
            [
                'code' => 'MEAL',
                'name' => 'Meal Allowance',
                'description' => 'Daily meal allowance',
                'category' => 'allowance',
                'calculation_type' => 'fixed',
                'default_amount' => 5000,
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => true,
                'is_system' => true,
                'display_order' => 4,
            ],
            [
                'code' => 'OVERTIME',
                'name' => 'Overtime Pay',
                'description' => 'Pay for overtime hours worked',
                'category' => 'overtime',
                'calculation_type' => 'hourly',
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => false,
                'is_system' => true,
                'display_order' => 5,
            ],
            [
                'code' => 'COMMISSION',
                'name' => 'Sales Commission',
                'description' => 'Commission based on sales performance',
                'category' => 'commission',
                'calculation_type' => 'percentage',
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => false,
                'is_system' => true,
                'display_order' => 6,
            ],
            [
                'code' => 'BONUS',
                'name' => 'Performance Bonus',
                'description' => 'One-time performance bonus',
                'category' => 'bonus',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => false,
                'is_system' => true,
                'display_order' => 7,
            ],
            [
                'code' => '13TH_MONTH',
                'name' => '13th Month Salary',
                'description' => 'Annual 13th month bonus',
                'category' => 'bonus',
                'calculation_type' => 'percentage',
                'default_rate' => 100.00,
                'is_taxable' => true,
                'is_pensionable' => false,
                'is_recurring' => false,
                'is_system' => true,
                'display_order' => 8,
            ],
        ];

        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Please seed tenants first.');
            return;
        }

        foreach ($tenants as $tenant) {
            foreach ($systemEarnings as $earning) {
                EarningType::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'code' => $earning['code']],
                    array_merge($earning, ['tenant_id' => $tenant->id])
                );
            }

            $this->command->info("Created earning types for tenant: {$tenant->name}");
        }
    }
}
