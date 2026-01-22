<?php

namespace Database\Seeders;

use App\Models\EmployeePayrollDetail;
use Illuminate\Database\Seeder;

class PayrollSeeder extends Seeder
{
    public function run(): void
    {
        $employees = EmployeePayrollDetail::all();
        $updated = 0;

        foreach ($employees as $employee) {
            $updates = [];

            if ($employee->standard_hours_per_week === null) {
                $updates['standard_hours_per_week'] = 40;
            }
            if ($employee->overtime_multiplier === null) {
                $updates['overtime_multiplier'] = 1.5;
            }
            if ($employee->weekend_multiplier === null) {
                $updates['weekend_multiplier'] = 2.0;
            }
            if ($employee->holiday_multiplier === null) {
                $updates['holiday_multiplier'] = 2.5;
            }
            if ($employee->commission_basis === null) {
                $updates['commission_basis'] = 'sales';
            }

            $payTypeValue = $employee->pay_type?->value ?? $employee->pay_type;
            if ($payTypeValue === 'commission_based' && $employee->commission_rate === null) {
                $updates['commission_rate'] = 5.00;
                $updates['commission_cap'] = 50000.00;
            }

            if (!empty($updates)) {
                $employee->update($updates);
                $updated++;
            }
        }

        $this->command->info("Updated {$updated} employee payroll details with working hours and commission configuration.");
    }
}
