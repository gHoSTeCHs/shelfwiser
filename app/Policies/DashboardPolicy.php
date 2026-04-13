<?php

namespace App\Policies;

use App\Models\User;

class DashboardPolicy
{
    public function view(User $user): bool
    {
        return $user->is_active;
    }

    public function viewFinancials(User $user): bool
    {
        return $user->role->hasPermission('view_financials');
    }

    public function viewProfits(User $user): bool
    {
        return $user->role->hasPermission('view_profits');
    }

    public function viewCosts(User $user): bool
    {
        return $user->role->hasPermission('view_costs');
    }

    public function refreshCache(User $user): bool
    {
        return $user->role->canAccessMultipleStores();
    }
}
