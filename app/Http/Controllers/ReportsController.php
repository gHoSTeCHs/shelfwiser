<?php

namespace App\Http\Controllers;

use App\DTOs\DateRange;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Http\Requests\Reports\CustomerAnalyticsReportRequest;
use App\Http\Requests\Reports\FinancialReportRequest;
use App\Http\Requests\Reports\InventoryReportRequest;
use App\Http\Requests\Reports\ProductProfitabilityReportRequest;
use App\Http\Requests\Reports\SalesReportRequest;
use App\Http\Requests\Reports\SupplierReportRequest;
use App\Services\ExportService;
use App\Services\ReportService;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function __construct(
        protected ReportService $reportService,
        protected ExportService $exportService,
    ) {}

    /**
     * Sales Report
     */
    public function sales(SalesReportRequest $request): Response
    {
        Gate::authorize('reports.view');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        return Inertia::render('reports/sales', [
            'summary' => $this->reportService->getSalesSummary($shopIds, $dateRange->start, $dateRange->end),
            'salesData' => $this->reportService->getSalesReport(
                $shopIds,
                $dateRange->start,
                $dateRange->end,
                $validated['category'] ?? null,
                $validated['product'] ?? null,
                $validated['customer'] ?? null,
                $validated['status'] ?? null,
                $validated['payment_status'] ?? null,
                $validated['group_by'] ?? 'order',
                $validated['per_page'] ?? 25,
            ),
            'shops' => $user->accessibleShops(),
            'categories' => $this->reportService->getProductCategories(),
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $dateRange->start->format('Y-m-d'),
                'to' => $dateRange->end->format('Y-m-d'),
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
    public function exportSales(SalesReportRequest $request): StreamedResponse|BinaryFileResponse|HttpResponse
    {
        Gate::authorize('reports.view');

        $validated = $request->validated();
        $shopIds = $request->user()->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);
        $groupBy = $validated['group_by'] ?? 'order';

        $salesData = $this->reportService->getSalesReport(
            $shopIds,
            $dateRange->start,
            $dateRange->end,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['customer'] ?? null,
            $validated['status'] ?? null,
            $validated['payment_status'] ?? null,
            $groupBy,
            1000,
        );

        $formatted = $this->exportService->formatSalesExport(collect($salesData->items()), $groupBy);

        return $this->exportService->exportReport($formatted, $validated['format'] ?? 'csv', 'sales');
    }

    /**
     * Inventory Report
     */
    public function inventory(InventoryReportRequest $request): Response
    {
        Gate::authorize('reports.view');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);

        return Inertia::render('reports/inventory', [
            'summary' => $this->reportService->getInventorySummary($shopIds),
            'inventoryData' => $this->reportService->getInventoryReport(
                $shopIds,
                $validated['category'] ?? null,
                $validated['product'] ?? null,
                $validated['stock_status'] ?? null,
                $validated['per_page'] ?? 25,
            ),
            'shops' => $user->accessibleShops(),
            'categories' => $this->reportService->getProductCategories(),
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
    public function exportInventory(InventoryReportRequest $request): StreamedResponse|BinaryFileResponse|HttpResponse
    {
        Gate::authorize('reports.view');

        $validated = $request->validated();
        $shopIds = $request->user()->accessibleShopIds($validated['shop'] ?? null);

        $inventoryData = $this->reportService->getInventoryReport(
            $shopIds,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['stock_status'] ?? null,
            1000,
        );

        $formatted = $this->exportService->formatInventoryExport(collect($inventoryData->items()));

        return $this->exportService->exportReport($formatted, $validated['format'] ?? 'csv', 'inventory');
    }

    /**
     * Supplier Report
     */
    public function suppliers(SupplierReportRequest $request): Response
    {
        Gate::authorize('reports.view');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        return Inertia::render('reports/suppliers', [
            'performanceSummary' => $this->reportService->getSupplierPerformanceSummary(
                $user->tenant_id,
                $shopIds,
                $dateRange->start,
                $dateRange->end,
            ),
            'supplierData' => $this->reportService->getSupplierReport(
                $user->tenant_id,
                $shopIds,
                $dateRange->start,
                $dateRange->end,
                $validated['supplier'] ?? null,
                $validated['status'] ?? null,
                $validated['payment_status'] ?? null,
                $validated['per_page'] ?? 25,
            ),
            'shops' => $user->accessibleShops(),
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $dateRange->start->format('Y-m-d'),
                'to' => $dateRange->end->format('Y-m-d'),
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
    public function exportSuppliers(SupplierReportRequest $request): StreamedResponse|BinaryFileResponse|HttpResponse
    {
        Gate::authorize('reports.view');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        $supplierData = $this->reportService->getSupplierReport(
            $user->tenant_id,
            $shopIds,
            $dateRange->start,
            $dateRange->end,
            $validated['supplier'] ?? null,
            $validated['status'] ?? null,
            $validated['payment_status'] ?? null,
            1000,
        );

        $formatted = $this->exportService->formatSupplierExport(collect($supplierData->items()));

        return $this->exportService->exportReport($formatted, $validated['format'] ?? 'csv', 'supplier');
    }

    /**
     * Financial Report
     */
    public function financials(FinancialReportRequest $request): Response
    {
        Gate::authorize('dashboard.view_financials');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        return Inertia::render('reports/financials', [
            'financialData' => $this->reportService->getFinancialReport($shopIds, $dateRange->start, $dateRange->end),
            'shops' => $user->accessibleShops(),
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $dateRange->start->format('Y-m-d'),
                'to' => $dateRange->end->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Export Financial Report
     */
    public function exportFinancials(FinancialReportRequest $request): StreamedResponse|BinaryFileResponse|HttpResponse
    {
        Gate::authorize('dashboard.view_financials');

        $validated = $request->validated();
        $shopIds = $request->user()->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        $financialData = $this->reportService->getFinancialReport($shopIds, $dateRange->start, $dateRange->end);

        $formatted = $this->exportService->formatFinancialExport(
            $financialData,
            $dateRange->start->format('Y-m-d'),
            $dateRange->end->format('Y-m-d'),
        );

        return $this->exportService->exportReport($formatted, $validated['format'] ?? 'csv', 'financial');
    }

    /**
     * Customer Analytics Report
     */
    public function customerAnalytics(CustomerAnalyticsReportRequest $request): Response
    {
        Gate::authorize('reports.view');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        return Inertia::render('reports/customer-analytics', [
            'summary' => $this->reportService->getCustomerAnalyticsSummary($shopIds, $dateRange->start, $dateRange->end),
            'customerData' => $this->reportService->getCustomerAnalytics(
                $shopIds,
                $dateRange->start,
                $dateRange->end,
                $validated['customer'] ?? null,
                $validated['segment'] ?? 'all',
                $validated['per_page'] ?? 25,
            ),
            'shops' => $user->accessibleShops(),
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $dateRange->start->format('Y-m-d'),
                'to' => $dateRange->end->format('Y-m-d'),
                'customer' => $validated['customer'] ?? null,
                'segment' => $validated['segment'] ?? 'all',
            ],
        ]);
    }

    /**
     * Export Customer Analytics
     */
    public function exportCustomerAnalytics(CustomerAnalyticsReportRequest $request): StreamedResponse|BinaryFileResponse|HttpResponse
    {
        Gate::authorize('reports.view');

        $validated = $request->validated();
        $shopIds = $request->user()->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        $customerData = $this->reportService->getCustomerAnalytics(
            $shopIds,
            $dateRange->start,
            $dateRange->end,
            $validated['customer'] ?? null,
            $validated['segment'] ?? 'all',
            1000,
        );

        $formatted = $this->exportService->formatCustomerAnalyticsExport(collect($customerData->items()));

        return $this->exportService->exportReport($formatted, $validated['format'] ?? 'csv', 'customer-analytics');
    }

    /**
     * Product Profitability Report
     */
    public function productProfitability(ProductProfitabilityReportRequest $request): Response
    {
        Gate::authorize('dashboard.view_financials');

        $user = $request->user();
        $validated = $request->validated();
        $shopIds = $user->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        return Inertia::render('reports/product-profitability', [
            'summary' => $this->reportService->getProductProfitabilitySummary($shopIds, $dateRange->start, $dateRange->end),
            'productData' => $this->reportService->getProductProfitability(
                $shopIds,
                $dateRange->start,
                $dateRange->end,
                $validated['category'] ?? null,
                $validated['product'] ?? null,
                $validated['sort_by'] ?? 'profit',
                $validated['per_page'] ?? 25,
            ),
            'shops' => $user->accessibleShops(),
            'categories' => $this->reportService->getProductCategories(),
            'filters' => [
                'shop' => $validated['shop'] ?? null,
                'from' => $dateRange->start->format('Y-m-d'),
                'to' => $dateRange->end->format('Y-m-d'),
                'category' => $validated['category'] ?? null,
                'product' => $validated['product'] ?? null,
                'sort_by' => $validated['sort_by'] ?? 'profit',
            ],
        ]);
    }

    /**
     * Export Product Profitability
     */
    public function exportProductProfitability(ProductProfitabilityReportRequest $request): StreamedResponse|BinaryFileResponse|HttpResponse
    {
        Gate::authorize('dashboard.view_financials');

        $validated = $request->validated();
        $shopIds = $request->user()->accessibleShopIds($validated['shop'] ?? null);
        $dateRange = DateRange::fromRequest($validated);

        $productData = $this->reportService->getProductProfitability(
            $shopIds,
            $dateRange->start,
            $dateRange->end,
            $validated['category'] ?? null,
            $validated['product'] ?? null,
            $validated['sort_by'] ?? 'profit',
            1000,
        );

        $formatted = $this->exportService->formatProductProfitabilityExport(collect($productData->items()));

        return $this->exportService->exportReport($formatted, $validated['format'] ?? 'csv', 'product-profitability');
    }
}
