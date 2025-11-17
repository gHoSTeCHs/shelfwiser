<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    /**
     * Determine if the user can create services
     */
    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_inventory');
    }

    /**
     * Determine if the user can view the service
     */
    public function view(User $user, Service $service): bool
    {
        if ($user->tenant_id !== $service->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $service->shop_id)->exists();
    }

    /**
     * Determine if the user can manage (update) the service
     */
    public function manage(User $user, Service $service): bool
    {
        if ($user->tenant_id !== $service->tenant_id) {
            return false;
        }

        if (in_array($user->role->value, [UserRole::OWNER->value, UserRole::GENERAL_MANAGER->value])) {
            return true;
        }

        return $user->shops()->where('shops.id', $service->shop_id)->exists();
    }

    /**
     * Determine if the user can delete the service
     */
    public function delete(User $user, Service $service): bool
    {
        if ($user->tenant_id !== $service->tenant_id) {
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
