# ShelfWiser Backend Conventions

Reference document for `codebase-audit` and `controller-cleanup` skills.
Defines the specific shared patterns that all controllers and services must follow.

This document is NOT a style guide — those rules live in the global `CLAUDE.md`.
This document defines **infrastructure patterns** that enforce those rules.

---

## 1. Tenant Scoping

### The Rule

Every model using the `BelongsToTenant` trait already has a `TenantScope` global scope
that auto-filters queries by the authenticated user's `tenant_id`. **Do not add
redundant `->where('tenant_id', ...)` clauses when querying these models.**

### Models With TenantScope (non-exhaustive)

`Order`, `Product`, `ProductCategory`, `Customer`, `Shop`, `StockMovement`, `Cart`,
`EarningType`, `DeductionTypeModel`, `TaxTable`, `PayCalendar`, `PayRun`, `FundRequest`,
`WageAdvance`, `Service`, `ServiceCategory`, `PurchaseOrder`, `User`, `Notification`,
`EmployeePayrollDetail`, `EmployeeEarning`, `EmployeeDeduction`, `Timesheet`

### Wrong

```php
$tenantId = auth()->user()->tenant_id;
$orders = Order::query()->where('tenant_id', $tenantId)->latest()->paginate(20);
```

### Correct

```php
$orders = Order::query()->latest()->paginate(20);
```

The scope handles it. If you need the tenant ID for a non-scoped context (e.g., passing
to a service that creates raw DB queries), use `$request->user()->tenant_id` — assigned
once at the top of the method, never fetched repeatedly.

---

## 2. Shop Access

### The Rule

Shop access resolution (which shops can a user see?) lives on the `User` model.
Controllers never query shops for access control.

### Required Methods on `App\Models\User`

```php
/**
 * Get IDs of shops the user can access, optionally filtered to a specific shop.
 * Throws 403 if the user requests a shop they don't have access to.
 */
public function accessibleShopIds(?int $shopId = null): \Illuminate\Support\Collection
{
    if ($this->isTenantOwner() || $this->role->canAccessMultipleStores()) {
        $query = Shop::query()->where('is_active', true);

        if ($shopId) {
            $query->where('id', $shopId);
        }

        return $query->pluck('id');
    }

    $assignedShopIds = $this->shops()->pluck('shops.id');

    if ($shopId) {
        abort_unless($assignedShopIds->contains($shopId), 403, 'You do not have access to this shop');
        return collect([$shopId]);
    }

    return $assignedShopIds;
}

/**
 * Get shop models the user can access (for dropdown/filter UI).
 */
public function accessibleShops(): \Illuminate\Support\Collection
{
    if ($this->isTenantOwner() || $this->role->canAccessMultipleStores()) {
        return Shop::query()
            ->where('is_active', true)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();
    }

    return $this->shops()
        ->where('is_active', true)
        ->select('shops.id', 'shops.name')
        ->orderBy('name')
        ->get();
}
```

### Wrong (controller defines its own shop access)

```php
protected function getAccessibleShopIds($user, ?int $shopId): Collection
{
    if ($user->is_tenant_owner) {
        $query = Shop::query()->where('tenant_id', $user->tenant_id);
        // ... 20 lines of logic
    }
}
```

### Correct (controller calls User model)

```php
$shopIds = $request->user()->accessibleShopIds($validated['shop'] ?? null);
$shops = $request->user()->accessibleShops();
```

---

## 3. Date Range Handling

### The Rule

Date range parsing with default-to-current-month logic lives in a DTO.
Controllers never call `Carbon::parse()` directly for filter date ranges.

### Required DTO at `App\DTOs\DateRange`

```php
<?php

namespace App\DTOs;

use Carbon\Carbon;

final readonly class DateRange
{
    public function __construct(
        public Carbon $start,
        public Carbon $end,
    ) {}

    /**
     * Build from validated request data with sensible defaults.
     * Defaults to current month if no dates are provided.
     */
    public static function fromRequest(
        array $validated,
        string $fromKey = 'from',
        string $toKey = 'to'
    ): self {
        return new self(
            start: isset($validated[$fromKey])
                ? Carbon::parse($validated[$fromKey])->startOfDay()
                : now()->startOfMonth(),
            end: isset($validated[$toKey])
                ? Carbon::parse($validated[$toKey])->endOfDay()
                : now()->endOfMonth(),
        );
    }

    /**
     * Formatted strings for passing back to the frontend as filter state.
     *
     * @return array{from: string, to: string}
     */
    public function toFilterArray(): array
    {
        return [
            'from' => $this->start->format('Y-m-d'),
            'to' => $this->end->format('Y-m-d'),
        ];
    }
}
```

### Wrong (inline parsing repeated in every method)

```php
$startDate = isset($validated['from'])
    ? Carbon::parse($validated['from'])->startOfDay()
    : now()->startOfMonth();
$endDate = isset($validated['to'])
    ? Carbon::parse($validated['to'])->endOfDay()
    : now()->endOfMonth();
```

### Correct

