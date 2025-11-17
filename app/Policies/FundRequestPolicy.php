<?php

namespace App\Policies;

use App\Enums\FundRequestStatus;
use App\Enums\UserRole;
use App\Models\FundRequest;
use App\Models\User;

class FundRequestPolicy
{
    /**
     * Determine if user can view any fund requests
     */
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_fund_requests') ||
               $user->role->level() >= UserRole::ASSISTANT_MANAGER->level();
    }

    /**
     * Determine if user can view a specific fund request
     */
    public function view(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        if ($user->id === $fundRequest->user_id) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($fundRequest->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can create fund requests
     */
    public function create(User $user): bool
    {
        return $user->role->hasPermission('create_fund_requests');
    }

    /**
     * Determine if user can update a fund request
     */
    public function update(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        if ($user->id === $fundRequest->user_id && $fundRequest->status === FundRequestStatus::PENDING) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can approve a fund request
     */
    public function approve(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        if ($user->id === $fundRequest->user_id) {
            return false;
        }

        if (!$fundRequest->status->canApprove()) {
            return false;
        }

        if ($user->is_tenant_owner) {
            return true;
        }

        if ($user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level() &&
            $user->role->level() > $fundRequest->user->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($fundRequest->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can reject a fund request
     */
    public function reject(User $user, FundRequest $fundRequest): bool
    {
        return $this->approve($user, $fundRequest);
    }

    /**
     * Determine if user can disburse funds
     */
    public function disburse(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        if (!$fundRequest->status->canDisburse()) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($fundRequest->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can cancel a fund request
     */
    public function cancel(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        if (!$fundRequest->status->canCancel()) {
            return false;
        }

        if ($user->id === $fundRequest->user_id && $fundRequest->status === FundRequestStatus::PENDING) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role === UserRole::STORE_MANAGER) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($fundRequest->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can delete a fund request
     */
    public function delete(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        if ($fundRequest->status === FundRequestStatus::DISBURSED) {
            return false;
        }

        if ($user->is_tenant_owner) {
            return true;
        }

        if ($user->id === $fundRequest->user_id && $fundRequest->status === FundRequestStatus::PENDING) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can restore a soft-deleted fund request
     */
    public function restore(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER;
    }

    /**
     * Determine if user can permanently delete a fund request
     */
    public function forceDelete(User $user, FundRequest $fundRequest): bool
    {
        if ($user->tenant_id !== $fundRequest->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
