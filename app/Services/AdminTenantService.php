<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class AdminTenantService
{
    /**
     * @param  array{search?: ?string, plan?: ?string, is_active?: ?bool}  $filters
     */
    public function getPaginatedTenants(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        $query = Tenant::query()->withCount(['users', 'shops']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('owner_email', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['plan'])) {
            $query->where('subscription_plan', $filters['plan']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->latest()
            ->paginate($perPage)
            ->through(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'owner_email' => $tenant->owner_email,
                'subscription_plan' => $tenant->subscription_plan,
                'is_active' => $tenant->is_active,
                'users_count' => $tenant->users_count,
                'shops_count' => $tenant->shops_count,
                'max_users' => $tenant->max_users,
                'max_shops' => $tenant->max_shops,
                'max_products' => $tenant->max_products,
                'trial_ends_at' => $tenant->trial_ends_at?->format('Y-m-d'),
                'subscription_ends_at' => $tenant->subscription_ends_at?->format('Y-m-d'),
                'created_at' => $tenant->created_at->format('Y-m-d H:i'),
            ]);
    }

    public function createTenant(array $validated): Tenant
    {
        $isTrial = $validated['subscription_plan'] === 'trial';

        return Tenant::query()->create([
            ...$validated,
            'slug' => Str::slug($validated['slug']),
            'trial_ends_at' => $isTrial ? now()->addDays((int) config('subscription.trial_days', 14)) : null,
            'subscription_ends_at' => $isTrial ? null : now()->addMonth(),
        ]);
    }

    public function updateTenant(Tenant $tenant, array $validated): Tenant
    {
        $tenant->update([
            ...$validated,
            'slug' => Str::slug($validated['slug']),
        ]);

        return $tenant;
    }

    public function deleteTenant(Tenant $tenant): void
    {
        $tenant->delete();
    }

    public function toggleActive(Tenant $tenant): bool
    {
        $tenant->update(['is_active' => ! $tenant->is_active]);

        return $tenant->is_active;
    }

    public function extendSubscription(Tenant $tenant, int $days): void
    {
        if ($tenant->subscription_plan === 'trial') {
            $tenant->update([
                'trial_ends_at' => ($tenant->trial_ends_at ?? now())->addDays($days),
            ]);

            return;
        }

        $tenant->update([
            'subscription_ends_at' => ($tenant->subscription_ends_at ?? now())->addDays($days),
        ]);
    }

    public function updateLimits(Tenant $tenant, array $validated): void
    {
        $tenant->update($validated);
    }

    /**
     * Build the presentation payload for the admin tenant detail view.
     */
    public function getTenantDetails(Tenant $tenant): array
    {
        $tenant->loadCount(['users', 'shops']);
        $tenant->load([
            'users' => fn ($q) => $q
                ->select('id', 'tenant_id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'created_at')
                ->latest()
                ->take(10),
            'shops' => fn ($q) => $q
                ->select('id', 'tenant_id', 'name', 'is_active', 'created_at')
                ->latest()
                ->take(10),
        ]);

        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'owner_email' => $tenant->owner_email,
            'business_type' => $tenant->business_type,
            'phone' => $tenant->phone,
            'subscription_plan' => $tenant->subscription_plan,
            'is_active' => $tenant->is_active,
            'users_count' => $tenant->users_count,
            'shops_count' => $tenant->shops_count,
            'max_users' => $tenant->max_users,
            'max_shops' => $tenant->max_shops,
            'max_products' => $tenant->max_products,
            'trial_ends_at' => $tenant->trial_ends_at?->format('Y-m-d H:i'),
            'subscription_ends_at' => $tenant->subscription_ends_at?->format('Y-m-d H:i'),
            'is_on_trial' => $tenant->isOnTrial(),
            'has_active_subscription' => $tenant->hasActiveSubscription(),
            'remaining_days' => $tenant->getRemainingDays(),
            'created_at' => $tenant->created_at->format('Y-m-d H:i'),
            'updated_at' => $tenant->updated_at->format('Y-m-d H:i'),
            'users' => $tenant->users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role->label(),
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->format('Y-m-d'),
            ]),
            'shops' => $tenant->shops->map(fn ($shop) => [
                'id' => $shop->id,
                'name' => $shop->name,
                'is_active' => $shop->is_active,
                'created_at' => $shop->created_at->format('Y-m-d'),
            ]),
        ];
    }

    /**
     * Build the presentation payload for the admin tenant edit form.
     */
    public function getTenantForEdit(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'owner_email' => $tenant->owner_email,
            'business_type' => $tenant->business_type,
            'phone' => $tenant->phone,
            'subscription_plan' => $tenant->subscription_plan,
            'is_active' => $tenant->is_active,
            'max_users' => $tenant->max_users,
            'max_shops' => $tenant->max_shops,
            'max_products' => $tenant->max_products,
            'trial_ends_at' => $tenant->trial_ends_at?->format('Y-m-d'),
            'subscription_ends_at' => $tenant->subscription_ends_at?->format('Y-m-d'),
        ];
    }

    public function getSubscriptionPlans(): array
    {
        return config('subscription.plans', []);
    }
}
