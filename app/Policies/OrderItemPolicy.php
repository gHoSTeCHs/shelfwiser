<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\OrderItem;
use App\Models\User;

class OrderItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_orders');
    }

    public function view(User $user, OrderItem $orderItem): bool
    {
        if ($user->tenant_id !== $orderItem->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        if ($orderItem->order && $orderItem->order->shop_id) {
            return $user->shops()->where('shops.id', $orderItem->order->shop_id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_orders')
            || $user->role->hasPermission('process_orders');
    }

    public function update(User $user, OrderItem $orderItem): bool
    {
        if ($user->tenant_id !== $orderItem->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        if ($orderItem->order && $orderItem->order->shop_id) {
            return $user->shops()->where('shops.id', $orderItem->order->shop_id)->exists();
        }

        return false;
    }

    public function delete(User $user, OrderItem $orderItem): bool
    {
        if ($user->tenant_id !== $orderItem->tenant_id) {
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
