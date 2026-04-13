<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardIndexRequest;
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
    ) {}

    public function index(DashboardIndexRequest $request): Response
    {
        Gate::authorize('dashboard.view');

        $user = $request->user();
        $validated = $request->validated();

        $shopId = $validated['shop'] ?? null;
        $period = $validated['period'] ?? 'today';
        $startDate = $validated['from'] ?? null;
        $endDate = $validated['to'] ?? null;
        $activeTab = $validated['tab'] ?? 'overview';

        $shopIds = $user->accessibleShopIds($shopId);
        $dateRange = $this->dashboardService->getDateRange($period, $startDate, $endDate);

        $data = match ($activeTab) {
            'sales' => $this->getSalesTabData($user, $shopIds, $dateRange),
            'inventory' => $this->getInventoryTabData($user, $shopIds),
            'suppliers' => $this->getSuppliersTabData($user, $shopIds, $dateRange),
            'financials' => $this->getFinancialsTabData($user, $shopIds, $dateRange),
            default => $this->getOverviewData($user, $shopIds, $dateRange),
        };

        return Inertia::render('dashboard', [
            'activeTab' => $activeTab,
            'data' => $data,
            'shops' => $user->accessibleShops()->toArray(),
            'selectedShop' => $shopId,
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'can_view_financials' => $user->can('dashboard.view_financials'),
        ]);
    }

    protected function getOverviewData($user, Collection $shopIds, array $dateRange): array
    {
        $metrics = $this->dashboardService->getDashboardMetrics($shopIds, $dateRange);

        if ($user->can('dashboard.view_financials')) {
            $metrics['inventory_valuation'] = $this->dashboardService->getInventoryValuation($shopIds);
            $metrics['profit'] = $this->dashboardService->getProfitMetrics(
                $shopIds,
                $dateRange['start'],
                $dateRange['end']
            );
        }

        return $this->filterMetrics($metrics, $user);
    }

    protected function getSalesTabData($user, Collection $shopIds, array $dateRange): array
    {
        $data = $this->dashboardService->getSalesData($user, $shopIds, $dateRange['start'], $dateRange['end']);

        return $this->filterMetrics($data, $user);
    }

    protected function getInventoryTabData($user, Collection $shopIds): array
    {
        $data = $this->dashboardService->getInventoryData($user, $shopIds);

        return $this->filterMetrics($data, $user);
    }

    protected function getSuppliersTabData($user, Collection $shopIds, array $dateRange): array
    {
        $data = $this->dashboardService->getSupplierData($user, $shopIds, $dateRange['start'], $dateRange['end']);

        return $this->filterMetrics($data, $user);
    }

    protected function getFinancialsTabData($user, Collection $shopIds, array $dateRange): array
    {
        if (! $user->can('dashboard.view_financials')) {
            abort(403, 'You do not have permission to view financial data');
        }

        $data = $this->dashboardService->getFinancialsData($user, $shopIds, $dateRange['start'], $dateRange['end']);

        return $this->filterMetrics($data, $user);
    }

    protected function filterMetrics(array $metrics, $user): array
    {
        return $this->dashboardService->filterMetricsByPermissions(
            $metrics,
            canViewProfits: $user->can('dashboard.view_profits'),
            canViewCosts: $user->can('dashboard.view_costs'),
            canViewFinancials: $user->can('dashboard.view_financials'),
        );
    }

    /**
     * @throws AuthorizationException
     */
    public function refresh(Request $request): RedirectResponse
    {
        Gate::authorize('dashboard.refresh_cache');

        $shopId = $request->query('shop');
        $shopIds = $request->user()->accessibleShopIds($shopId ? (int) $shopId : null);

        $this->dashboardService->clearCache($shopIds);

        return redirect()
            ->route('dashboard', $request->query())
            ->with('success', 'Dashboard data refreshed successfully');
    }
}
