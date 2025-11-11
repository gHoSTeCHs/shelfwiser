<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\StockMovement;
use App\Models\User;

class StockMovementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function view(User $user, StockMovement $stockMovement): bool
    {
        if ($user->tenant_id !== $stockMovement->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        $variant = $stockMovement->productVariant;
        if ($variant && $variant->product) {
            return $user->shops()->where('shops.id', $variant->product->shop_id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function adjustStock(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function transferStock(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    public function stockTake(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }
}
