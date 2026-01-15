<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function view(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $product->shop_id)->exists();
    }

    public function manage(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $product->shop_id)->exists();
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        if ($user->role->value === UserRole::OWNER->value) {
            return true;
        }

        if ($user->role->value === UserRole::GENERAL_MANAGER->value) {
            return true;
        }

        return false;
    }

    public function update(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $product->shop_id)->exists();
    }

    public function restore(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner ||
               $user->role->value === UserRole::GENERAL_MANAGER->value;
    }

    public function forceDelete(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }

    public function duplicate(User $user, Product $product): bool
    {
        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        return $this->create($user);
    }
}
