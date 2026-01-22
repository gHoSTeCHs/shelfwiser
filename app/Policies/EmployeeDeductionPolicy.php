<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\EmployeeDeduction;
use App\Models\User;

class EmployeeDeductionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_payroll')
            || $user->role->hasPermission('manage_payroll');
    }

    public function view(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        if ($user->tenant_id !== $employeeDeduction->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        if ($user->role->value === UserRole::STORE_MANAGER->value) {
            $targetUser = $employeeDeduction->user;
            if (!$targetUser) {
                return false;
            }

            $userShopIds = $user->shops()->pluck('shops.id');
            $targetUserShopIds = $targetUser->shops()->pluck('shops.id');

            return $userShopIds->intersect($targetUserShopIds)->isNotEmpty();
        }

        return $user->id === $employeeDeduction->user_id;
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_payroll');
    }

    public function update(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        if ($user->tenant_id !== $employeeDeduction->tenant_id) {
            return false;
        }

        if (!$user->role->hasPermission('manage_payroll')) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        if ($user->role->value === UserRole::STORE_MANAGER->value) {
            $targetUser = $employeeDeduction->user;
            if (!$targetUser) {
                return false;
            }

            $userShopIds = $user->shops()->pluck('shops.id');
            $targetUserShopIds = $targetUser->shops()->pluck('shops.id');

            return $userShopIds->intersect($targetUserShopIds)->isNotEmpty();
        }

        return false;
    }

    public function delete(User $user, EmployeeDeduction $employeeDeduction): bool
    {
        if ($user->tenant_id !== $employeeDeduction->tenant_id) {
            return false;
        }

        if (!$user->role->hasPermission('manage_payroll')) {
            return false;
        }

        return in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value]);
    }
}
