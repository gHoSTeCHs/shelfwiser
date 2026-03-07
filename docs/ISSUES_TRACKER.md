# ShelfWise Issues Tracker

**Extracted from:** SYSTEM_ANALYSIS_REPORT.md
**Date:** January 21, 2026
**Total Issues:** 51

---

## Summary

| Severity    | Count | Status  |
|-------------|-------|---------|
| 🔴 Critical | 6     | Pending |
| 🟠 High     | 12    | Pending |
| 🟡 Medium   | 18    | Pending |
| 🔵 Low      | 15    | Pending |

---

## 🔴 Critical Issues (6)

### CRIT-001: orders.customer_id References Wrong Table

| Field    | Value                                          |
|----------|------------------------------------------------|
| Location | `database/migrations/*_create_orders_table.php` |
| Impact   | Data integrity issues                          |
| Status   | Pending                                        |

**Problem:** The `customer_id` foreign key references the `users` table instead of the `customers` table.

**Context:** Customer and User models are separate entities:
- `User` = Staff members (multi-tenant)
- `Customer` = E-commerce buyers (storefront)

**Current Code:**
```php
$table->foreignId('customer_id')->constrained('users');
```

**Fix Required:**
```php
$table->foreignId('customer_id')->constrained('customers');
```

---

### CRIT-002: HeldSaleService Bypasses Stock Audit Trail

| Field    | Value                            |
|----------|----------------------------------|
| Location | `app/Services/HeldSaleService.php` |
| Impact   | Overselling, inventory discrepancies |
| Status   | Pending                          |

**Problem:** Held sales do not reserve stock through `StockMovementService`, meaning:
- No audit trail for stock reservation
- Potential for overselling
- Inventory counts can be inaccurate

**Current Code:**
```php
class HeldSaleService
{
    public function holdSale(array $items, $shopId)
    {
        HeldSale::query()->create([...]);
    }
}
```

**Fix Required:** Integrate `StockMovementService` for stock reservation on hold.

---

### CRIT-003: SupplierPolicy Cross-Tenant Access Vulnerability

| Field    | Value                              |
|----------|------------------------------------|
| Location | `app/Policies/SupplierPolicy.php`   |
| Impact   | Security vulnerability             |
| Status   | Pending                            |

**Problem:** `viewCatalog()` method returns `true` without verifying tenant relationship.

**Current Code:**
```php
public function viewCatalog(User $user, Supplier $supplier): bool
{
    return true;
}
```

**Fix Required:**
```php
public function viewCatalog(User $user, Supplier $supplier): bool
{
    return $supplier->tenant_id === $user->tenant_id
        || $supplier->hasConnectionWith($user->tenant_id);
}
```

---

### CRIT-004: Database ENUMs Violate CLAUDE.md Standards

| Field    | Value                                |
|----------|--------------------------------------|
| Location | 15+ migration files                  |
| Impact   | Database portability issues          |
| Status   | Pending                              |

**Problem:** CLAUDE.md explicitly states:
> "Enums - Define all enums as PHP Enums in `app/Enums/`. Never use database-level enums."

**Affected Tables:**
- orders.status
- orders.payment_status
- stock_movements.type
- pay_runs.status
- wage_advances.status
- timesheets.status
- fund_requests.status
- ... and 10+ more

**Current Code:**
```php
$table->enum('status', ['pending', 'completed', 'cancelled']);
```

**Fix Required:**
```php
$table->string('status');
```

---

### CRIT-005: OrderPaymentController Missing Authorization

| Field    | Value                                         |
|----------|-----------------------------------------------|
| Location | `app/Http/Controllers/OrderPaymentController.php` |
| Impact   | Unauthorized payment operations               |
| Status   | Pending                                       |

**Problem:** No `Gate::authorize()` call before payment operations.

**Fix Required:**
```php
public function store(StoreOrderPaymentRequest $request, Order $order)
{
    Gate::authorize('recordPayment', $order);
}
```

---

### CRIT-006: PurchaseOrder Dual Tenant Architecture Conflict

| Field    | Value                           |
|----------|---------------------------------|
| Location | `app/Models/PurchaseOrder.php`   |
| Impact   | Tenant isolation issues         |
| Status   | Pending                         |

**Problem:** Model has both `buyer_tenant_id` and `supplier_tenant_id` but also uses `BelongsToTenant` trait which expects a single `tenant_id`.

