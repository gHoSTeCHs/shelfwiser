<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\PayrollPeriod;
use App\Models\User;

class PayrollPolicy
{
    /**
     * Determine if user can view any payroll periods
     */
    public function viewAny(User $user): bool
    {
        return $user->role->level() >= UserRole::STORE_MANAGER->level();
    }

    /**
     * Determine if user can view a specific payroll period
     */
    public function view(User $user, PayrollPeriod $payrollPeriod): bool
    {
        if ($user->tenant_id !== $payrollPeriod->tenant_id) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($payrollPeriod->shop_id) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($payrollPeriod->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can create payroll periods
     */
    public function create(User $user): bool
    {
        return $user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER;
    }

    /**
     * Determine if user can process payroll
     */
    public function process(User $user, PayrollPeriod $payrollPeriod): bool
    {
        if ($user->tenant_id !== $payrollPeriod->tenant_id) {
            return false;
        }

        if (!$payrollPeriod->status->canProcess()) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can approve payroll
     */
    public function approve(User $user, PayrollPeriod $payrollPeriod): bool
    {
        if ($user->tenant_id !== $payrollPeriod->tenant_id) {
            return false;
        }

        if (!$payrollPeriod->status->canApprove()) {
            return false;
        }

        if ($payrollPeriod->requires_owner_approval) {
            return $user->is_tenant_owner;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can mark payroll as paid
     */
    public function markAsPaid(User $user, PayrollPeriod $payrollPeriod): bool
    {
        if ($user->tenant_id !== $payrollPeriod->tenant_id) {
            return false;
        }

        if (!$payrollPeriod->status->canPay()) {
            return false;
        }

        return $user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER;
    }

    /**
     * Determine if user can cancel payroll
     */
    public function cancel(User $user, PayrollPeriod $payrollPeriod): bool
    {
        if ($user->tenant_id !== $payrollPeriod->tenant_id) {
            return false;
        }

        if (!$payrollPeriod->status->canCancel()) {
            return false;
        }

        return $user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER;
    }

    /**
     * Determine if user can delete a payroll period
     */
    public function delete(User $user, PayrollPeriod $payrollPeriod): bool
    {
        if ($user->tenant_id !== $payrollPeriod->tenant_id) {
            return false;
        }

        if ($payrollPeriod->status->canCancel()) {
            return $user->is_tenant_owner;
        }

        return false;
    }

    /**
     * Determine if user can view their own payslip
     */
    public function viewOwnPayslip(User $user): bool
    {
        return true;
    }
}
