<?php

namespace Database\Seeders;

use App\Models\DeductionTypeModel;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class DeductionTypesSeeder extends Seeder
{
    public function run(): void
    {
        $systemDeductions = [
            [
                'code' => 'PAYE',
                'name' => 'Pay As You Earn Tax',
                'description' => 'Nigerian PAYE income tax',
                'category' => 'statutory',
                'calculation_type' => 'tiered',
                'calculation_base' => 'taxable',
                'is_pre_tax' => false,
                'is_mandatory' => true,
                'is_system' => true,
                'priority' => 10,
            ],
            [
                'code' => 'PENSION_EE',
                'name' => 'Pension Contribution (Employee)',
                'description' => 'Employee pension contribution (8%)',
                'category' => 'statutory',
                'calculation_type' => 'percentage',
                'calculation_base' => 'pensionable',
                'default_rate' => 8.00,
                'is_pre_tax' => true,
                'is_mandatory' => true,
                'is_system' => true,
                'priority' => 5,
            ],
            [
                'code' => 'NHF',
                'name' => 'National Housing Fund',
                'description' => 'NHF contribution (2.5%)',
                'category' => 'statutory',
                'calculation_type' => 'percentage',
                'calculation_base' => 'basic',
                'default_rate' => 2.50,
                'is_pre_tax' => true,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 15,
            ],
            [
                'code' => 'NHIS',
                'name' => 'National Health Insurance Scheme',
                'description' => 'NHIS contribution',
                'category' => 'statutory',
                'calculation_type' => 'percentage',
                'calculation_base' => 'basic',
                'default_rate' => 5.00,
                'is_pre_tax' => true,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 20,
            ],
            [
                'code' => 'LOAN',
                'name' => 'Company Loan Repayment',
                'description' => 'Repayment for company loans',
                'category' => 'loan',
                'calculation_type' => 'fixed',
                'calculation_base' => 'gross',
                'is_pre_tax' => false,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 50,
            ],
            [
                'code' => 'ADVANCE',
                'name' => 'Wage Advance Repayment',
                'description' => 'Repayment for salary advances',
                'category' => 'advance',
                'calculation_type' => 'fixed',
                'calculation_base' => 'gross',
                'is_pre_tax' => false,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 55,
            ],
            [
                'code' => 'UNION',
                'name' => 'Union Dues',
                'description' => 'Labor union membership dues',
                'category' => 'voluntary',
                'calculation_type' => 'fixed',
                'calculation_base' => 'gross',
                'is_pre_tax' => false,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 60,
            ],
            [
                'code' => 'SAVINGS',
                'name' => 'Cooperative Savings',
                'description' => 'Voluntary cooperative savings deduction',
                'category' => 'voluntary',
                'calculation_type' => 'fixed',
                'calculation_base' => 'gross',
                'is_pre_tax' => false,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 70,
            ],
            [
                'code' => 'INSURANCE',
                'name' => 'Life Insurance Premium',
                'description' => 'Voluntary life insurance premium',
                'category' => 'voluntary',
                'calculation_type' => 'fixed',
                'calculation_base' => 'gross',
                'is_pre_tax' => false,
                'is_mandatory' => false,
                'is_system' => true,
                'priority' => 75,
            ],
        ];

        foreach (Tenant::all() as $tenant) {
            foreach ($systemDeductions as $deduction) {
                DeductionTypeModel::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'code' => $deduction['code']],
                    array_merge($deduction, ['tenant_id' => $tenant->id])
                );
            }

            $this->command->info("Created deduction types for tenant: {$tenant->name}");
        }
    }
}
