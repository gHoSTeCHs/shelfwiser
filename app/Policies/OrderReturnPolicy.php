<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\OrderReturn;
use App\Models\User;

class OrderReturnPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_returns') ||
               $user->role->hasPermission('manage_returns');
    }

    public function view(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('view_returns') ||
               $user->role->hasPermission('manage_returns');
    }

    public function create(User $user): bool
    {
        return $user->role->hasPermission('create_returns') ||
               $user->role->hasPermission('manage_returns');
    }

    public function update(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        if (! in_array($return->status, ['pending', 'under_review'])) {
            return false;
        }

        return $user->role->hasPermission('manage_returns');
    }

    public function approve(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        if ($user->role->level() < UserRole::STORE_MANAGER->level()) {
            return false;
        }

        if ($return->status !== 'under_review') {
            return false;
        }

        return $user->role->hasPermission('approve_returns');
    }

    public function reject(User $user, OrderReturn $return): bool
    {
        return $this->approve($user, $return);
    }

    public function process(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        if ($return->status !== 'approved') {
            return false;
        }

        return $user->role->hasPermission('manage_returns');
    }

    public function cancel(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        if (in_array($return->status, ['completed', 'cancelled'])) {
            return false;
        }

        return $user->role->hasPermission('manage_returns');
    }

    public function delete(User $user, OrderReturn $return): bool
    {
        if ($user->tenant_id !== $return->tenant_id) {
            return false;
        }

        return $user->is_tenant_owner;
    }
}
