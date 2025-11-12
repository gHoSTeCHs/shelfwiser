<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_orders');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_orders');
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $order->shop_id)->exists();
    }

    public function manage(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $order->shop_id)->exists();
    }

    public function delete(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
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
}
