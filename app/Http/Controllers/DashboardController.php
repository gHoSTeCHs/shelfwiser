<?php

namespace App\Http\Controllers;

use App\Models\Shop;
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

    public function index(Request $request): Response
    {
        Gate::authorize('dashboard.view');

        $user = $request->user();

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'period' => ['nullable', 'in:today,week,month,custom'],
            'from' => ['nullable', 'date', 'required_if:period,custom'],
            'to' => ['nullable', 'date', 'required_if:period,custom', 'after_or_equal:from'],
            'tab' => ['nullable', 'in:overview,sales,inventory,suppliers,financials'],
        ]);

        $shopId = $validated['shop'] ?? null;
        $period = $validated['period'] ?? 'today';
        $startDate = $validated['from'] ?? null;
        $endDate = $validated['to'] ?? null;
        $activeTab = $validated['tab'] ?? 'overview';

        $accessibleShops = $this->getAccessibleShops($user);
        $shopIds = $this->getShopIdsForMetrics($user, $shopId);
        $dateRange = $this->dashboardService->getDateRange($period, $startDate, $endDate);

        $data = match ($activeTab) {
            'sales' => $this->getSalesTabData($user, $shopIds, $dateRange),
            'inventory' => $this->getInventoryTabData($user, $shopIds),
            'suppliers' => $this->getSuppliersTabData($user, $shopIds, $dateRange),
            'financials' => $this->getFinancialsTabData($user, $shopIds, $dateRange),
            default => $this->getOverviewData($user, $shopId, $shopIds, $period, $dateRange, $startDate, $endDate),
        };

        return Inertia::render('dashboard', [
            'activeTab' => $activeTab,
            'data' => $data,
            'shops' => $accessibleShops->toArray(),
            'selectedShop' => $shopId,
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'can_view_financials' => $user->can('dashboard.view_financials'),
        ]);
    }

    protected function getOverviewData($user, $shopId, Collection $shopIds, string $period, array $dateRange, $startDate, $endDate): array
    {
        $metrics = $this->dashboardService->getDashboardMetrics(
            $user,
            $shopId,
            $period,
            $startDate,
            $endDate
        );

        if ($user->can('viewFinancials')) {
            $metrics['inventory_valuation'] = $this->dashboardService->getInventoryValuation($shopIds);
            $metrics['profit'] = $this->dashboardService->getProfitMetrics(
                $shopIds,
                $dateRange['start'],
                $dateRange['end']
            );
        }

        return $this->filterMetricsByPermissions($metrics, $user);
    }

    protected function getSalesTabData($user, Collection $shopIds, array $dateRange): array
    {
        $data = $this->dashboardService->getSalesData($user, $shopIds, $dateRange['start'], $dateRange['end']);

        return $this->filterMetricsByPermissions($data, $user);
    }

    protected function getInventoryTabData($user, Collection $shopIds): array
    {
        $data = $this->dashboardService->getInventoryData($user, $shopIds);

        return $this->filterMetricsByPermissions($data, $user);
    }

    protected function getSuppliersTabData($user, Collection $shopIds, array $dateRange): array
    {
        $data = $this->dashboardService->getSupplierData($user, $shopIds, $dateRange['start'], $dateRange['end']);

        return $this->filterMetricsByPermissions($data, $user);
    }

    protected function getFinancialsTabData($user, Collection $shopIds, array $dateRange): array
    {
        if (!$user->can('dashboard.view_financials')) {
            abort(403, 'You do not have permission to view financial data');
        }

        $data = $this->dashboardService->getFinancialsData($user, $shopIds, $dateRange['start'], $dateRange['end']);

        return $this->filterMetricsByPermissions($data, $user);
    }

    /**
     * @throws AuthorizationException
     */
    public function refresh(Request $request): RedirectResponse
    {
        Gate::authorize('refreshCache');

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
