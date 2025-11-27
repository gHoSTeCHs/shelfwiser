<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Enums\WageAdvanceStatus;
use App\Models\User;
use App\Models\WageAdvance;

class WageAdvancePolicy
{
    /**
     * Determine if user can view any wage advances
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if user can view a specific wage advance
     */
    public function view(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if ($user->id === $wageAdvance->user_id) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::STORE_MANAGER->level()) {
            $userShops = $user->shops()->pluck('shops.id');

            return $userShops->contains($wageAdvance->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can create wage advance requests
     */
    public function create(User $user): bool
    {
        return $user->payrollDetail !== null;
    }

    /**
     * Determine if user can update a wage advance
     */
    public function update(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if ($user->id === $wageAdvance->user_id && $wageAdvance->status === WageAdvanceStatus::PENDING) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can approve a wage advance
     */
    public function approve(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if ($user->id === $wageAdvance->user_id) {
            return false;
        }

        if (! $wageAdvance->status->canApprove()) {
            return false;
        }

        if ($user->is_tenant_owner) {
            return true;
        }

        if ($user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::STORE_MANAGER->level() &&
            $user->role->level() > $wageAdvance->user->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');

            return $userShops->contains($wageAdvance->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can reject a wage advance
     */
    public function reject(User $user, WageAdvance $wageAdvance): bool
    {
        return $this->approve($user, $wageAdvance);
    }

    /**
     * Determine if user can disburse a wage advance
     */
    public function disburse(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if (! $wageAdvance->status->canDisburse()) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userShops = $user->shops()->pluck('shops.id');

            return $userShops->contains($wageAdvance->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can cancel a wage advance
     */
    public function cancel(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if (! $wageAdvance->status->canCancel()) {
            return false;
        }

        if ($user->id === $wageAdvance->user_id && $wageAdvance->status === WageAdvanceStatus::PENDING) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userShops = $user->shops()->pluck('shops.id');

            return $userShops->contains($wageAdvance->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can record repayment
     */
    public function recordRepayment(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if (! $wageAdvance->status->canRecordRepayment()) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can delete a wage advance
     */
    public function delete(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        if ($wageAdvance->status === WageAdvanceStatus::DISBURSED ||
            $wageAdvance->status === WageAdvanceStatus::REPAYING) {
            return false;
        }

        if ($user->is_tenant_owner) {
            return true;
        }

        if ($user->id === $wageAdvance->user_id && $wageAdvance->status === WageAdvanceStatus::PENDING) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can restore a soft-deleted wage advance
     */
    public function restore(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER;
    }

    /**
     * Determine if user can permanently delete a wage advance
     */
    public function forceDelete(User $user, WageAdvance $wageAdvance): bool
    {
        if ($user->tenant_id !== $wageAdvance->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
