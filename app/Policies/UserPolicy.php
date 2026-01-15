<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_users') ||
               $user->role->hasPermission('manage_users');
    }

    public function view(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        if ($user->id === $model->id) {
            return true;
        }

        return $user->role->hasPermission('view_users') ||
               $user->role->hasPermission('manage_users');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('create_users') ||
               $user->is_tenant_owner;
    }

    public function update(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        if ($user->id === $model->id) {
            return true;
        }

        return $user->role->hasPermission('manage_users') ||
               $user->is_tenant_owner;
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        if ($user->id === $model->id) {
            return false;
        }

        return $user->is_tenant_owner;
    }

    public function resetPassword(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        if ($user->id === $model->id) {
            return true;
        }

        if ($user->role->level() < UserRole::GENERAL_MANAGER->level()) {
            return false;
        }

        return $user->role->hasPermission('manage_users');
    }

    public function impersonate(User $user, User $model): bool
    {
        if (! $user->is_tenant_owner) {
            return false;
        }

        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        if ($user->id === $model->id) {
            return false;
        }

        return true;
    }

    public function manageRoles(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        if (! $user->is_tenant_owner) {
            return false;
        }

        if ($model->is_tenant_owner && $user->id !== $model->id) {
            return false;
        }

        return true;
    }

    public function restore(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }

    public function forceDelete(User $user, User $model): bool
    {
        if ($user->tenant_id !== $model->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
