<?php

namespace App\Enums;

enum TaxHandling: string
{
    case SHOP_CALCULATES = 'shop_calculates';
    case EMPLOYEE_CALCULATES = 'employee_calculates';
    case EXEMPT = 'exempt';

    /**
     * Get human-readable label for the tax handling type
     */
    public function label(): string
    {
        return match ($this) {
            self::SHOP_CALCULATES => 'Shop Calculates & Withholds Tax (PAYE)',
            self::EMPLOYEE_CALCULATES => 'Employee Handles Own Tax',
            self::EXEMPT => 'Tax Exempt',
        };
    }

    /**
     * Get description for the tax handling type
     */
    public function description(): string
    {
        return match ($this) {
            self::SHOP_CALCULATES => 'The shop will calculate and withhold income tax from each payroll period',
            self::EMPLOYEE_CALCULATES => 'The employee is responsible for calculating and paying their own taxes',
            self::EXEMPT => 'This employee is exempt from income tax (e.g., income below threshold)',
        };
    }
}
