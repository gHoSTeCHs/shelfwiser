<?php

namespace App\Policies;

use App\Models\OrderReturn;
use App\Models\User;

class OrderReturnPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_orders') ||
               $user->role->hasPermission('process_orders');
    }

    public function view(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_orders') && ! $user->role->hasPermission('process_orders')) {
            return false;
        }

        $shopId = $return->order?->shop_id;
        if ($shopId === null) {
            return false;
        }

        return $user->role->canAccessMultipleStores() ||
               $user->shops()->where('shops.id', $shopId)->exists();
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_orders') ||
               $user->role->hasPermission('process_orders');
    }

    public function manage(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        if ($user->is_tenant_owner) {
            return true;
        }

        if (! $user->role->hasPermission('manage_orders') && ! $user->role->hasPermission('process_orders')) {
            return false;
        }

        $shopId = $return->order?->shop_id;
        if ($shopId === null) {
            return false;
        }

        return $user->role->canAccessMultipleStores() ||
               $user->shops()->where('shops.id', $shopId)->exists();
    }

    public function delete(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
