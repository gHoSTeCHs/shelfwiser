<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PayrollPeriod;
use App\Models\User;

class PayrollPeriodPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_payroll') ||
               $user->role->hasPermission('manage_payroll');
    }

    public function view(User $user, PayrollPeriod $period): bool
    {
        if ($user->tenant_id !== $period->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('view_payroll') ||
               $user->role->hasPermission('manage_payroll');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_payroll');
    }

    public function update(User $user, PayrollPeriod $period): bool
    {
        if ($user->tenant_id !== $period->tenant_id) {
            return false;
        }

        if ($period->status === 'closed') {
            return false;
        }

        return $user->role->hasPermission('manage_payroll');
    }

    public function close(User $user, PayrollPeriod $period): bool
    {
        if ($user->tenant_id !== $period->tenant_id) {
            return false;
        }

        if ($user->role->level() < UserRole::GENERAL_MANAGER->level()) {
            return false;
        }

        if ($period->status === 'closed') {
            return false;
        }

        return $user->role->hasPermission('manage_payroll');
    }

    public function reopen(User $user, PayrollPeriod $period): bool
    {
        if ($user->tenant_id !== $period->tenant_id) {
            return false;
        }

        if (! $user->is_tenant_owner) {
            return false;
        }

        if ($period->status !== 'closed') {
            return false;
        }

        return true;
    }

    public function delete(User $user, PayrollPeriod $period): bool
    {
        if ($user->tenant_id !== $period->tenant_id) {
            return false;
        }

        if ($period->status === 'closed') {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
