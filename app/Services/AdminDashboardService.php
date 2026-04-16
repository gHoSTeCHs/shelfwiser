<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Collection;

class AdminDashboardService
{
    /**
     * @return array{
     *     total_tenants: int,
     *     active_tenants: int,
     *     trial_tenants: int,
     *     total_users: int,
     *     total_shops: int,
     *     total_products: int,
     *     total_orders: int,
     * }
     */
    public function getPlatformStats(): array
    {
        $tenantCounts = Tenant::query()
            ->selectRaw('count(*) as total')
            ->selectRaw('count(case when is_active = true then 1 end) as active')
            ->selectRaw("count(case when subscription_plan = 'trial' then 1 end) as trial")
            ->first();

        return [
            'total_tenants' => (int) $tenantCounts->total,
            'active_tenants' => (int) $tenantCounts->active,
            'trial_tenants' => (int) $tenantCounts->trial,
            'total_users' => User::query()->where('is_super_admin', false)->count(),
            'total_shops' => Shop::query()->count(),
            'total_products' => Product::query()->count(),
            'total_orders' => Order::query()->count(),
        ];
    }

    /**
     * @return array{trial: int, basic: int, professional: int, enterprise: int}
     */
    public function getSubscriptionBreakdown(): array
    {
        $counts = Tenant::query()
            ->selectRaw('subscription_plan, count(*) as total')
            ->groupBy('subscription_plan')
            ->pluck('total', 'subscription_plan');

        return [
            'trial' => (int) $counts->get('trial', 0),
            'basic' => (int) $counts->get('basic', 0),
            'professional' => (int) $counts->get('professional', 0),
            'enterprise' => (int) $counts->get('enterprise', 0),
        ];
    }

    public function getRecentTenants(int $limit = 10): Collection
    {
        return Tenant::query()
            ->withCount('users')
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'owner_email' => $tenant->owner_email,
                'subscription_plan' => $tenant->subscription_plan,
                'is_active' => $tenant->is_active,
                'users_count' => $tenant->users_count,
                'created_at' => $tenant->created_at->format('Y-m-d H:i'),
            ]);
    }

    public function getExpiringTrials(int $limit = 10, int $days = 7): Collection
    {
        return Tenant::query()
            ->where('subscription_plan', 'trial')
            ->where('trial_ends_at', '<=', now()->addDays($days))
            ->where('trial_ends_at', '>', now())
            ->orderBy('trial_ends_at')
            ->take($limit)
            ->get()
            ->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'owner_email' => $tenant->owner_email,
                'trial_ends_at' => $tenant->trial_ends_at->format('Y-m-d'),
                'days_remaining' => $tenant->getRemainingDays(),
            ]);
    }
}
