<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PayRun;
use App\Models\User;

class PayRunPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_payroll') ||
               $user->role->hasPermission('manage_payroll');
    }

    public function view(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('view_payroll') ||
               $user->role->hasPermission('manage_payroll');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_payroll');
    }

    public function calculate(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return in_array($payRun->status, ['draft', 'pending_review']);
    }

    public function submit(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return $payRun->status === 'pending_review';
    }

    public function approve(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('approve_payroll')) {
            return false;
        }

        if ($user->role->level() < UserRole::GENERAL_MANAGER->level()) {
            return false;
        }

        return $payRun->status === 'pending_approval';
    }

    public function reject(User $user, PayRun $payRun): bool
    {
        return $this->approve($user, $payRun);
    }

    public function complete(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return $payRun->status === 'approved';
    }

    public function cancel(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return in_array($payRun->status, ['draft', 'pending_review', 'pending_approval']);
    }

    public function regenerate(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if ($user->role->level() < UserRole::GENERAL_MANAGER->level()) {
            return false;
        }

        if (! $user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return in_array($payRun->status, ['draft', 'rejected', 'cancelled']);
    }

    public function excludeEmployee(User $user, PayRun $payRun): bool
    {
        if ($user->tenant_id !== $payRun->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return in_array($payRun->status, ['draft', 'pending_review']);
    }

    public function includeEmployee(User $user, PayRun $payRun): bool
    {
        return $this->excludeEmployee($user, $payRun);
    }

    public function viewReports(User $user): bool
    {
        return $user->role->hasPermission('view_payroll_reports') ||
               $user->role->hasPermission('view_payroll') ||
               $user->role->hasPermission('manage_payroll');
    }

    public function exportReports(User $user): bool
    {
        return $user->role->hasPermission('export_payroll_reports') ||
               $user->role->hasPermission('manage_payroll');
    }

    public function manageSettings(User $user): bool
    {
        return $user->role->hasPermission('manage_payroll_settings') ||
               $user->is_tenant_owner;
    }
}
