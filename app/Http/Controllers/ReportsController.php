<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Models\ProductCategory;
use App\Models\Shop;
use App\Policies\DashboardPolicy;
use App\Services\DashboardService;
use App\Services\ExportService;
use App\Services\ReportService;
use Carbon\Carbon;
use Gate;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function __construct(
        protected ReportService    $reportService,
        protected DashboardService $dashboardService,
        protected ExportService    $exportService
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
        Gate::authorize('reports.view');

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
    public function exportSales(Request $request): StreamedResponse|BinaryFileResponse|\Illuminate\Http\Response
    {
        $user = $request->user();

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
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

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
            1000 // Get more records for export
        );

        $formatted = $this->exportService->formatSalesExport(collect($salesData->items()), $validated['group_by'] ?? 'order');

        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'excel' => $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], "sales-report-$timestamp.xlsx"),
            'pdf' => $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], "sales-report-$timestamp.pdf", 'Sales Report'),
            default => $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], "sales-report-$timestamp.csv"),
        };
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
    public function exportInventory(Request $request): StreamedResponse|BinaryFileResponse|\Illuminate\Http\Response
    {
        $user = $request->user();

        if (!$user->role->hasPermission('reports.view')) {
            abort(403, 'You do not have permission to view reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'stock_status' => ['nullable', 'in:low,adequate,overstocked'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);

        $inventoryData = $this->reportService->getInventoryReport(
            $shopIds,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['stock_status'] ?? null,
            1000 // Get more records for export
        );

        $formatted = $this->exportService->formatInventoryExport(collect($inventoryData->items()));

        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'excel' => $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], "inventory-report-$timestamp.xlsx"),
            'pdf' => $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], "inventory-report-$timestamp.pdf", 'Inventory Report'),
            default => $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], "inventory-report-$timestamp.csv"),
        };
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
    public function exportSuppliers(Request $request): StreamedResponse|BinaryFileResponse|\Illuminate\Http\Response
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
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $supplierData = $this->reportService->getSupplierReport(
            $user->tenant_id,
            $shopIds,
            $startDate,
            $endDate,
            $validated['supplier'] ?? null,
            $validated['status'] ?? null,
            $validated['payment_status'] ?? null,
            1000 // Get more records for export
        );

        $formatted = $this->exportService->formatSupplierExport(collect($supplierData->items()));

        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'excel' => $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], "supplier-report-$timestamp.xlsx"),
            'pdf' => $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], "supplier-report-$timestamp.pdf", 'Supplier Report'),
            default => $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], "supplier-report-$timestamp.csv"),
        };
    }

    /**
     * Financial Report
     */
    public function financials(Request $request): Response
    {
        $user = $request->user();

        if (!$user->can('dashboard.view_financials', DashboardPolicy::class)) {
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
    public function exportFinancials(Request $request): StreamedResponse|BinaryFileResponse|\Illuminate\Http\Response
    {
        $user = $request->user();

        if (!$user->can('dashboard.view_financials', DashboardPolicy::class)) {
            abort(403, 'You do not have permission to view financial reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $financialData = $this->reportService->getFinancialReport($shopIds, $startDate, $endDate);

        $formatted = $this->exportService->formatFinancialExport(
            $financialData,
            $validated['from'] ?? $startDate->format('Y-m-d'),
            $validated['to'] ?? $endDate->format('Y-m-d')
        );

        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'excel' => $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], "financial-report-$timestamp.xlsx"),
            'pdf' => $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], "financial-report-$timestamp.pdf", 'Financial Report'),
            default => $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], "financial-report-$timestamp.csv"),
        };
    }

    /**
     * Customer Analytics Report
     */
    public function customerAnalytics(Request $request): Response
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'customer' => ['nullable', 'integer', 'exists:users,id'],
            'segment' => ['nullable', 'in:all,high_value,at_risk,inactive'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);
        $shops = $this->getAccessibleShops($user);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $summary = $this->reportService->getCustomerAnalyticsSummary($shopIds, $startDate, $endDate);

        $customerData = $this->reportService->getCustomerAnalytics(
            $shopIds,
            $startDate,
            $endDate,
            $validated['customer'] ?? null,
            $validated['segment'] ?? 'all',
            $validated['per_page'] ?? 25
        );

        return Inertia::render('reports/customer-analytics', [
            'summary' => $summary,
            'customerData' => $customerData,
            'shops' => $shops,
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $validated['from'] ?? $startDate->format('Y-m-d'),
                'to' => $validated['to'] ?? $endDate->format('Y-m-d'),
                'customer' => $validated['customer'] ?? null,
                'segment' => $validated['segment'] ?? 'all',
            ],
        ]);
    }

    /**
     * Export Customer Analytics
     */
    public function exportCustomerAnalytics(Request $request): StreamedResponse|BinaryFileResponse|\Illuminate\Http\Response
    {
        $user = $request->user();

        if (!$user->role->hasPermission('view_reports')) {
            abort(403, 'You do not have permission to view reports');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'customer' => ['nullable', 'integer', 'exists:users,id'],
            'segment' => ['nullable', 'in:all,high_value,at_risk,inactive'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $customerData = $this->reportService->getCustomerAnalytics(
            $shopIds,
            $startDate,
            $endDate,
            $validated['customer'] ?? null,
            $validated['segment'] ?? 'all',
            1000
        );

        $formatted = $this->exportService->formatCustomerAnalyticsExport(collect($customerData->items()));

        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'excel' => $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], "customer-analytics-$timestamp.xlsx"),
            'pdf' => $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], "customer-analytics-$timestamp.pdf", 'Customer Analytics'),
            default => $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], "customer-analytics-$timestamp.csv"),
        };
    }

    /**
     * Product Profitability Report
     */
    public function productProfitability(Request $request): Response
    {
        $user = $request->user();

        if (!$user->can('dashboard.view_financials', DashboardPolicy::class)) {
            abort(403, 'You do not have permission to view product profitability');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'sort_by' => ['nullable', 'in:profit,margin,revenue,quantity'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);
        $shops = $this->getAccessibleShops($user);
        $categories = ProductCategory::where('tenant_id', $user->tenant_id)->get(['id', 'name']);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $summary = $this->reportService->getProductProfitabilitySummary($shopIds, $startDate, $endDate);

        $productData = $this->reportService->getProductProfitability(
            $shopIds,
            $startDate,
            $endDate,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['sort_by'] ?? 'profit',
            $validated['per_page'] ?? 25
        );

        return Inertia::render('reports/product-profitability', [
            'summary' => $summary,
            'productData' => $productData,
            'shops' => $shops,
            'categories' => $categories,
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $validated['from'] ?? $startDate->format('Y-m-d'),
                'to' => $validated['to'] ?? $endDate->format('Y-m-d'),
                'category' => $validated['category'] ?? null,
                'product' => $validated['product'] ?? null,
                'sort_by' => $validated['sort_by'] ?? 'profit',
            ],
        ]);
    }

    /**
     * Export Product Profitability
     */
    public function exportProductProfitability(Request $request): StreamedResponse|BinaryFileResponse|\Illuminate\Http\Response
    {
        $user = $request->user();

        if (!$user->can('dashboard.view_financials', DashboardPolicy::class)) {
            abort(403, 'You do not have permission to view product profitability');
        }

        $validated = $request->validate([
            'shop' => ['nullable', 'integer', 'exists:shops,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'product' => ['nullable', 'integer', 'exists:products,id'],
            'sort_by' => ['nullable', 'in:profit,margin,revenue,quantity'],
            'format' => ['nullable', 'in:csv,excel,pdf'],
        ]);

        $format = $validated['format'] ?? 'csv';
        $shopIds = $this->getAccessibleShopIds($user, $validated['shop'] ?? null);

        $startDate = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : now()->endOfMonth();

        $productData = $this->reportService->getProductProfitability(
            $shopIds,
            $startDate,
            $endDate,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['sort_by'] ?? 'profit',
            1000
        );

        $formatted = $this->exportService->formatProductProfitabilityExport(collect($productData->items()));

        $timestamp = now()->format('Y-m-d-His');

        return match ($format) {
            'excel' => $this->exportService->exportToExcel($formatted['headers'], $formatted['rows'], "product-profitability-$timestamp.xlsx"),
            'pdf' => $this->exportService->exportToPdf($formatted['headers'], $formatted['rows'], "product-profitability-$timestamp.pdf", 'Product Profitability'),
            default => $this->exportService->exportToCsv($formatted['headers'], $formatted['rows'], "product-profitability-$timestamp.csv"),
        };
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
