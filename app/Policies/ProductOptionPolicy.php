<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ProductOption;
use App\Models\User;

class ProductOptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_products');
    }

    public function view(User $user, ProductOption $option): bool
    {
        if ($user->tenant_id !== $option->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('manage_products');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_products');
    }

    public function update(User $user, ProductOption $option): bool
    {
        if ($user->tenant_id !== $option->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('manage_products');
    }

    public function delete(User $user, ProductOption $option): bool
    {
        if ($user->tenant_id !== $option->tenant_id) {
            return false;
        }

        return in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value]);
    }
}
