<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminTenantController extends Controller
{
    /**
     * Display a listing of tenants.
     */
    public function index(Request $request): Response
    {
        $query = Tenant::query()
            ->withCount(['users', 'shops']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('owner_email', 'like', "%{$search}%");
            });
        }

        if ($plan = $request->input('plan')) {
            $query->where('subscription_plan', $plan);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $tenants = $query->latest()
            ->paginate(20)
            ->through(fn ($tenant) => [
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

        return Inertia::render('Admin/Tenants/Index', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'plan', 'is_active']),
        ]);
    }

    /**
     * Show the form for creating a new tenant.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Tenants/Create', [
            'subscriptionPlans' => $this->getSubscriptionPlans(),
        ]);
    }

    /**
     * Store a newly created tenant.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:tenants,slug'],
            'owner_email' => ['required', 'email', 'max:255'],
            'business_type' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subscription_plan' => ['required', 'string', Rule::in(['trial', 'basic', 'professional', 'enterprise'])],
            'max_shops' => ['required', 'integer', 'min:1'],
            'max_users' => ['required', 'integer', 'min:1'],
            'max_products' => ['required', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ]);

        $tenant = Tenant::create([
            ...$validated,
            'slug' => Str::slug($validated['slug']),
            'trial_ends_at' => $validated['subscription_plan'] === 'trial'
                ? now()->addDays(14)
                : null,
            'subscription_ends_at' => $validated['subscription_plan'] !== 'trial'
                ? now()->addMonth()
                : null,
        ]);

        return redirect()
            ->route('admin.tenants.show', $tenant)
            ->with('success', 'Tenant created successfully.');
    }

    /**
     * Display the specified tenant.
     */
    public function show(Tenant $tenant): Response
    {
        $tenant->loadCount(['users', 'shops']);
        $tenant->load(['users' => fn ($q) => $q->select('id', 'tenant_id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'created_at')->latest()->take(10)]);
        $tenant->load(['shops' => fn ($q) => $q->select('id', 'tenant_id', 'name', 'is_active', 'created_at')->latest()->take(10)]);

        return Inertia::render('Admin/Tenants/Show', [
            'tenant' => [
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
            ],
        ]);
    }

    /**
     * Show the form for editing the specified tenant.
     */
    public function edit(Tenant $tenant): Response
    {
        return Inertia::render('Admin/Tenants/Edit', [
            'tenant' => [
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
            ],
            'subscriptionPlans' => $this->getSubscriptionPlans(),
        ]);
    }

    /**
     * Update the specified tenant.
     */
    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('tenants', 'slug')->ignore($tenant->id)],
            'owner_email' => ['required', 'email', 'max:255'],
            'business_type' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subscription_plan' => ['required', 'string', Rule::in(['trial', 'basic', 'professional', 'enterprise'])],
            'max_shops' => ['required', 'integer', 'min:1'],
            'max_users' => ['required', 'integer', 'min:1'],
            'max_products' => ['required', 'integer', 'min:1'],
            'is_active' => ['boolean'],
            'trial_ends_at' => ['nullable', 'date'],
            'subscription_ends_at' => ['nullable', 'date'],
        ]);

        $tenant->update([
            ...$validated,
            'slug' => Str::slug($validated['slug']),
        ]);

        return redirect()
            ->route('admin.tenants.show', $tenant)
            ->with('success', 'Tenant updated successfully.');
    }

    /**
     * Remove the specified tenant.
     */
    public function destroy(Tenant $tenant): RedirectResponse
    {
        $tenant->delete();

        return redirect()
            ->route('admin.tenants.index')
            ->with('success', 'Tenant deleted successfully.');
    }

    /**
     * Toggle tenant active status.
     */
    public function toggleActive(Tenant $tenant): RedirectResponse
    {
        $tenant->update(['is_active' => !$tenant->is_active]);

        $status = $tenant->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Tenant {$status} successfully.");
    }

    /**
     * Extend tenant subscription or trial.
     */
    public function extendSubscription(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        if ($tenant->subscription_plan === 'trial') {
            $tenant->update([
                'trial_ends_at' => ($tenant->trial_ends_at ?? now())->addDays($validated['days']),
            ]);
        } else {
            $tenant->update([
                'subscription_ends_at' => ($tenant->subscription_ends_at ?? now())->addDays($validated['days']),
            ]);
        }

        return back()->with('success', "Subscription extended by {$validated['days']} days.");
    }

    /**
     * Update tenant limits.
     */
    public function updateLimits(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'max_shops' => ['required', 'integer', 'min:1'],
            'max_users' => ['required', 'integer', 'min:1'],
            'max_products' => ['required', 'integer', 'min:1'],
        ]);

        $tenant->update($validated);

        return back()->with('success', 'Tenant limits updated successfully.');
    }

    /**
     * Get available subscription plans with limits.
     */
    private function getSubscriptionPlans(): array
    {
        return [
            'trial' => [
                'label' => 'Trial',
                'max_shops' => 1,
                'max_users' => 3,
                'max_products' => 50,
            ],
            'basic' => [
                'label' => 'Basic',
                'max_shops' => 2,
                'max_users' => 10,
                'max_products' => 500,
            ],
            'professional' => [
                'label' => 'Professional',
                'max_shops' => 5,
                'max_users' => 25,
                'max_products' => 2000,
            ],
            'enterprise' => [
                'label' => 'Enterprise',
                'max_shops' => 20,
                'max_users' => 100,
                'max_products' => 10000,
            ],
        ];
    }
}
