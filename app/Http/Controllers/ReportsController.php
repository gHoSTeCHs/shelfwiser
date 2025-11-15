<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Models\ProductCategory;
use App\Models\Shop;
use App\Models\Tenant;
use App\Policies\DashboardPolicy;
use App\Services\DashboardService;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function __construct(
        protected ReportService     $reportService,
        protected DashboardService  $dashboardService
    )
    {
    }

    /**
     * Sales Report
     */
    public function sales(Request $request): Response
    {
        $user = $request->user();

        // Check permission
        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'customer' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'in:' . implode(',', array_column(OrderStatus::cases(), 'value'))],
            'payment_status' => ['nullable', 'in:' . implode(',', array_column(PaymentStatus::cases(), 'value'))],
            'group_by' => ['nullable', 'in:order,product,customer,shop,day'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);
        $shops = $this->getAccessibleShops($user);
        $categories = ProductCategory::where('tenant_id', $user->tenant_id)->get(['id', 'name']);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $summary = $this->reportService->getSalesSummary($shopIds, $startDate, $endDate);

        $salesData = $this->reportService->getSalesReport(
            $shopIds,
            $startDate,
            $endDate,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['customer'] ?? null,
            $validated['status'] ?? null,
            $validated['payment_status'] ?? null,
            $validated['group_by'] ?? 'order',
            $validated['per_page'] ?? 25
        );

        return Inertia::render('reports/sales', [
            'summary' => $summary,
            'salesData' => $salesData,
            'shops' => $shops,
            'categories' => $categories,
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $validated['from'] ?? $startDate->format('Y-m-d'),
                'to' => $validated['to'] ?? $endDate->format('Y-m-d'),
                'category' => $validated['category'] ?? null,
                'product' => $validated['product'] ?? null,
                'customer' => $validated['customer'] ?? null,
                'status' => $validated['status'] ?? null,
                'payment_status' => $validated['payment_status'] ?? null,
                'group_by' => $validated['group_by'] ?? 'order',
            ],
            'orderStatuses' => OrderStatus::forSelect(),
            'paymentStatuses' => PaymentStatus::forSelect(),
            'canViewCosts' => $user->role->hasPermission('view_costs'),
            'canViewProfits' => $user->role->hasPermission('view_profits'),
        ]);
    }

    /**
     * Export Sales Report
     */
    public function exportSales(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        // TODO: Implement CSV export
        return response()->streamDownload(function () {
            echo "Export functionality coming soon";
        }, 'sales-report.csv');
    }

    /**
     * Inventory Report
     */
    public function inventory(Request $request): Response
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'stock_status' => ['nullable', 'in:low,adequate,overstocked'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);
        $shops = $this->getAccessibleShops($user);
        $categories = ProductCategory::where('tenant_id', $user->tenant_id)->get(['id', 'name']);

        $summary = $this->reportService->getInventorySummary($shopIds);

        $inventoryData = $this->reportService->getInventoryReport(
            $shopIds,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['stock_status'] ?? null,
            $validated['per_page'] ?? 25
        );

        return Inertia::render('reports/inventory', [
            'summary' => $summary,
            'inventoryData' => $inventoryData,
            'shops' => $shops,
            'categories' => $categories,
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'category' => $validated['category'] ?? null,
                'product' => $validated['product'] ?? null,
                'stock_status' => $validated['stock_status'] ?? null,
            ],
            'canViewCosts' => $user->role->hasPermission('view_costs'),
        ]);
    }

    /**
     * Export Inventory Report
     */
    public function exportInventory(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        // TODO: Implement CSV export
        return response()->streamDownload(function () {
            echo "Export functionality coming soon";
        }, 'inventory-report.csv');
    }

    /**
     * Supplier Report
     */
    public function suppliers(Request $request): Response
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'supplier' => ['nullable', 'integer', 'exists:tenants,id'],
            'status' => ['nullable', 'in:' . implode(',', array_column(PurchaseOrderStatus::cases(), 'value'))],
            'payment_status' => ['nullable', 'in:' . implode(',', array_column(PurchaseOrderPaymentStatus::cases(), 'value'))],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);
        $shops = $this->getAccessibleShops($user);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $performanceSummary = $this->reportService->getSupplierPerformanceSummary(
            $user->tenant_id,
            $shopIds,
            $startDate,
            $endDate
        );

        $supplierData = $this->reportService->getSupplierReport(
            $user->tenant_id,
            $shopIds,
            $startDate,
            $endDate,
            $validated['supplier'] ?? null,
            $validated['status'] ?? null,
            $validated['payment_status'] ?? null,
            $validated['per_page'] ?? 25
        );

        return Inertia::render('reports/suppliers', [
            'performanceSummary' => $performanceSummary,
            'supplierData' => $supplierData,
            'shops' => $shops,
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $validated['from'] ?? $startDate->format('Y-m-d'),
                'to' => $validated['to'] ?? $endDate->format('Y-m-d'),
                'supplier' => $validated['supplier'] ?? null,
                'status' => $validated['status'] ?? null,
                'payment_status' => $validated['payment_status'] ?? null,
            ],
            'poStatuses' => PurchaseOrderStatus::forSelect(),
            'paymentStatuses' => PurchaseOrderPaymentStatus::forSelect(),
            'canViewCosts' => $user->role->hasPermission('view_costs'),
        ]);
    }

    /**
     * Export Supplier Report
     */
    public function exportSuppliers(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        // TODO: Implement CSV export
        return response()->streamDownload(function () {
            echo "Export functionality coming soon";
        }, 'supplier-report.csv');
    }

    /**
     * Financial Report
     */
    public function financials(Request $request): Response
    {
        $user = $request->user();

        if (!$user->can('viewFinancials', DashboardPolicy::class)) {
            abort(403, 'You do not have permission to view financial reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);
        $shops = $this->getAccessibleShops($user);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $financialData = $this->reportService->getFinancialReport($shopIds, $startDate, $endDate);

        return Inertia::render('reports/financials', [
            'financialData' => $financialData,
            'shops' => $shops,
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $validated['from'] ?? $startDate->format('Y-m-d'),
                'to' => $validated['to'] ?? $endDate->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Export Financial Report
     */
    public function exportFinancials(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (!$user->can('viewFinancials', DashboardPolicy::class)) {
            abort(403, 'You do not have permission to view financial reports');
        }

        // TODO: Implement PDF export
        return response()->streamDownload(function () {
            echo "Export functionality coming soon";
        }, 'financial-report.pdf');
    }

    /**
     * Get accessible shops for the user
     */
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

    /**
     * Get accessible shop IDs for metrics
     */
    protected function getAccessibleShopIds($user, ?int $shopId): Collection
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
}
