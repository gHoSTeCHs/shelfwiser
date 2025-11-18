<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Shop;
use App\Models\User;

class StorefrontPolicy
{
    /**
     * Determine if the user can enable/disable storefront for a shop.
     * Only high-level users can toggle storefront on/off.
     */
    public function toggleStorefront(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Only Owner, General Manager, or Store Manager can toggle
        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
            UserRole::STORE_MANAGER->value,
        ]) && ($user->role->canAccessMultipleStores() || $user->shops()->where('shops.id', $shop->id)->exists());
    }

    /**
     * Determine if the user can configure storefront settings for a shop.
     * Store managers and above can configure their shop's storefront.
     */
    public function configureSettings(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Owner and General Manager can configure any shop
        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        // Store Manager and Assistant Manager can configure their own shop
        if (in_array($user->role->value, [
            UserRole::STORE_MANAGER->value,
            UserRole::ASSISTANT_MANAGER->value,
        ])) {
            return $user->shops()->where('shops.id', $shop->id)->exists();
        }

        return false;
    }

    /**
     * Determine if the user can view storefront analytics for a shop.
     */
    public function viewAnalytics(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Owner and General Manager can view any shop's analytics
        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        // Store Manager, Assistant Manager, and Sales Rep can view their shop's analytics
        if (in_array($user->role->value, [
            UserRole::STORE_MANAGER->value,
            UserRole::ASSISTANT_MANAGER->value,
            UserRole::SALES_REP->value,
        ])) {
            return $user->shops()->where('shops.id', $shop->id)->exists();
        }

        return false;
    }

    /**
     * Determine if the user can manage products for storefront (mark as available online).
     */
    public function manageProducts(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Must have manage_products permission
        if (! $user->role->hasPermission('manage_products')) {
            return false;
        }

        // Owner and General Manager can manage any shop
        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        // Others must be assigned to the shop
        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    /**
     * Determine if the user can toggle retail sales for wholesale shops.
     * Only high-level users can enable retail sales on wholesale shops.
     */
    public function toggleRetailSales(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Shop must be wholesale_only to toggle retail sales
        if (! $shop->wholesale_only) {
            return false;
        }

        // Only Owner and General Manager can toggle retail sales
        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
        ]);
    }

    /**
     * Determine if the user can manage orders from storefront.
     */
    public function manageOrders(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Must have process_orders permission
        if (! $user->role->hasPermission('process_orders')) {
            return false;
        }

        // Owner and General Manager can manage any shop
        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        // Others must be assigned to the shop
        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    /**
     * Determine if the user can view customer data from storefront.
     */
    public function viewCustomers(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Must have manage_customers permission
        if (! $user->role->hasPermission('manage_customers')) {
            return false;
        }

        // Owner and General Manager can view any shop's customers
        if ($user->role->canAccessMultipleStores()) {
            return true;
        }

        // Others must be assigned to the shop
        return $user->shops()->where('shops.id', $shop->id)->exists();
    }

    /**
     * Determine if the user can configure tax settings for a shop.
     */
    public function configureTax(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Only Owner and General Manager can configure tax settings
        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
        ]);
    }

    /**
     * Determine if the user can configure currency settings for a shop.
     */
    public function configureCurrency(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Only Owner and General Manager can configure currency settings
        return in_array($user->role->value, [
            UserRole::OWNER->value,
            UserRole::GENERAL_MANAGER->value,
        ]);
    }
}