```php
$dateRange = DateRange::fromRequest($validated);
// Use $dateRange->start, $dateRange->end
```

---

## 4. Permission Checking

### The Rule

Authorization uses `Gate::authorize()` with Gate names defined in `AppServiceProvider`.
Never call `$user->role->hasPermission()` directly in controllers — that bypasses the
policy layer and leads to permission string confusion.

**Gate names** (e.g. `reports.view`) are NOT the same as **permission strings**
(e.g. `view_reports`). Gate names map to policy methods, which internally check
permission strings. Controllers only use Gate names.

### Defined Gates (from `AppServiceProvider`)

```
reports.view            → ReportPolicy::view
dashboard.view          → DashboardPolicy::view
dashboard.view_financials → DashboardPolicy::viewFinancials
dashboard.refresh_cache → DashboardPolicy::refreshCache
shop.view               → ShopPolicy::view
shop.manage             → ShopPolicy::manage
payRun.viewAny          → PayRunPolicy::viewAny
payRun.create           → PayRunPolicy::create
payRun.viewReports      → PayRunPolicy::viewReports
payRun.exportReports    → PayRunPolicy::exportReports
payRun.manageSettings   → PayRunPolicy::manageSettings
timesheet.viewAny       → TimesheetPolicy::viewAny
catalog.*               → SupplierPolicy::*
purchaseOrder.*         → PurchaseOrderPolicy::*
```

### KNOWN BUGS: Undefined Gates

These are called in controllers but have NO corresponding `Gate::define()`:

- `view_payroll_settings` — used 6 times in `PayrollSettingsController`
- `manage_payroll_settings` — used 10 times in `PayrollSettingsController`

These must be defined in `AppServiceProvider` with a corresponding `PayrollSettingsPolicy`
before the payroll settings pages will work for any user.

### Wrong (direct permission check, wrong string)

```php
if (!$user->role->hasPermission('reports.view')) {  // 'reports.view' is a Gate name, not a permission string
    abort(403);
}
```

### Wrong (bypasses policy layer)

```php
if (!$user->role->hasPermission('view_reports')) {
    abort(403);
}
```

### Correct

```php
Gate::authorize('reports.view');
```

### For model-bound authorization, use policies

```php
Gate::authorize('view', $order);          // Uses OrderPolicy::view
Gate::authorize('create', Order::class);  // Uses OrderPolicy::create
```

---

## 5. Controller Boundaries

### The Rule

A controller method does exactly four things, in order:

1. **Authorize** — `Gate::authorize()` or policy check
2. **Validate** — Via injected FormRequest (already done before method body)
3. **Delegate** — Call service method(s)
4. **Respond** — Return Inertia render or redirect

Nothing else. No Eloquent queries, no `Carbon::parse`, no business logic,
no data aggregation, no conditional eager loading, no CSV building.

### Line Budget

A controller method should be 5–15 lines. If it exceeds 20, logic is leaking in.

### What Belongs in Services

- All Eloquent queries (including stats/aggregation)
- Date range and filter processing
- Business rules (can this order be cancelled? is stock sufficient?)
- Stock validation, decrement, movement recording
- Address saving, idempotency checks
- Export data formatting
- Any `DB::transaction()` block

### What Belongs on Models

- Repeated eager load sets → named methods (e.g. `loadOrderRelations()`)
- Computed properties (e.g. `remainingBalance()`)
- Scopes
- Relationship definitions
- Domain predicates (e.g. `canEdit()`, `isFullyPaid()`)
- Static helpers (e.g. `generateOrderNumber()`)

### What Belongs in DTOs

- `DateRange` — date filter parsing with defaults
- Payment result types (already exist in `App\DTOs\Payment`)

---

## 6. Eager Loading

### The Rule

If the same `load()` or `with()` array appears more than once across the codebase,
it becomes a named method on the model.

### Pattern

```php
/** On the Order model */
public function loadOrderRelations(): static
{
    return $this->load([
        'items.productVariant.product',
        'items.packagingType',
        'items.sellable' => function ($morphTo) {
            $morphTo->morphWith([
                \App\Models\ServiceVariant::class => ['service'],
            ]);
        },
    ]);
}
```

### Conditional loading — always load, never branch

Wrong:

```php
if ($order->packed_by) {
    $order->load('packedByUser');
}
if ($order->shipped_by) {
    $order->load('shippedByUser');
}
```

