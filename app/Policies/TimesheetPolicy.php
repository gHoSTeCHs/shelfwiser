<?php

namespace App\Policies;

use App\Enums\TimesheetStatus;
use App\Enums\UserRole;
use App\Models\Timesheet;
use App\Models\User;

class TimesheetPolicy
{
    /**
     * Determine if user can view any timesheets
     */
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_timesheets');
    }

    /**
     * Determine if user can view a specific timesheet
     */
    public function view(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($user->id === $timesheet->user_id) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() > $timesheet->user->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($timesheet->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can create timesheets
     */
    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_timesheets');
    }

    /**
     * Determine if user can update a timesheet
     */
    public function update(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($user->id === $timesheet->user_id && $timesheet->status === TimesheetStatus::DRAFT) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return $timesheet->status === TimesheetStatus::DRAFT;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()
            && $user->role->level() > $timesheet->user->role->level()
            && $timesheet->status === TimesheetStatus::DRAFT) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($timesheet->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can clock in/out for themselves
     */
    public function clockInOut(User $user): bool
    {
        return $user->role->hasPermission('manage_timesheets');
    }

    /**
     * Determine if user can manage breaks for a timesheet
     */
    public function manageBreaks(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($user->id === $timesheet->user_id && $timesheet->status === TimesheetStatus::DRAFT) {
            return true;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()
            && $user->role->level() > $timesheet->user->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($timesheet->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can submit a timesheet for approval
     */
    public function submit(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($user->id !== $timesheet->user_id) {
            return false;
        }

        return $timesheet->status === TimesheetStatus::DRAFT;
    }

    /**
     * Determine if user can approve a timesheet
     */
    public function approve(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($user->id === $timesheet->user_id) {
            return false;
        }

        if (!$timesheet->status->canApprove()) {
            return false;
        }

        if ($user->is_tenant_owner) {
            return true;
        }

        if ($user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->role->level() >= UserRole::ASSISTANT_MANAGER->level()
            && $user->role->level() > $timesheet->user->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($timesheet->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can reject a timesheet
     */
    public function reject(User $user, Timesheet $timesheet): bool
    {
        return $this->approve($user, $timesheet);
    }

    /**
     * Determine if user can delete a timesheet
     */
    public function delete(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($timesheet->status === TimesheetStatus::APPROVED || $timesheet->status === TimesheetStatus::PAID) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        if ($user->id === $timesheet->user_id && $timesheet->status === TimesheetStatus::DRAFT) {
            return true;
        }

        if ($user->role->level() >= UserRole::STORE_MANAGER->level()
            && $user->role->level() > $timesheet->user->role->level()) {
            $userShops = $user->shops()->pluck('shops.id');
            return $userShops->contains($timesheet->shop_id);
        }

        return false;
    }

    /**
     * Determine if user can restore a soft-deleted timesheet
     */
    public function restore(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        if ($user->is_tenant_owner || $user->role === UserRole::GENERAL_MANAGER) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can permanently delete a timesheet
     */
    public function forceDelete(User $user, Timesheet $timesheet): bool
    {
        if ($user->tenant_id !== $timesheet->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
