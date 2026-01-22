<?php

namespace App\Enums;

enum DeductionCategory: string
{
    case STATUTORY = 'statutory';
    case VOLUNTARY = 'voluntary';
    case LOAN = 'loan';
    case ADVANCE = 'advance';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::STATUTORY => 'Statutory Deduction',
            self::VOLUNTARY => 'Voluntary Deduction',
            self::LOAN => 'Loan Repayment',
            self::ADVANCE => 'Wage Advance',
            self::OTHER => 'Other Deduction',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::STATUTORY => 'Government-mandated deductions (tax, pension, NHF, NHIS)',
            self::VOLUNTARY => 'Employee-elected deductions (savings, insurance)',
            self::LOAN => 'Loan repayments (company or third-party loans)',
            self::ADVANCE => 'Salary advance repayments',
            self::OTHER => 'Miscellaneous deductions',
        };
    }

    public function isMandatory(): bool
    {
        return match ($this) {
            self::STATUTORY => true,
            default => false,
        };
    }

    public static function options(): array
    {
        return array_map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
            'description' => $case->description(),
        ], self::cases());
    }
}
