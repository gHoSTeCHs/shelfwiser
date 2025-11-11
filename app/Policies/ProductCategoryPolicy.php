<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ProductCategory;
use App\Models\User;

class ProductCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function view(User $user, ProductCategory $category): bool
    {
        return $user->tenant_id === $category->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function update(User $user, ProductCategory $category): bool
    {
        if ($user->tenant_id !== $category->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('manage_inventory');
    }

    public function delete(User $user, ProductCategory $category): bool
    {
        if ($user->tenant_id !== $category->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return false;
    }
}
