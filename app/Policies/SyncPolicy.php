<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class SyncPolicy
{
    public function syncProducts(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    public function syncCustomers(User $user): bool
    {
        return $user->role->hasPermission('view_customers');
    }

    public function syncOrders(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        return $user->shops()->where('shops.id', $shop->id)->exists();
    }
}