**Current Code:**
```php
class PurchaseOrder extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'buyer_tenant_id',
        'supplier_tenant_id',
    ];
}
```

**Fix Options:**
1. Remove `BelongsToTenant` trait and implement custom scoping
2. OR rename fields to clarify the primary tenant

---

## 🟠 High Issues (12)

### HIGH-001: Dynamic Model Loading Vulnerability

| Field    | Value                                   |
|----------|-----------------------------------------|
| Location | `app/Http/Controllers/ImageController.php` |
| Impact   | Potential security vulnerability        |
| Status   | Pending                                 |

**Problem:** Uses string interpolation for model class loading.

---

### HIGH-002: Business Logic in Model boot()

| Field    | Value                           |
|----------|---------------------------------|
| Location | `app/Models/OrderPayment.php`    |
| Impact   | Violates service layer pattern  |
| Status   | Pending                         |

**Problem:** Payment status updates should be in service layer, not model boot method.

---

### HIGH-003: Missing UUID Standard on Some Models

| Field    | Value                                |
|----------|--------------------------------------|
| Location | Several models                       |
| Impact   | Inconsistent primary key pattern     |
| Status   | Pending                              |

**Problem:** Some models not using HasUuid trait consistently.

---

### HIGH-004: Missing Tenant Validation in POSService

| Field    | Value                        |
|----------|------------------------------|
| Location | `app/Services/POSService.php` |
| Impact   | Multi-tenancy gap            |
| Status   | Pending                      |

**Problem:** No explicit `tenant_id` check before sale completion.

---

### HIGH-005: Missing Policies for 27 Models

| Field    | Value              |
|----------|--------------------|
| Location | Multiple models    |
| Impact   | Authorization gaps |
| Status   | Pending            |

**Models Without Policies:**
- CustomerAddress
- CustomerCredit
- CustomerCreditTransaction
- HeldSale
- ImageGallery
- OrderPayment
- PayCalendar
- PayRunItem
- ProductImage
- ServiceAddon
- ServiceVariant
- ShopTaxSetting
- StockLocation
- SupplierCatalogItem
- SupplierConnection
- TenantSetting
- Timesheet
- TimesheetEntry
- WageAdvanceRepayment
- ... and 8 more

---

### HIGH-006: Missing Tenant Checks in viewAny() Methods

| Field    | Value                               |
|----------|-------------------------------------|
| Location | Multiple policies                   |
| Impact   | Multi-tenancy security gaps         |
| Status   | Pending                             |

**Problem:** Multiple `viewAny()` methods don't verify tenant isolation.

---

### HIGH-007: Debug Route in Production

| Field    | Value                    |
|----------|--------------------------|
| Location | `routes/web.php`          |
| Impact   | Security/cleanup issue   |
| Status   | Pending                  |

**Problem:** `/toast-demo` route should be removed or protected.

---

### HIGH-008: Route Naming Mismatch (staff/users)

| Field    | Value            |
|----------|------------------|
| Location | `routes/web.php`  |
| Impact   | Confusion        |
| Status   | Pending          |

**Problem:** URL is `/staff` but route name is `users.index`, `users.show`, etc.

**Current Code:**
```php
Route::prefix('staff')->name('users.')->group(function () {
    Route::resource('/', StaffController::class);
});
```

---

### HIGH-009: Wrong Import Source for formatCurrency

| Field    | Value                                           |
|----------|-------------------------------------------------|
| Location | `resources/js/pages/Customers/Index.tsx:10`      |
| Impact   | SSOT violation                                  |
| Status   | Pending                                         |

**Problem:** Imports `formatCurrency` from `@/types/customer` instead of `@/lib/formatters`.

---

### HIGH-010: Hardcoded Routes in Admin Pages

| Field    | Value                    |
|----------|--------------------------|
| Location | 7-8 instances            |
| Impact   | CLAUDE.md violation      |
| Status   | Pending                  |

**Affected Files:**
| File | Hardcoded Route | Should Use |
|------|-----------------|------------|
| Admin/Tenants/Index.tsx | `/admin/tenants/create` | `AdminTenantController.create.url()` |
| Admin/Dashboard.tsx | `/admin/tenants` | `AdminTenantController.index.url()` |
| ServiceCategories/Create.tsx | `/service-categories` | `ServiceCategoryController.index.url()` |
| Settings/ShopSettings.tsx | `/dashboard` | `DashboardController.index.url()` |
| Purchases/Create.tsx | `/stock-movements` | `StockMovementController.index.url()` |

