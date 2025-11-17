<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\User;

class OrderPaymentPolicy
{
    /**
     * Determine if user can view order payments
     */
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_orders');
    }

    /**
     * Determine if user can view a specific payment
     */
    public function view(User $user, OrderPayment $orderPayment): bool
    {
        if ($user->tenant_id !== $orderPayment->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $orderPayment->shop_id)->exists();
    }

    /**
     * Determine if user can record payment for an order
     */
    public function create(User $user, ?Order $order = null): bool
    {
        if (!$user->role->hasPermission('manage_orders')) {
            return false;
        }

        if ($order && $user->tenant_id !== $order->tenant_id) {
            return false;
        }

        if ($order && !in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return $user->shops()->where('shops.id', $order->shop_id)->exists();
        }

        return true;
    }

    /**
     * Determine if user can delete a payment record
     */
    public function delete(User $user, OrderPayment $orderPayment): bool
    {
        if ($user->tenant_id !== $orderPayment->tenant_id) {
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
