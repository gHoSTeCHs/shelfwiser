<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Payslip;
use App\Models\User;

class PayslipPolicy
{
    /**
     * Determine if user can view any payslips
     */
    public function viewAny(User $user): bool
    {
        return $user->role->level() >= UserRole::STORE_MANAGER->level();
    }

    /**
     * Determine if user can view their own payslips
     */
    public function viewOwn(User $user): bool
    {
        return true;
    }

    /**
     * Determine if user can view a specific payslip
     */
    public function view(User $user, Payslip $payslip): bool
    {
        if ($user->tenant_id !== $payslip->tenant_id) {
            return false;
        }

        if ($payslip->user_id === $user->id) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($payslip->shop_id) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($payslip->shop_id);
        }

        return false;
    }
}
