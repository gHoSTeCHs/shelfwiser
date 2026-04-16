<?php

namespace App\Policies;

use App\Enums\OrderStatus;
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

    public function update(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if (! $order->status->canEdit()) {
            return false;
        }

        return $user->role->hasPermission('manage_orders');
    }

    public function cancel(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if (! $order->status->canCancel()) {
            return false;
        }

        if ($user->role->level() < UserRole::STORE_MANAGER->level()) {
            return false;
        }

        return $user->role->hasPermission('manage_orders');
    }

    public function refund(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if ($order->status !== OrderStatus::DELIVERED) {
            return false;
        }

        if ($user->role->level() < UserRole::GENERAL_MANAGER->level()) {
            return false;
        }

        return $user->role->hasPermission('manage_orders');
    }

    public function export(User $user): bool
    {
        return $user->role->hasPermission('export_orders') ||
               $user->role->hasPermission('manage_orders');
    }

    public function fulfill(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if ($order->status !== OrderStatus::CONFIRMED) {
            return false;
        }

        return $user->role->hasPermission('manage_orders');
    }

    public function ship(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if ($order->status !== OrderStatus::PACKED) {
            return false;
        }

        return $user->role->hasPermission('manage_orders');
    }

    public function handlePayment(User $user, Order $order): bool
    {
        if ($user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        if (! $user->role->hasPermission('manage_orders')) {
            return false;
        }

        return $user->shops()->where('shops.id', $order->shop_id)->exists();
    }
}
