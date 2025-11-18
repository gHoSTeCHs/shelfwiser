<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin dashboard with platform statistics.
     */
    public function index(): Response
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::where('is_active', true)->count(),
            'trial_tenants' => Tenant::where('subscription_plan', 'trial')->count(),
            'total_users' => User::where('is_super_admin', false)->count(),
            'total_shops' => Shop::count(),
            'total_products' => Product::count(),
            'total_orders' => Order::count(),
        ];

        $subscriptionBreakdown = [
            'trial' => Tenant::where('subscription_plan', 'trial')->count(),
            'basic' => Tenant::where('subscription_plan', 'basic')->count(),
            'professional' => Tenant::where('subscription_plan', 'professional')->count(),
            'enterprise' => Tenant::where('subscription_plan', 'enterprise')->count(),
        ];

        $recentTenants = Tenant::with('users')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'owner_email' => $tenant->owner_email,
                'subscription_plan' => $tenant->subscription_plan,
                'is_active' => $tenant->is_active,
                'users_count' => $tenant->users->count(),
                'created_at' => $tenant->created_at->format('Y-m-d H:i'),
            ]);

        $expiringTrials = Tenant::where('subscription_plan', 'trial')
            ->where('trial_ends_at', '<=', now()->addDays(7))
            ->where('trial_ends_at', '>', now())
            ->orderBy('trial_ends_at')
            ->take(10)
            ->get()
            ->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'owner_email' => $tenant->owner_email,
                'trial_ends_at' => $tenant->trial_ends_at->format('Y-m-d'),
                'days_remaining' => $tenant->getRemainingDays(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'subscriptionBreakdown' => $subscriptionBreakdown,
            'recentTenants' => $recentTenants,
            'expiringTrials' => $expiringTrials,
        ]);
    }
}
