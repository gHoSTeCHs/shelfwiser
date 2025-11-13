<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * Display the dashboard
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Validate and parse query parameters
        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'period' => ['nullable', 'in:today,week,month,custom'],
            'from' => ['nullable', 'date', 'required_if:period,custom'],
            'to' => ['nullable', 'date', 'required_if:period,custom', 'after_or_equal:from'],
        ]);

        $shopId = $validated['shop'] ?? null;
        $period = $validated['period'] ?? 'today';
        $startDate = $validated['from'] ?? null;
        $endDate = $validated['to'] ?? null;

        // Get accessible shops for the user
        $accessibleShops = $this->getAccessibleShops($user);

        // Get base metrics from service
        $metrics = $this->dashboardService->getDashboardMetrics(
            $user,
            $shopId,
            $period,
            $startDate,
            $endDate
        );

        // Get shop IDs for additional queries
        $shopIds = $this->getShopIdsForMetrics($user, $shopId);

        // Add role-specific metrics for authorized users
        if ($user->role->hasPermission('view_financials')) {
            $dateRange = $this->dashboardService->getDateRange($period, $startDate, $endDate);

            $metrics['inventory_valuation'] = $this->dashboardService->getInventoryValuation($shopIds);
            $metrics['profit'] = $this->dashboardService->getProfitMetrics(
                $shopIds,
                $dateRange['start'],
                $dateRange['end']
            );
        }

        // Filter metrics based on user permissions
        $filteredMetrics = $this->filterMetricsByPermissions($metrics, $user);

        return Inertia::render('Dashboard', [
            'metrics' => $filteredMetrics,
            'shops' => $accessibleShops,
            'selectedShop' => $shopId,
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'permissions' => [
                'canViewProfits' => $user->role->hasPermission('view_profits'),
                'canViewCosts' => $user->role->hasPermission('view_costs'),
                'canViewFinancials' => $user->role->hasPermission('view_financials'),
            ],
        ]);
    }

    /**
     * Refresh dashboard cache
     */
    public function refresh(Request $request): RedirectResponse
    {
        $user = $request->user();
        $shopId = $request->query('shop');

        // Get shop IDs to clear cache for
        $shopIds = $this->getShopIdsForMetrics($user, $shopId);

        // Clear dashboard cache
        $this->dashboardService->clearCache($shopIds);

        return redirect()
            ->route('dashboard', $request->query())
            ->with('success', 'Dashboard data refreshed successfully');
    }

    /**
     * Get accessible shops for the user
     */
    protected function getAccessibleShops($user): Collection
    {
        // Tenant owners can access all shops
        if ($user->is_tenant_owner) {
            return \App\Models\Shop::where('tenant_id', $user->tenant_id)
                ->where('is_active', true)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        }

        // Other users: get their assigned shops
        return $user->shops()
            ->where('is_active', true)
            ->select('shops.id', 'shops.name')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get shop IDs for metrics queries
     */
    protected function getShopIdsForMetrics($user, ?int $shopId): Collection
    {
        // Tenant owners can access all shops
        if ($user->is_tenant_owner) {
            $query = \App\Models\Shop::where('tenant_id', $user->tenant_id);

            if ($shopId) {
                $query->where('id', $shopId);
            }

            return $query->pluck('id');
        }

        // Other users: get their assigned shops
        $assignedShopIds = $user->shops()->pluck('shops.id');

        if ($shopId) {
            // Verify user has access to requested shop
            if (!$assignedShopIds->contains($shopId)) {
                abort(403, 'You do not have access to this shop');
            }
            return collect([$shopId]);
        }

        return $assignedShopIds;
    }

    /**
     * Filter metrics based on user permissions
     */
    protected function filterMetricsByPermissions(array $metrics, $user): array
    {
        $filtered = $metrics;

        // Remove sensitive financial data for users without proper permissions
        if (!$user->role->hasPermission('view_profits')) {
            // Remove profit information from top products
            if (isset($filtered['top_products'])) {
                $filtered['top_products'] = $filtered['top_products']->map(function ($product) {
                    unset($product['profit']);
                    unset($product['margin_percentage']);
                    return $product;
                });
            }

            // Remove profit metrics
            unset($filtered['profit']);
        }

        if (!$user->role->hasPermission('view_costs')) {
            // Remove cost information
            if (isset($filtered['profit'])) {
                unset($filtered['profit']['cogs']);
            }
        }

        if (!$user->role->hasPermission('view_financials')) {
            // Remove inventory valuation
            unset($filtered['inventory_valuation']);
        }

        return $filtered;
    }
}