---

### HIGH-011: Missing customer_addresses tenant_id

| Field    | Value                                            |
|----------|--------------------------------------------------|
| Location | `database/migrations/*_create_customer_addresses_table.php` |
| Impact   | Multi-tenancy gap (fixed in later migration)     |
| Status   | Resolved                                         |

**Problem:** Was missing tenant_id (fixed in later migration).

---

### HIGH-012: Inconsistent Service Error Handling

| Field    | Value             |
|----------|-------------------|
| Location | Multiple services |
| Impact   | Code consistency  |
| Status   | Pending           |

**Problem:** Some services throw exceptions, others return false.

---

## 🟡 Medium Issues (18)

### MED-001: Missing Super Admin Check in AdminDashboardController

| Field    | Value                                                 |
|----------|-------------------------------------------------------|
| Location | `app/Http/Controllers/Admin/AdminDashboardController.php` |
| Impact   | Relies only on middleware                             |
| Status   | Pending                                               |

---

### MED-002: N+1 Query Potential in PayRun

| Field    | Value                    |
|----------|--------------------------|
| Location | `app/Models/PayRun.php`   |
| Impact   | Performance              |
| Status   | Pending                  |

**Problem:** Missing eager loading for items relationship.

---

### MED-003: Inconsistent Enum Color Methods

| Field    | Value               |
|----------|---------------------|
| Location | Multiple enum files |
| Impact   | Code consistency    |
| Status   | Pending             |

**Problem:** Some enums use Tailwind classes, others use hex colors.

---

### MED-004: Incomplete Array Item Validation

| Field    | Value                                            |
|----------|--------------------------------------------------|
| Location | `app/Http/Requests/CreateOrderRequest.php`        |
| Impact   | Validation gaps                                  |
| Status   | Pending                                          |

**Problem:** `items.*` validation incomplete.

---

### MED-005: Missing Conditional Rules in Form Requests

| Field    | Value                  |
|----------|------------------------|
| Location | Multiple Form Requests |
| Impact   | Validation flexibility |
| Status   | Pending                |

**Problem:** Some requests don't use `sometimes` for optional updates.

---

### MED-006: Inconsistent Table Naming in Migrations

| Field    | Value              |
|----------|--------------------|
| Location | Multiple migrations |
| Impact   | Database consistency |
| Status   | Pending             |

**Problem:** Some tables use snake_case, others use camelCase for pivot tables.

---

### MED-007: Unauthenticated Payment Callback

| Field    | Value                                    |
|----------|------------------------------------------|
| Location | `/payment/callback/{gateway}/{order}` route |
| Impact   | Need to ensure signature verification    |
| Status   | Pending                                  |

---

### MED-008: No API Versioning

| Field    | Value               |
|----------|---------------------|
| Location | `routes/api.php`     |
| Impact   | API maintainability |
| Status   | Pending             |

**Problem:** API routes lack `/v1/` prefix.

---

### MED-009: dangerouslySetInnerHTML for Pagination

| Field    | Value       |
|----------|-------------|
| Location | 3 pages     |
| Impact   | XSS potential |
| Status   | Pending     |

---

### MED-010: ESLint any Type Suppression

| Field    | Value                                      |
|----------|--------------------------------------------|
| Location | `resources/js/pages/Services/Create.tsx:1`  |
| Impact   | Type safety                                |
| Status   | Pending                                    |

---

### MED-011: Demo Components Mixed with Production

| Field    | Value                                   |
|----------|-----------------------------------------|
| Location | `resources/js/components/form-elements/` |
| Impact   | Code cleanliness                        |
| Status   | Pending                                 |

**Demo Components to Remove:**
- ColorPickerDropdown.tsx (demo)
- CalendarDemo.tsx
- FormLayoutExample.tsx

---

### MED-012: Monolithic Dashboard Tabs

| Field    | Value                                     |
|----------|-------------------------------------------|
| Location | `resources/js/components/dashboard/tabs/` |
| Impact   | Maintainability (500+ lines each)         |
| Status   | Pending                                   |

---

### MED-013: Duplicate CustomerAddress Interface

| Field    | Value                                              |
|----------|----------------------------------------------------|
| Location | `types/customer.ts` and `types/storefront.ts`       |
| Impact   | Type inconsistency                                 |
| Status   | Pending                                            |

**Problem:** `CustomerAddress` defined differently in both files.

---

### MED-014: Re-export Pattern Causing Import Confusion

