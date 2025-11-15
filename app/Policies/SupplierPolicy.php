<?php

namespace App\Policies;

use App\Models\SupplierProfile;
use App\Models\Tenant;
use App\Models\User;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_supplier_profile') ||
               $user->role->hasPermission('manage_supplier_catalog');
    }

    public function view(User $user, SupplierProfile $profile): bool
    {
        return $user->tenant_id === $profile->tenant_id &&
               ($user->role->hasPermission('manage_supplier_profile') ||
                $user->role->hasPermission('manage_supplier_catalog'));
    }

    public function enableSupplierMode(User $user, Tenant $tenant): bool
    {
        return $user->tenant_id === $tenant->id &&
               $user->role->hasPermission('manage_supplier_profile');
    }

    public function updateProfile(User $user, SupplierProfile $profile): bool
    {
        return $user->tenant_id === $profile->tenant_id &&
               $user->role->hasPermission('manage_supplier_profile');
    }

    public function manageCatalog(User $user, Tenant $tenant): bool
    {
        return $user->tenant_id === $tenant->id &&
               $user->role->hasPermission('manage_supplier_catalog');
    }

    public function viewCatalog(User $user, Tenant $supplierTenant): bool
    {
        if ($user->tenant_id === $supplierTenant->id) {
            return $user->role->hasPermission('manage_supplier_catalog');
        }

        return true;
    }
}
