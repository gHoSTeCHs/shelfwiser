<?php

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

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    public function update(User $user, Shop $shop): bool
    {
        return $this->manage($user, $shop);
    }

    public function delete(User $user, Shop $shop): bool
    {
        return $user->role->value === UserRole::OWNER->value;
    }

    public function toggleStorefront(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
            UserRole::STORE_MANAGER->value,
        ]) && ($user->role->canAccessMultipleStores() || $user->shops()->where('shops.id', $shop->id)->exists());
    }

    public function configureSettings(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        if (in_array($user->role->value, [
            UserRole::STORE_MANAGER->value,
            UserRole::ASSISTANT_MANAGER->value,
        ])) {
            return $user->shops()->where('shops.id', $shop->id)->exists();
        }

        return false;
    }

    public function viewAnalytics(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        if (in_array($user->role->value, [
            UserRole::STORE_MANAGER->value,
            UserRole::ASSISTANT_MANAGER->value,
            UserRole::SALES_REP->value,
        ])) {
            return $user->shops()->where('shops.id', $shop->id)->exists();
        }

        return false;
    }

    public function manageProducts(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_products')) {
            return false;
        }

        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    public function toggleRetailSales(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        if (! $shop->wholesale_only) {
            return false;
        }

        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
        ]);
    }

    public function manageOrders(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('process_orders')) {
            return false;
        }

        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    public function viewCustomers(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('manage_customers')) {
            return false;
        }

        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    public function configureTax(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
        ]);
    }

    public function configureCurrency(User $user, Shop $shop): bool
    {
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
        ]);
    }
}
