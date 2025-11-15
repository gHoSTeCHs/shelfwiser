<?php

namespace App\Policies;

use App\Models\SupplierConnection;
use App\Models\Tenant;
use App\Models\User;

class SupplierConnectionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SupplierConnection $connection): bool
    {
        return $user->tenant_id === $connection->buyer_tenant_id ||
               $user->tenant_id === $connection->supplier_tenant_id;
    }

    public function create(User $user, Tenant $supplierTenant): bool
    {
        return $user->tenant_id !== $supplierTenant->id &&
               $user->role->hasPermission('manage_purchase_orders');
    }

    public function approve(User $user, SupplierConnection $connection): bool
    {
        if ($user->tenant_id !== $connection->supplier_tenant_id) {
            return false;
        }

        if (! $user->role->hasPermission('approve_supplier_connections')) {
            return false;
        }

        $supplierProfile = $connection->supplierTenant->supplierProfile;

        return $supplierProfile && $supplierProfile->canUserApproveConnection($user);
    }

    public function reject(User $user, SupplierConnection $connection): bool
    {
        return $this->approve($user, $connection);
    }

    public function suspend(User $user, SupplierConnection $connection): bool
    {
        return $user->tenant_id === $connection->supplier_tenant_id &&
               $user->role->hasPermission('approve_supplier_connections');
    }

    public function activate(User $user, SupplierConnection $connection): bool
    {
        return $this->suspend($user, $connection);
    }

    public function updateTerms(User $user, SupplierConnection $connection): bool
    {
        return $user->tenant_id === $connection->supplier_tenant_id &&
               $user->role->hasPermission('approve_supplier_connections');
    }
}
