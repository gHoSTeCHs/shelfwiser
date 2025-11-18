<?php

// app/Policies/ShopPolicy.php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Shop;
use App\Models\User;

class ShopPolicy
{
    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_stores');
    }

    public function view(User $user, Shop $shop): bool
    {
        return $user->tenant_id === $shop->tenant_id;
    }

    public function manage(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Owners and GMs can manage any shop
        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        // Others can only manage assigned shops
        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->role->value === UserRole::OWNER->value;
    }
}
