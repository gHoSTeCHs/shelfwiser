<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->value === 'super_admin';
    }

    public function view(User $user, Tenant $tenant): bool
    {
        if ($user->role->value === 'super_admin') {
            return true;
        }

        return $user->tenant_id === $tenant->id;
    }

    public function update(User $user, Tenant $tenant): bool
    {
        if ($user->tenant_id !== $tenant->id) {
            return false;
        }

        return $user->is_tenant_owner;
    }

    public function manageBilling(User $user, Tenant $tenant): bool
    {
        if ($user->tenant_id !== $tenant->id) {
            return false;
        }

        return $user->is_tenant_owner;
    }

    public function manageUsers(User $user, Tenant $tenant): bool
    {
        if ($user->tenant_id !== $tenant->id) {
            return false;
        }

        return $user->is_tenant_owner ||
               $user->role->hasPermission('manage_users');
    }

    public function manageSettings(User $user, Tenant $tenant): bool
    {
        if ($user->tenant_id !== $tenant->id) {
            return false;
        }

        return $user->is_tenant_owner;
    }

    public function suspend(User $user, Tenant $tenant): bool
    {
        return $user->role->value === 'super_admin';
    }

    public function delete(User $user, Tenant $tenant): bool
    {
        return $user->role->value === 'super_admin';
    }
}
