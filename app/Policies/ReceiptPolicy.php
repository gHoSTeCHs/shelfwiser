<?php

namespace App\Policies;

use App\Models\Receipt;
use App\Models\User;

class ReceiptPolicy
{
    /**
     * Determine whether the user can view any receipts.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('view_orders') ||
               $user->role->hasPermission('manage_orders');
    }

    /**
     * Determine whether the user can view the receipt.
     */
    public function view(User $user, Receipt $receipt): bool
    {
        if ($user->tenant_id !== $receipt->tenant_id) {
            return false;
        }

        return $user->role->hasPermission('view_orders') ||
               $user->role->hasPermission('manage_orders');
    }
}
