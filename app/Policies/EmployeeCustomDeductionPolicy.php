<?php

namespace App\Policies;

use App\Models\EmployeeCustomDeduction;
use App\Models\User;

class EmployeeCustomDeductionPolicy
{
    /**
     * The deduction must belong to the employee in the URL.
     * Combined with the employee-binding Gate ('updatePayrollDetails', $employee),
     * this enforces both employee access and deduction ownership.
     */
    public function manage(User $user, EmployeeCustomDeduction $deduction, User $employee): bool
    {
        return $deduction->user_id === $employee->id;
    }
}
