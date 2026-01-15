<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\HeldSale;
use App\Models\User;

class HeldSalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('process_sales')
            || $user->role->hasPermission('process_orders')
            || $user->role->hasPermission('manage_orders');
    }

    public function view(User $user, HeldSale $heldSale): bool
    {
        if ($user->tenant_id !== $heldSale->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $heldSale->shop_id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('process_sales')
            || $user->role->hasPermission('process_orders');
    }

    public function update(User $user, HeldSale $heldSale): bool
    {
        if ($user->tenant_id !== $heldSale->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $heldSale->shop_id)->exists();
    }

    public function delete(User $user, HeldSale $heldSale): bool
    {
        if ($user->tenant_id !== $heldSale->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        if ($user->role->value === UserRole::STORE_MANAGER->value) {
            return $user->shops()->where('shops.id', $heldSale->shop_id)->exists();
        }

        return false;
    }

    public function resume(User $user, HeldSale $heldSale): bool
    {
        if ($user->tenant_id !== $heldSale->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $heldSale->shop_id)->exists();
    }
}
