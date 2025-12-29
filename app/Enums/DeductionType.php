<?php

namespace App\Enums;

enum DeductionType: string
{
    case FIXED_AMOUNT = 'fixed_amount';
    case PERCENTAGE = 'percentage';
    case LOAN_REPAYMENT = 'loan_repayment';
    case ADVANCE_REPAYMENT = 'advance_repayment';
    case INSURANCE = 'insurance';
    case UNION_DUES = 'union_dues';
    case SAVINGS = 'savings';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::FIXED_AMOUNT => 'Fixed Amount',
            self::PERCENTAGE => 'Percentage of Salary',
            self::LOAN_REPAYMENT => 'Loan Repayment',
            self::ADVANCE_REPAYMENT => 'Wage Advance Repayment',
            self::INSURANCE => 'Insurance Premium',
            self::UNION_DUES => 'Union Dues',
            self::SAVINGS => 'Savings/Investment',
            self::OTHER => 'Other Deduction',
        };
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->all();
    }
}
