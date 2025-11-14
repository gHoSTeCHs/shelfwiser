<?php

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;

class PurchaseOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_purchase_orders') ||
               $user->role->hasPermission('view_purchase_orders') ||
               $user->role->hasPermission('process_supplier_orders');
    }

    public function view(User $user, PurchaseOrder $po): bool
    {
        if ($user->tenant_id === $po->buyer_tenant_id) {
            return $user->role->hasPermission('manage_purchase_orders') ||
                   $user->role->hasPermission('view_purchase_orders');
        }

        if ($user->tenant_id === $po->supplier_tenant_id) {
            return $user->role->hasPermission('process_supplier_orders') ||
                   $user->role->hasPermission('manage_supplier_catalog');
        }

        return false;
    }

    public function create(User $user, Shop $shop): bool
    {
        return $user->tenant_id === $shop->tenant_id &&
               $user->role->hasPermission('manage_purchase_orders') &&
               ($user->isTenantOwner() || $user->shops->contains($shop));
    }

    public function update(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->buyer_tenant_id &&
               $po->status->canEdit() &&
               $user->role->hasPermission('manage_purchase_orders');
    }

    public function delete(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->buyer_tenant_id &&
               $po->status->canCancel() &&
               $user->role->hasPermission('manage_purchase_orders');
    }

    public function submit(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->buyer_tenant_id &&
               $po->status->canEdit() &&
               $user->role->hasPermission('manage_purchase_orders');
    }

    public function approve(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->supplier_tenant_id &&
               $po->status->canApprove() &&
               $user->role->hasPermission('process_supplier_orders');
    }

    public function ship(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->supplier_tenant_id &&
               $po->status->canShip() &&
               $user->role->hasPermission('process_supplier_orders');
    }

    public function receive(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->buyer_tenant_id &&
               $po->status->canReceive() &&
               $user->role->hasPermission('receive_stock');
    }

    public function cancel(User $user, PurchaseOrder $po): bool
    {
        if ($user->tenant_id === $po->buyer_tenant_id) {
            return $po->status->canCancel() &&
                   $user->role->hasPermission('manage_purchase_orders');
        }

        if ($user->tenant_id === $po->supplier_tenant_id) {
            return $po->status->canCancel() &&
                   $user->role->hasPermission('process_supplier_orders');
        }

        return false;
    }

    public function recordPayment(User $user, PurchaseOrder $po): bool
    {
        return $user->tenant_id === $po->buyer_tenant_id &&
               $user->role->hasPermission('manage_purchase_orders');
    }

    public function viewAsSupplier(User $user, Tenant $supplierTenant): bool
    {
        return $user->tenant_id === $supplierTenant->id &&
               $user->role->hasPermission('process_supplier_orders');
    }

    public function viewAsBuyer(User $user, Tenant $buyerTenant): bool
    {
        return $user->tenant_id === $buyerTenant->id &&
               ($user->role->hasPermission('manage_purchase_orders') ||
                $user->role->hasPermission('view_purchase_orders'));
    }
}
