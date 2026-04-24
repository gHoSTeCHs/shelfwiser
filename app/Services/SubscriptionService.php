<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Pagination\LengthAwarePaginator;

class SubscriptionService
{
    /**
     * @param  array{search?: string|null, plan?: string|null, status?: string|null}  $filters
     */
    public function getSubscriptions(array $filters): LengthAwarePaginator
    {
        return Tenant::query()
            ->with(['users' => fn ($q) => $q->where('is_tenant_owner', true)])
            ->select('id', 'name', 'subscription_plan', 'subscription_ends_at', 'is_active', 'created_at')
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($filters['plan'] ?? null, fn ($q, $plan) => $q->where('subscription_plan', $plan))
            ->when($filters['status'] ?? null, function ($q, $status) {
                match ($status) {
                    'active' => $q->where('is_active', true)->where(
                        fn ($inner) => $inner->whereNull('subscription_ends_at')
                            ->orWhere('subscription_ends_at', '>', now())
                    ),
                    'expired'  => $q->where('subscription_ends_at', '<', now()),
                    'inactive' => $q->where('is_active', false),
                    default    => null,
                };
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();
    }

    /**
     * @return array{total_subscriptions: int, active_subscriptions: int, expired_subscriptions: int, total_revenue: int}
     */
    public function getSubscriptionStats(): array
    {
        $counts = Tenant::query()
            ->selectRaw('count(*) as total')
            ->selectRaw('count(case when is_active = true and (subscription_ends_at is null or subscription_ends_at > now()) then 1 end) as active')
            ->selectRaw('count(case when subscription_ends_at < now() then 1 end) as expired')
            ->first();

        return [
            'total_subscriptions'   => (int) $counts->total,
            'active_subscriptions'  => (int) $counts->active,
            'expired_subscriptions' => (int) $counts->expired,
            'total_revenue'         => 0,
        ];
    }
}
