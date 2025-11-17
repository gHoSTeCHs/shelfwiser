<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class EmployeePayrollPolicy
{
    /**
     * Determine if user can view payroll details
     */
    public function viewPayrollDetails(User $user, User $employee): bool
    {
        if ($user->tenant_id !== $employee->tenant_id) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->id === $employee->id) {
            return true;
        }

        if ($user->role->level() > $employee->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            $employeeShops = $employee->shops()->pluck('shops.id');
            return $userShops->intersect($employeeShops)->isNotEmpty();
        }

        return false;
    }

    /**
     * Determine if user can update payroll details
     */
    public function updatePayrollDetails(User $user, User $employee): bool
    {
        if ($user->tenant_id !== $employee->tenant_id) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()
            && $user->role->level() > $employee->role->level()) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can update deduction preferences
     */
    public function updateDeductionPreferences(User $user, User $employee): bool
    {
        if ($user->tenant_id !== $employee->tenant_id) {
            return false;
        }

        if ($user->id === $employee->id) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()
            && $user->role->level() > $employee->role->level()) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can update tax settings
     */
    public function updateTaxSettings(User $user, User $employee): bool
    {
        if ($user->tenant_id !== $employee->tenant_id) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()
            && $user->role->level() > $employee->role->level()) {
            return true;
        }

        return false;
    }
}
