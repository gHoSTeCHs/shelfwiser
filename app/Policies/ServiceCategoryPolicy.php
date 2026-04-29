<?php

namespace App\Policies;

use App\Models\ServiceCategory;
use App\Models\User;

class ServiceCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function update(User $user, ServiceCategory $category): bool
    {
        return $user->tenant_id === $category->tenant_id
            && $user->role->hasPermission('manage_inventory');
    }

    public function delete(User $user, ServiceCategory $category): bool
    {
        return $user->tenant_id === $category->tenant_id
            && $user->role->hasPermission('manage_inventory');
    }
}