Correct (null foreign keys return null — they don't fail):

```php
$order->load(['packedByUser', 'shippedByUser', 'deliveredByUser', 'refundedByUser']);
```

---

## 7. Report and Export Pattern

### The Rule

Report view and export methods share the same filters but differ only in per_page
and output format. The shared validation lives in a single FormRequest. The data
retrieval lives in the service. The controller calls both.

### Structure

```
App\Http\Requests\Reports\SalesReportRequest     — shared validation rules
App\Services\ReportService::getSalesReport(...)    — data retrieval
App\Services\ExportService::export(...)           — format dispatch
```

### Controller Pattern

```php
public function sales(SalesReportRequest $request): Response
{
    Gate::authorize('reports.view');

    $user = $request->user();
    $shopIds = $user->accessibleShopIds($request->validated('shop'));
    $dateRange = DateRange::fromRequest($request->validated());

    return Inertia::render('reports/sales', [
        'summary' => $this->reportService->getSalesSummary($shopIds, $dateRange),
        'salesData' => $this->reportService->getSalesReport($shopIds, $dateRange, $request->validated()),
        'shops' => $user->accessibleShops(),
        'filters' => $request->filterState($dateRange),
    ]);
}

public function exportSales(SalesReportRequest $request): StreamedResponse|BinaryFileResponse
{
    Gate::authorize('reports.view');

    $shopIds = $request->user()->accessibleShopIds($request->validated('shop'));
    $dateRange = DateRange::fromRequest($request->validated());

    return $this->exportService->exportReport(
        'sales',
        $this->reportService->getSalesReport($shopIds, $dateRange, $request->validated(), perPage: 1000),
        $request->validated('format', 'csv')
    );
}
```

### Export Dispatch — Single Method on ExportService

All export format switching goes through one method. No `match ($format)` in controllers.

```php
/** On ExportService */
public function exportReport(string $reportType, $data, string $format = 'csv')
{
    $formatted = $this->{"format{$reportType}Export"}(collect($data->items()));
    $timestamp = now()->format('Y-m-d-His');
    $filename = "{$reportType}-report-{$timestamp}";

    return match ($format) {
        'excel' => $this->exportToExcel($formatted['headers'], $formatted['rows'], "{$filename}.xlsx"),
        'pdf' => $this->exportToPdf($formatted['headers'], $formatted['rows'], "{$filename}.pdf", ucfirst($reportType) . ' Report'),
        default => $this->exportToCsv($formatted['headers'], $formatted['rows'], "{$filename}.csv"),
    };
}
```

---

## 8. Stats Aggregation

### The Rule

Any `->count()`, `->sum()`, `->avg()`, `->groupBy()` calls for dashboard or index page
stats belong in the service. The controller receives a ready-made array.

### Wrong (inline in controller)

```php
'stats' => [
    'total' => Order::query()->where('tenant_id', $tenantId)->count(),
    'pending' => Order::query()->where('tenant_id', $tenantId)
        ->where('status', OrderStatus::PENDING)->count(),
    'confirmed' => Order::query()->where('tenant_id', $tenantId)
        ->where('status', OrderStatus::CONFIRMED)->count(),
],
```

### Correct (service method)

```php
/** In controller */
'stats' => $this->orderService->getOrderStats(),

/** In OrderService */
public function getOrderStats(): array
{
    $counts = Order::query()
        ->selectRaw("status, count(*) as total")
        ->groupBy('status')
        ->pluck('total', 'status');

    return [
        'total' => $counts->sum(),
        'pending' => $counts->get(OrderStatus::PENDING->value, 0),
        'confirmed' => $counts->get(OrderStatus::CONFIRMED->value, 0),
        'delivered' => $counts->get(OrderStatus::DELIVERED->value, 0),
    ];
}
```

Single query instead of N separate queries.

---

## 9. Product / Variant Loading for Forms

### The Rule

Product and variant queries for create/edit forms belong in a service method.
Controllers never build `ProductVariant::query()->whereHas(...)` inline.

Replace the pattern entirely with async search endpoints for large catalogs.
For immediate cleanup: move the query to the service and share between create/edit.

---

## 10. Storefront Conventions

### The Rule

Storefront controllers use the `customer` auth guard. Resolve the customer once
per controller (via helper or middleware), not per method.

### Customer Resolution

```php
protected function customer(): \App\Models\Customer
{
    return auth('customer')->user()
        ?? abort(401, 'Authentication required');
}
```

### Order Access Authorization

```php
protected function authorizeOrderAccess(Order $order, Shop $shop): void
{
    abort_unless($order->customer_id === $this->customer()->id, 403, 'Unauthorized');
    abort_unless($order->shop_id === $shop->id, 404);
}
```

---

## Checklist for Audit/Cleanup Skills

When scanning a controller, check for:

- [ ] Redundant `->where('tenant_id', ...)` on scoped models
- [ ] `getAccessibleShopIds` / `getAccessibleShops` defined on the controller
- [ ] Inline `Carbon::parse()` for date filter defaults
- [ ] `$user->role->hasPermission()` called directly (should be `Gate::authorize`)
- [ ] `Gate::authorize()` with an ability name that has no `Gate::define()`
- [ ] Eloquent queries (any `::query()`, `->where()`, `->count()`, `->sum()`)
- [ ] `match ($format)` export dispatch logic
- [ ] Same `load()` / `with()` array appearing more than once
- [ ] Conditional eager loading (`if ($model->fk) { $model->load(...) }`)
- [ ] Stats aggregation (multiple count/sum calls for dashboard numbers)
- [ ] `request->validate()` instead of FormRequest
- [ ] CSV/export building with `fopen('php://output')`
- [ ] More than 20 lines in a single controller method