| Field    | Value                               |
|----------|-------------------------------------|
| Location | `resources/js/types/customer.ts`     |
| Impact   | Import confusion                    |
| Status   | Pending                             |

**Problem:** `customer.ts` re-exports `formatCurrency` from formatters.

---

### MED-015: Hardcoded Colors in FlatPickr

| Field    | Value              |
|----------|--------------------|
| Location | FlatPickr component |
| Impact   | Brand inconsistency |
| Status   | Pending            |

---

### MED-016: Inconsistent Dark Backgrounds

| Field    | Value                     |
|----------|---------------------------|
| Location | Multiple components       |
| Impact   | Visual inconsistency      |
| Status   | Pending                   |

**Problem:** Mix of `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-dark-900`.

---

### MED-017: Deprecated formatDate Export in utils.ts

| Field    | Value                         |
|----------|-------------------------------|
| Location | `resources/js/lib/utils.ts`    |
| Impact   | Code cleanup                  |
| Status   | Pending                       |

**Problem:** Still exports deprecated `formatDate()`.

---

### MED-018: Local Type Definitions Instead of Centralized

| Field    | Value        |
|----------|--------------|
| Location | Some pages   |
| Impact   | SSOT pattern |
| Status   | Pending      |

---

## 🔵 Low Issues (15)

### LOW-001: Duplicate Reorder Alert Routes

| Field    | Value            |
|----------|------------------|
| Location | `routes/web.php`  |
| Impact   | Route cleanup    |
| Status   | Pending          |

**Problem:** Two routes for reorder-alerts with different URLs.

---

### LOW-002: Inconsistent Prop Naming in Components

| Field    | Value              |
|----------|--------------------|
| Location | Multiple components |
| Impact   | Code consistency   |
| Status   | Pending            |

**Problem:** Some use `className`, others use `class`.

---

### LOW-003: Missing Hover States on Some Buttons

| Field    | Value        |
|----------|--------------|
| Location | UI components |
| Impact   | UX polish    |
| Status   | Pending      |

---

### LOW-004: Redundant Formatter Functions

| Field    | Value                  |
|----------|------------------------|
| Location | Multiple lib files     |
| Impact   | Code deduplication     |
| Status   | Pending                |

**Problem:** Some formatters duplicated between files.

---

### LOW-005 through LOW-015: Additional Minor Issues

Various low-priority code quality and consistency issues identified during the analysis.

---

## Fix Priority Matrix

### Priority 1: Fix Immediately (Security)

- [ ] CRIT-003: SupplierPolicy cross-tenant access
- [ ] CRIT-005: OrderPaymentController authorization
- [ ] HIGH-005: Add policies for payment-related models

### Priority 2: Fix This Week (Data Integrity)

- [ ] CRIT-001: orders.customer_id foreign key
- [ ] CRIT-002: HeldSaleService stock audit trail
- [ ] CRIT-006: PurchaseOrder dual tenant conflict

### Priority 3: Fix This Sprint (Standards)

- [ ] CRIT-004: Convert database ENUMs to VARCHAR
- [ ] HIGH-005: Add missing policies for 27 models
- [ ] HIGH-010: Fix hardcoded routes in Admin pages
- [ ] HIGH-007: Remove debug `/toast-demo` route

### Priority 4: Ongoing (Code Quality)

- [ ] MED-013: Consolidate duplicate CustomerAddress types
- [ ] MED-017: Remove deprecated formatDate from utils.ts
- [ ] MED-011: Remove demo components from production
- [ ] MED-012: Split monolithic dashboard tabs
- [ ] HIGH-009: Fix formatCurrency import in Customers pages

---

## Files to Fix Reference

### Backend Critical Files

```
app/Policies/SupplierPolicy.php
app/Http/Controllers/OrderPaymentController.php
app/Services/HeldSaleService.php
app/Services/POSService.php
app/Models/PurchaseOrder.php
database/migrations/*_create_orders_table.php
```

### Frontend Critical Files

```
resources/js/pages/Customers/Index.tsx
resources/js/pages/Customers/Show.tsx
resources/js/pages/Admin/Tenants/Index.tsx
resources/js/pages/Admin/Dashboard.tsx
resources/js/pages/ServiceCategories/Create.tsx
resources/js/pages/Settings/ShopSettings.tsx
resources/js/types/customer.ts
resources/js/types/storefront.ts
```

---

**Last Updated:** January 21, 2026
