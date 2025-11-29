<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubscriptionController extends Controller
{
    /**
     * Display subscription management page.
     */
    public function index(Request $request): Response
    {
        $subscriptions = Tenant::query()
            ->with(['users' => function ($query) {
                $query->where('is_tenant_owner', true);
            }])
            ->select('id', 'name', 'subscription_plan', 'subscription_ends_at', 'is_active', 'created_at')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->plan, function ($query, $plan) {
                $query->where('subscription_plan', $plan);
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true)
                        ->where(function ($q) {
                            $q->whereNull('subscription_ends_at')
                                ->orWhere('subscription_ends_at', '>', now());
                        });
                } elseif ($status === 'expired') {
                    $query->where('subscription_ends_at', '<', now());
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_subscriptions' => Tenant::count(),
            'active_subscriptions' => Tenant::where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('subscription_ends_at')
                        ->orWhere('subscription_ends_at', '>', now());
                })
                ->count(),
            'expired_subscriptions' => Tenant::where('subscription_ends_at', '<', now())->count(),
            'total_revenue' => 0, // TODO: Calculate from payment records
        ];

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'stats' => $stats,
            'filters' => $request->only(['search', 'plan', 'status']),
            'plans' => ['free', 'starter', 'professional', 'enterprise'],
        ]);
    }
}
