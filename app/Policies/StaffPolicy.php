<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class StaffPolicy
{
    /**
     * Determine if the user can view staff list.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_users')
            || $user->role->hasPermission('manage_store_users');
    }

    /**
     * Determine if the user can view a specific staff member.
     */
    public function view(User $user, User $staff): bool
    {
        if ($user->tenant_id !== $staff->tenant_id) {
            return false;
        }

        // Owners and GMs can view all staff
        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        // Store managers can view staff in their shops
        if ($user->role->value === UserRole::STORE_MANAGER->value) {
            $userShopIds = $user->shops()->pluck('shops.id');
            $staffShopIds = $staff->shops()->pluck('shops.id');

            return $userShopIds->intersect($staffShopIds)->isNotEmpty();
        }

        return false;
    }

    /**
     * Determine if the user can create staff members.
     */
    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_users')
            || $user->role->hasPermission('manage_store_users');
    }

    /**
     * Determine if the user can update a staff member.
     */
    public function update(User $user, User $staff): bool
    {
        if ($user->tenant_id !== $staff->tenant_id) {
            return false;
        }

        // Can't update yourself through staff management
        if ($user->id === $staff->id) {
            return false;
        }

        // Can't modify the tenant owner
        if ($staff->is_tenant_owner) {
            return false;
        }

        // Only higher-level roles can modify lower-level roles
        if ($user->role->level() <= $staff->role->level()) {
            return false;
        }

        // Owners and GMs can update all staff
        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        // Store managers can update staff in their shops
        if ($user->role->value === UserRole::STORE_MANAGER->value) {
            $userShopIds = $user->shops()->pluck('shops.id');
            $staffShopIds = $staff->shops()->pluck('shops.id');

            return $userShopIds->intersect($staffShopIds)->isNotEmpty();
        }

        return false;
    }

    /**
     * Determine if the user can delete a staff member.
     */
    public function delete(User $user, User $staff): bool
    {
        if ($user->tenant_id !== $staff->tenant_id) {
            return false;
        }

        // Can't delete yourself
        if ($user->id === $staff->id) {
            return false;
        }

        // Can't delete the tenant owner
        if ($staff->is_tenant_owner) {
            return false;
        }

        // Only owners and general managers can delete staff
        return in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value]);
    }

    /**
     * Determine if the user can assign a specific role.
     */
    public function assignRole(User $user, UserRole $targetRole): bool
    {
        // No one can assign OWNER role
        if ($targetRole === UserRole::OWNER) {
            return false;
        }

        // Users can only assign roles lower than their own level
        return $user->role->level() > $targetRole->level();
    }
}
