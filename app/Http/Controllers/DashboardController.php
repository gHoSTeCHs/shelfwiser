<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Policies\DashboardPolicy;
use App\Services\DashboardService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    )
    {
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        Gate::authorize('view', DashboardPolicy::class);

        $user = $request->user();

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

        $accessibleShops = $this->getAccessibleShops($user);

        $metrics = $this->dashboardService->getDashboardMetrics(
            $user,
            $shopId,
            $period,
            $startDate,
            $endDate
        );

        $shopIds = $this->getShopIdsForMetrics($user, $shopId);

        if ($user->can('viewFinancials', DashboardPolicy::class)) {
            $dateRange = $this->dashboardService->getDateRange($period, $startDate, $endDate);

            $metrics['inventory_valuation'] = $this->dashboardService->getInventoryValuation($shopIds);
            $metrics['profit'] = $this->dashboardService->getProfitMetrics(
                $shopIds,
                $dateRange['start'],
                $dateRange['end']
            );
        }

        $filteredMetrics = $this->filterMetricsByPermissions($metrics, $user);

        return Inertia::render('dashboard', [
            'metrics' => $filteredMetrics,
            'shops' => $accessibleShops->toArray(),
            'selectedShop' => $shopId,
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'can_view_financials' => $user->can('viewFinancials', DashboardPolicy::class),
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function refresh(Request $request): RedirectResponse
    {
        Gate::authorize('refreshCache', DashboardPolicy::class);

        $user = $request->user();
        $shopId = $request->query('shop');

        $shopIds = $this->getShopIdsForMetrics($user, $shopId);

        $this->dashboardService->clearCache($shopIds);

        return redirect()
            ->route('dashboard', $request->query())
            ->with('success', 'Dashboard data refreshed successfully');
    }

    protected function getAccessibleShops($user): Collection
    {
        if ($user->is_tenant_owner) {
            return Shop::query()->where('tenant_id', $user->tenant_id)
                ->where('is_active', true)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        }

        return $user->shops()
            ->where('is_active', true)
            ->select('shops.id', 'shops.name')
            ->orderBy('name')
            ->get();
    }

    protected function getShopIdsForMetrics($user, ?int $shopId): Collection
    {
        if ($user->is_tenant_owner) {
            $query = Shop::query()->where('tenant_id', $user->tenant_id);

            if ($shopId) {
                $query->where('id', $shopId);
            }

            return $query->pluck('id');
        }

        $assignedShopIds = $user->shops()->pluck('shops.id');

        if ($shopId) {
            if (!$assignedShopIds->contains($shopId)) {
                abort(403, 'You do not have access to this shop');
            }
            return collect([$shopId]);
        }

        return $assignedShopIds;
    }

    protected function filterMetricsByPermissions(array $metrics, $user): array
    {
        $filtered = $metrics;

        if (!$user->role->hasPermission('view_profits')) {
            if (isset($filtered['top_products'])) {
                $filtered['top_products'] = array_map(function ($product) {
                    unset($product['profit'], $product['margin_percentage']);
                    return $product;
                }, $filtered['top_products']);
            }

            unset($filtered['profit']);
        }

        if (!$user->role->hasPermission('view_costs') && isset($filtered['profit'])) {
            unset($filtered['profit']['cogs']);
        }

        if (!$user->role->hasPermission('view_financials')) {
            unset($filtered['inventory_valuation']);
        }

        return $filtered;
    }
}
