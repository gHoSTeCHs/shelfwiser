<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ProductVariant;
use App\Models\User;

class ProductVariantPolicy
{
    /**
     * Determine if the user can view the variant
     */
    public function view(User $user, ProductVariant $variant): bool
    {
        $product = $variant->product;

        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $product->shop_id)->exists();
    }

    /**
     * Determine if the user can update the variant
     */
    public function update(User $user, ProductVariant $variant): bool
    {
        $product = $variant->product;

        if ($user->tenant_id !== $product->tenant_id) {
            return false;
        }

        if (!$user->role->hasPermission('manage_products')) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $product->shop_id)->exists();
    }

    /**
     * Determine if the user can delete the variant
     */
    public function delete(User $user, ProductVariant $variant): bool
    {
        $product = $variant->product;

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
}
