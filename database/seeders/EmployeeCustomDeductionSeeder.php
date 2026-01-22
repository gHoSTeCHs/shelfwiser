<?php

namespace Database\Seeders;

use App\Enums\DeductionType;
use App\Models\EmployeeCustomDeduction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EmployeeCustomDeductionSeeder extends Seeder
{
    /**
     * Seed custom deductions for employees
     */
    public function run(): void
    {
        $users = User::where('is_customer', false)
            ->where('is_active', true)
            ->whereIn('role', ['store_manager', 'assistant_manager', 'sales_rep', 'cashier', 'inventory_clerk'])
            ->with('tenant')
            ->get();

        foreach ($users as $user) {
            $this->createDeductionsForUser($user);
        }
    }

    /**
     * Create sample deductions for a user
     */
    protected function createDeductionsForUser(User $user): void
    {
        $deductions = [];

        if (rand(1, 3) === 1) {
            $deductions[] = [
                'deduction_name' => 'Housing Loan Repayment',
                'deduction_type' => DeductionType::LOAN_REPAYMENT,
                'amount' => rand(10, 30) * 1000,
                'percentage' => null,
                'is_active' => true,
                'effective_from' => Carbon::now()->subMonths(6),
                'effective_to' => Carbon::now()->addMonths(18),
            ];
        }

        if (rand(1, 4) === 1) {
            $deductions[] = [
                'deduction_name' => 'Car Loan Installment',
                'deduction_type' => DeductionType::LOAN_REPAYMENT,
                'amount' => rand(15, 50) * 1000,
                'percentage' => null,
                'is_active' => true,
                'effective_from' => Carbon::now()->subMonths(3),
                'effective_to' => Carbon::now()->addMonths(21),
            ];
        }

        if (rand(1, 3) === 1) {
            $deductions[] = [
                'deduction_name' => 'Life Insurance Premium',
                'deduction_type' => DeductionType::INSURANCE,
                'amount' => rand(3, 10) * 1000,
                'percentage' => null,
                'is_active' => true,
                'effective_from' => Carbon::now()->subMonths(12),
                'effective_to' => null,
            ];
        }

        if (rand(1, 5) === 1) {
            $deductions[] = [
                'deduction_name' => 'Union Membership Dues',
                'deduction_type' => DeductionType::UNION_DUES,
                'amount' => 5000,
                'percentage' => null,
                'is_active' => true,
                'effective_from' => Carbon::now()->subYear(),
                'effective_to' => null,
            ];
        }

        if (rand(1, 4) === 1) {
            $deductions[] = [
                'deduction_name' => 'Cooperative Savings',
                'deduction_type' => DeductionType::SAVINGS,
                'amount' => null,
                'percentage' => 5.0,
                'is_active' => true,
                'effective_from' => Carbon::now()->subMonths(8),
                'effective_to' => null,
            ];
        }

        if (rand(1, 6) === 1) {
            $deductions[] = [
                'deduction_name' => 'Staff Welfare Fund',
                'deduction_type' => DeductionType::OTHER,
                'amount' => 2500,
                'percentage' => null,
                'is_active' => true,
                'effective_from' => Carbon::now()->subMonths(10),
                'effective_to' => null,
            ];
        }

        if (rand(1, 8) === 1) {
            $deductions[] = [
                'deduction_name' => 'Medical Equipment Loan',
                'deduction_type' => DeductionType::LOAN_REPAYMENT,
                'amount' => 8000,
                'percentage' => null,
                'is_active' => false,
                'effective_from' => Carbon::now()->subYear(),
                'effective_to' => Carbon::now()->subMonths(2),
            ];
        }

        foreach ($deductions as $deductionData) {
            EmployeeCustomDeduction::create(array_merge($deductionData, [
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
            ]));
        }
    }
}
