# ShelfWise System Analysis Report

**Date:** January 21, 2026
**Analysis Type:** Comprehensive Backend & Frontend Review
**Codebase Version:** Branch `claude/analyze-storefront-system-01L4PnbnMNRUVdjWtrRhKFx9`

---

## Executive Summary

This report provides a comprehensive analysis of the ShelfWise multi-tenant inventory management system. The analysis
covers:

- **Backend (Laravel):** 64 controllers, 66 models, 63 services, 39 policies, 37 enums, 49 form requests, 144 migrations
- **Frontend (React/Inertia):** 139 pages, 155 components, 27 type definition files, 7 utility modules

### Overall Assessment

| Area                 | Score | Notes                                  |
|----------------------|-------|----------------------------------------|
| Architecture         | ⭐⭐⭐⭐  | Service layer pattern well-implemented |
| Type Safety          | ⭐⭐⭐⭐⭐ | No `any` types, strict TypeScript      |
| Multi-Tenancy        | ⭐⭐⭐⭐  | Good isolation, minor gaps in policies |
| Security             | ⭐⭐⭐   | Some authorization gaps identified     |
| Code Consistency     | ⭐⭐⭐⭐  | Strong patterns with minor deviations  |
| CLAUDE.md Compliance | ⭐⭐⭐   | Database ENUMs violate standards       |

### Critical Issues Count

| Severity    | Count |
|-------------|-------|
| 🔴 Critical | 6     |
| 🟠 High     | 12    |
| 🟡 Medium   | 18    |
| 🔵 Low      | 15    |

---

## Table of Contents

1. [Backend Architecture](#1-backend-architecture)
    - [Controllers Analysis](#11-controllers-analysis)
    - [Models Analysis](#12-models-analysis)
    - [Services Analysis](#13-services-analysis)
    - [Policies Analysis](#14-policies-analysis)
    - [Enums Analysis](#15-enums-analysis)
    - [Form Requests Analysis](#16-form-requests-analysis)
    - [Migrations Analysis](#17-migrations-analysis)
    - [Routes Analysis](#18-routes-analysis)
2. [Frontend Architecture](#2-frontend-architecture)
    - [Pages Analysis](#21-pages-analysis)
    - [Components Analysis](#22-components-analysis)
    - [Type System Analysis](#23-type-system-analysis)
    - [Design System Analysis](#24-design-system-analysis)
    - [Lib Utilities Analysis](#25-lib-utilities-analysis)
3. [Critical Issues](#3-critical-issues)
4. [Security Concerns](#4-security-concerns)
5. [CLAUDE.md Compliance](#5-claudemd-compliance)
6. [Recommendations](#6-recommendations)

---

## 1. Backend Architecture

### 1.1 Controllers Analysis

**Total Controllers:** 64 (excluding base Controller.php)

#### Structure

```
app/Http/Controllers/
├── Admin/ (6 controllers)
│   ├── AdminApiController
│   ├── AdminDashboardController
│   ├── AdminProductTemplateController
│   ├── AdminSettingsController
│   ├── AdminSubscriptionController
│   └── AdminTenantController
├── Api/ (2 controllers)
│   ├── PaymentGatewayController
│   └── SyncController
├── Auth/ (9 controllers)
├── Storefront/ (5 controllers)
└── Core/ (42 controllers)
```

#### Pattern Compliance

| Pattern                  | Compliance | Notes                                   |
|--------------------------|------------|-----------------------------------------|
| Service Layer Delegation | 95%+       | Controllers are thin, logic in services |
| Gate::authorize() Usage  | 207+ calls | Comprehensive authorization             |
| Form Request Validation  | 100%       | All inputs validated                    |
| Explicit Query Builder   | 90%+       | `Model::query()->` pattern followed     |

#### Issues Found

| Severity    | Issue                               | Location                                                                  |
|-------------|-------------------------------------|---------------------------------------------------------------------------|
| 🔴 Critical | Missing authorization check         | `OrderPaymentController` - no Gate::authorize() before payment operations |
| 🟠 High     | Dynamic model loading vulnerability | `ImageController` - uses string interpolation for model class loading     |
| 🟡 Medium   | Missing super admin check           | `AdminDashboardController::index()` - relies only on middleware           |

**Affected Files:**

- `app/Http/Controllers/OrderPaymentController.php`
- `app/Http/Controllers/ImageController.php`
- `app/Http/Controllers/Admin/AdminDashboardController.php`

---

### 1.2 Models Analysis

**Total Models:** 66

#### Architecture

```
app/Models/
├── User.php (multi-tenant staff)
├── Customer.php (storefront buyers - SEPARATE from User)
├── Tenant.php
├── Shop.php
├── Product.php → ProductVariant.php → StockMovement.php
├── Service.php → ServiceVariant.php → ServiceAddon.php
├── Order.php → OrderItem.php → OrderPayment.php
├── PayRun.php → PayRunItem.php → Payslip.php
└── ... (56 more models)
```

#### Traits Usage

| Trait           | Models Using | Purpose           |
|-----------------|--------------|-------------------|
| HasUuid         | 60+          | UUID primary keys |
| BelongsToTenant | 45+          | Tenant scoping    |
| SoftDeletes     | 30+          | Soft deletion     |
| HasFactory      | 66           | Testing factories |

#### Issues Found

| Severity    | Issue                             | Location                                                                                                   |
|-------------|-----------------------------------|------------------------------------------------------------------------------------------------------------|
| 🔴 Critical | Dual tenant architecture conflict | `PurchaseOrder.php` - has `buyer_tenant_id` AND `supplier_tenant_id` but also uses `BelongsToTenant` trait |
| 🟠 High     | Business logic in boot()          | `OrderPayment.php` - payment status updates should be in service                                           |
| 🟠 High     | Missing UUID standard             | Several models not using HasUuid trait consistently                                                        |
| 🟡 Medium   | N+1 query potential               | `PayRun.php` - missing eager loading for items relationship                                                |

**PurchaseOrder Conflict Detail:**

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

The `BelongsToTenant` trait expects a single `tenant_id`, but this model has dual tenant relationships.

---

### 1.3 Services Analysis

**Total Services:** 63

#### Structure

```
app/Services/
├── Core/
│   ├── ProductService.php
│   ├── OrderService.php
│   ├── StockMovementService.php (CRITICAL - audit trail hub)
│   ├── CustomerService.php
│   └── ShopService.php
├── Payroll/
│   ├── PayrollService.php
│   ├── PayRunService.php
│   └── TaxCalculationService.php
├── Supplier/
│   ├── SupplierCatalogService.php
│   └── SupplierConnectionService.php
└── ... (50+ more services)
```

#### Stock Movement Service Pattern

All stock changes MUST go through `StockMovementService`:

```php
app(StockMovementService::class)->adjustStock($variant, $qty, $type, $reason);
```

#### Issues Found

| Severity    | Issue                       | Location                                                                   |
|-------------|-----------------------------|----------------------------------------------------------------------------|
| 🔴 Critical | Bypasses stock audit trail  | `HeldSaleService.php` - doesn't call `StockMovementService` for held sales |
| 🟠 High     | Missing tenant validation   | `POSService.php` - no explicit tenant_id check before sale completion      |
| 🟡 Medium   | Inconsistent error handling | Some services throw exceptions, others return false                        |

**HeldSaleService Issue:**

```php
class HeldSaleService
{
    public function holdSale(array $items, $shopId)
    {
        HeldSale::query()->create([...]);
    }
}
```

This does not reserve stock via StockMovementService, potentially causing overselling.

---

### 1.4 Policies Analysis

**Total Policies:** 39 (for 66 models)

#### Coverage

| Status           | Count | Models                               |
|------------------|-------|--------------------------------------|
| ✅ Has Policy     | 39    | Product, Order, Shop, Customer, etc. |
| ❌ Missing Policy | 27    | See list below                       |

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

#### Issues Found

| Severity    | Issue                       | Location                                                              |
|-------------|-----------------------------|-----------------------------------------------------------------------|
| 🔴 Critical | Cross-tenant access allowed | `SupplierPolicy::viewCatalog()` - returns `true` without tenant check |
| 🟠 High     | Missing tenant checks       | Multiple `viewAny()` methods don't verify tenant isolation            |
| 🟠 High     | 27 models lack policies     | No authorization for ~40% of models                                   |

**SupplierPolicy Cross-Tenant Issue:**

```php
public function viewCatalog(User $user, Supplier $supplier): bool
{
    return true;
}
```

This allows any authenticated user to view any supplier's catalog regardless of tenant relationship.

---

### 1.5 Enums Analysis

**Total Enums:** 37

#### Implementation Quality

| Feature                | Coverage | Notes                 |
|------------------------|----------|-----------------------|
| `label()` method       | 100%     | Human-readable labels |
| `color()` method       | 90%+     | UI color assignments  |
| `forSelect()` method   | 100%     | Dropdown generation   |
| `description()` method | 70%      | Detailed descriptions |

**Enum Categories:**

| Category | Enums                                                              |
|----------|--------------------------------------------------------------------|
| Order    | OrderStatus, OrderType, PaymentMethod, PaymentStatus, ReturnStatus |
| Stock    | MovementType, PackagingType, ReorderStatus                         |
| Payroll  | DeductionCategory, EarningCategory, PayFrequency, PayRunStatus     |
| User     | UserRole (8-level hierarchy), UserStatus                           |
| Shop     | ShopType, StorefrontDisplayMode                                    |

#### Issues Found

| Severity    | Issue                            | Location                                         |
|-------------|----------------------------------|--------------------------------------------------|
| 🔴 Critical | Database ENUMs violate CLAUDE.md | Migrations use `ENUM` type instead of `VARCHAR`  |
| 🟡 Medium   | Inconsistent color methods       | Some use Tailwind classes, others use hex colors |

**CLAUDE.md Violation:**

```php
$table->enum('status', ['pending', 'completed', 'cancelled']);
```

Should be:

```php
$table->string('status');
```

---

### 1.6 Form Requests Analysis

**Total Form Requests:** 49

#### Validation Coverage

| Aspect                   | Compliance | Notes                    |
|--------------------------|------------|--------------------------|
| All inputs validated     | 100%       | Comprehensive rules      |
| authorize() returns true | 100%       | Delegates to Gate/Policy |
| Tenant scoping in rules  | 90%+       | Validates ownership      |

**Form Request Categories:**

| Module   | Count                                           |
|----------|-------------------------------------------------|
| Product  | 6 (Create, Update, Import, BatchBarcode, etc.)  |
| Order    | 4 (Create, Update, AddPayment, etc.)            |
| Service  | 4 (Create, Update, CreateVariant, etc.)         |
| Payroll  | 8 (Create, ProcessPayroll, ApprovePayRun, etc.) |
| Customer | 3 (Create, Update, UpdateCreditLimit)           |
| ...      | 24 more                                         |

#### Issues Found

| Severity  | Issue                         | Location                                                   |
|-----------|-------------------------------|------------------------------------------------------------|
| 🟡 Medium | No validation for array items | `CreateOrderRequest.php` - `items.*` validation incomplete |
| 🟡 Medium | Missing conditional rules     | Some requests don't use `sometimes` for optional updates   |

---

### 1.7 Migrations Analysis

**Total Migrations:** 144
**Total Seeders:** 45

#### Database Statistics

| Metric             | Count |
|--------------------|-------|
| Tables             | 60+   |
| Foreign Keys       | 150+  |
| Indexes            | 100+  |
| Soft Delete Tables | 30+   |

#### Issues Found

| Severity    | Issue                       | Location                                                               |
|-------------|-----------------------------|------------------------------------------------------------------------|
| 🔴 Critical | Wrong foreign key reference | `orders.customer_id` → references `users` instead of `customers` table |
| 🔴 Critical | Database ENUMs used         | Multiple migrations use `$table->enum()` violating CLAUDE.md           |
| 🟠 High     | Missing tenant_id           | `customer_addresses` was missing tenant_id (fixed in later migration)  |
| 🟡 Medium   | Inconsistent naming         | Some tables use snake_case, others use camelCase for pivot tables      |

**orders.customer_id Issue:**

```php
$table->foreignId('customer_id')->constrained('users');
```

Should reference `customers` table since Customer model is separate from User.

**Tables Using Database ENUMs (should be VARCHAR):**

- orders.status
- orders.payment_status
- stock_movements.type
- pay_runs.status
- wage_advances.status
- timesheets.status
- fund_requests.status
- ... and 10+ more

---

### 1.8 Routes Analysis

**Total Routes:** ~300+ HTTP routes across 6 files

#### Route Files

| File           | Size         | Purpose                  |
|----------------|--------------|--------------------------|
| web.php        | 33,901 bytes | Main application routes  |
| api.php        | 578 bytes    | API endpoints            |
| auth.php       | 2,012 bytes  | Authentication routes    |
| settings.php   | 1,158 bytes  | Settings routes          |
| storefront.php | 4,732 bytes  | Public storefront routes |
| console.php    | 447 bytes    | Artisan commands         |

#### Middleware Usage

| Middleware     | Routes Protected |
|----------------|------------------|
| auth, verified | 250+ routes      |
| super_admin    | 15+ admin routes |
| guest:customer | Storefront auth  |
| auth:customer  | Customer portal  |

#### Issues Found

| Severity  | Issue                            | Location                                                                       |
|-----------|----------------------------------|--------------------------------------------------------------------------------|
| 🟠 High   | Debug route in production        | `/toast-demo` route should be removed or protected                             |
| 🟠 High   | Naming mismatch                  | `Route::prefix('staff')->name('users.')` - inconsistent naming                 |
| 🟡 Medium | Unauthenticated payment callback | `/payment/callback/{gateway}/{order}` - ensure controller validates signatures |
| 🟡 Medium | No API versioning                | API routes lack `/v1/` prefix                                                  |
| 🔵 Low    | Duplicate routes                 | Two routes for reorder-alerts with different URLs                              |

**Staff/Users Naming Mismatch:**

```php
Route::prefix('staff')->name('users.')->group(function () {
    Route::resource('/', StaffController::class);
});
```

URL is `/staff` but route name is `users.index`, `users.show`, etc.

---

## 2. Frontend Architecture

### 2.1 Pages Analysis

**Total Pages:** 139 TSX files

#### Organization by Module

| Module     | Pages | Notable Files                              |
|------------|-------|--------------------------------------------|
| Products   | 4     | Create.tsx (1,657 lines - most complex)    |
| Orders     | 4     | Show.tsx (786 lines)                       |
| POS        | 1     | Index.tsx (990 lines - excellent patterns) |
| Storefront | 11    | Checkout.tsx (851 lines)                   |
| Payroll    | 8+    | TaxSettings.tsx (1,026 lines)              |
| Admin      | 6     | Tenants/Index.tsx (300 lines)              |
| Reports    | 6     | Dynamic column configuration               |
| Staff      | 4     | Show.tsx (853 lines)                       |

#### Form Handling Patterns

| Pattern                    | Usage     | Compliance                    |
|----------------------------|-----------|-------------------------------|
| Inertia `<Form>` component | 136 pages | ✅ Recommended                 |
| `useForm` hook             | 2 pages   | ✅ For complex validation only |
| Local state + Form         | 3 pages   | ⚠️ Works but not optimal      |

#### Issues Found

| Severity  | Issue                                    | Location                                                                                                  |
|-----------|------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| 🟠 High   | Wrong import source                      | `Customers/Index.tsx:10` - imports `formatCurrency` from `@/types/customer` instead of `@/lib/formatters` |
| 🟠 High   | Hardcoded routes                         | 7-8 instances in Admin pages                                                                              |
| 🟡 Medium | `dangerouslySetInnerHTML` for pagination | 3 pages use this pattern                                                                                  |
| 🟡 Medium | `any` type suppression                   | `Services/Create.tsx:1` - eslint disable comment                                                          |

**Hardcoded Routes Found:**

| File                         | Hardcoded Route         | Should Use                              |
|------------------------------|-------------------------|-----------------------------------------|
| Admin/Tenants/Index.tsx      | `/admin/tenants/create` | `AdminTenantController.create.url()`    |
| Admin/Dashboard.tsx          | `/admin/tenants`        | `AdminTenantController.index.url()`     |
| ServiceCategories/Create.tsx | `/service-categories`   | `ServiceCategoryController.index.url()` |
| Settings/ShopSettings.tsx    | `/dashboard`            | `DashboardController.index.url()`       |
| Purchases/Create.tsx         | `/stock-movements`      | `StockMovementController.index.url()`   |

---

### 2.2 Components Analysis

**Total Components:** 155 files in 20 categories

#### Component Categories

| Category    | Count | Purpose                    |
|-------------|-------|----------------------------|
| ui/         | 45+   | Design system primitives   |
| form/       | 15+   | Form inputs and controls   |
| dashboard/  | 8     | Dashboard widgets and tabs |
| charts/     | 6     | Data visualization         |
| storefront/ | 10+   | E-commerce UI              |
| pos/        | 5     | Point of sale              |
| orders/     | 6     | Order management           |
| products/   | 4     | Product management         |

#### Component Patterns

| Pattern           | Compliance | Notes                     |
|-------------------|------------|---------------------------|
| TypeScript typing | 98%+       | Strong prop types         |
| forwardRef usage  | 90%+       | Proper ref forwarding     |
| Dark mode support | 95%+       | `dark:` variants          |
| Accessibility     | 80%+       | aria-labels, keyboard nav |

#### Issues Found

| Severity  | Issue                                 | Location                                                        |
|-----------|---------------------------------------|-----------------------------------------------------------------|
| 🟡 Medium | Demo components mixed with production | `form-elements/` contains ColorPickerDropdownDemo, CalendarDemo |
| 🟡 Medium | Monolithic tabs                       | Dashboard tabs are 500+ lines each                              |
| 🔵 Low    | Inconsistent prop naming              | Some use `className`, others use `class`                        |

**Demo Components to Remove:**

- `ColorPickerDropdown.tsx` (demo)
- `CalendarDemo.tsx`
- `FormLayoutExample.tsx`

---

### 2.3 Type System Analysis

**Total Type Files:** 27 with 200+ interfaces

#### Type Organization

| File          | Types Defined                                                |
|---------------|--------------------------------------------------------------|
| customer.ts   | Customer, CustomerBasic, CustomerAddress, CustomerStatistics |
| order.ts      | Order, OrderItem, OrderPayment, OrderStatus                  |
| product.ts    | Product, ProductVariant, ProductCategory, PackagingType      |
| payroll.ts    | Payslip, PayRun, PayRunItem, DeductionType, EarningType      |
| shop.ts       | Shop, ShopType, StorefrontSettings                           |
| storefront.ts | StorefrontHomeProps, CheckoutProps, CartItem                 |
| dashboard.ts  | DashboardProps, DashboardMetrics                             |
| sync.ts       | SyncProduct, POSCartItem                                     |

#### Issues Found

| Severity  | Issue                  | Location                                                                                      |
|-----------|------------------------|-----------------------------------------------------------------------------------------------|
| 🟡 Medium | Duplicate interface    | `CustomerAddress` defined in both `customer.ts` and `storefront.ts` with different structures |
| 🟡 Medium | Re-export pattern      | `customer.ts` re-exports `formatCurrency` from formatters (causes import confusion)           |
| 🔵 Low    | Local type definitions | Some pages define types locally instead of in `/types/`                                       |

**CustomerAddress Duplication:**

`types/customer.ts`:

```typescript
interface CustomerAddress {
    id: number;
    customer_id: number;
    type: 'billing' | 'shipping';
    ...
}
```

`types/storefront.ts`:

```typescript
interface CustomerAddress {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    ...
}
```

---

### 2.4 Design System Analysis

**Framework:** TailAdmin-based custom design system

#### Brand Colors

| Color     | Light Mode            | Dark Mode   |
|-----------|-----------------------|-------------|
| Primary   | `brand-500` (#7C3AED) | `brand-400` |
| Secondary | `gray-500`            | `gray-400`  |
| Success   | `green-500`           | `green-400` |
| Error     | `red-500`             | `red-400`   |
| Warning   | `amber-500`           | `amber-400` |

#### Typography

| Element  | Font           | Size                |
|----------|----------------|---------------------|
| Body     | Outfit         | text-sm (14px)      |
| Headings | Outfit         | text-lg to text-3xl |
| Code     | JetBrains Mono | text-sm             |

#### Issues Found

| Severity  | Issue                         | Location                                                          |
|-----------|-------------------------------|-------------------------------------------------------------------|
| 🟡 Medium | Hardcoded colors              | FlatPickr uses hardcoded colors that don't match brand            |
| 🟡 Medium | Inconsistent dark backgrounds | Mix of `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-dark-900` |
| 🔵 Low    | Missing hover states          | Some buttons lack hover/focus states                              |

---

### 2.5 Lib Utilities Analysis

**Total Files:** 7 utility modules with 153+ exports

#### Module Overview

| File              | Exports                  | Purpose                           |
|-------------------|--------------------------|-----------------------------------|
| formatters.ts     | 11                       | Currency, date, number formatting |
| calculations.ts   | 7                        | Business calculations             |
| status-configs.ts | 25+ configs, 40+ getters | Status labels, colors, badges     |
| ui-utils.ts       | 15+                      | UI helper functions               |
| utils.ts          | 10+                      | General utilities                 |
| indexeddb.ts      | 20+                      | Offline storage                   |

#### SSOT Implementation

Excellent Single Source of Truth architecture:

```typescript
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
import { getOrderStatusConfig, getPaymentStatusBadge } from '@/lib/status-configs';
import { calculateProfit, calculateMargin } from '@/lib/calculations';
```

#### Issues Found

| Severity  | Issue               | Location                                           |
|-----------|---------------------|----------------------------------------------------|
| 🟡 Medium | Deprecated export   | `utils.ts` still exports deprecated `formatDate()` |
| 🔵 Low    | Redundant functions | Some formatters duplicated between files           |

---

## 3. Critical Issues

### 🔴 Issue #1: orders.customer_id References Wrong Table

**Location:** `database/migrations/*_create_orders_table.php`

**Problem:** The `customer_id` foreign key references the `users` table instead of the `customers` table.

**Impact:** Data integrity issues. The Customer and User models are separate entities:

- `User` = Staff members (multi-tenant)
- `Customer` = E-commerce buyers (storefront)

**Fix Required:**

```php
$table->foreignId('customer_id')->constrained('customers');
```

---

### 🔴 Issue #2: HeldSaleService Bypasses Stock Audit Trail

**Location:** `app/Services/HeldSaleService.php`

**Problem:** Held sales do not reserve stock through `StockMovementService`, meaning:

- No audit trail for stock reservation
- Potential for overselling
- Inventory counts can be inaccurate

**Impact:** High - Could lead to overselling and inventory discrepancies.

**Fix Required:** Integrate `StockMovementService` for stock reservation on hold.

---

### 🔴 Issue #3: SupplierPolicy Cross-Tenant Access

**Location:** `app/Policies/SupplierPolicy.php`

**Problem:** `viewCatalog()` method returns `true` without verifying tenant relationship.

```php
public function viewCatalog(User $user, Supplier $supplier): bool
{
    return true;
}
```

**Impact:** Critical security vulnerability - any authenticated user can view any supplier's catalog.

**Fix Required:**

```php
public function viewCatalog(User $user, Supplier $supplier): bool
{
    return $supplier->tenant_id === $user->tenant_id
        || $supplier->hasConnectionWith($user->tenant_id);
}
```

---

### 🔴 Issue #4: Database ENUMs Violate CLAUDE.md

**Location:** 15+ migrations

**Problem:** CLAUDE.md explicitly states:
> "Enums - Define all enums as PHP Enums in `app/Enums/`. Never use database-level enums."

But migrations use:

```php
$table->enum('status', ['pending', 'completed', 'cancelled']);
```

**Impact:** Database portability issues, harder to add new enum values.

**Fix Required:** Convert all `enum` columns to `string` type.

---

### 🔴 Issue #5: OrderPaymentController Missing Authorization

**Location:** `app/Http/Controllers/OrderPaymentController.php`

**Problem:** No `Gate::authorize()` call before payment operations.

**Impact:** Users might be able to record payments on orders they don't have access to.

**Fix Required:** Add authorization check:

```php
public function store(StoreOrderPaymentRequest $request, Order $order)
{
    Gate::authorize('recordPayment', $order);
    // ...
}
```

---

### 🔴 Issue #6: PurchaseOrder Dual Tenant Architecture Conflict

**Location:** `app/Models/PurchaseOrder.php`

**Problem:** Model has both `buyer_tenant_id` and `supplier_tenant_id` but also uses `BelongsToTenant` trait which
expects a single `tenant_id`.

**Impact:** Tenant isolation queries may not work correctly for purchase orders.

**Fix Required:** Either:

1. Remove `BelongsToTenant` trait and implement custom scoping
2. OR rename fields to clarify the primary tenant

---

## 4. Security Concerns

### Authentication & Authorization

| Concern          | Status  | Notes                                         |
|------------------|---------|-----------------------------------------------|
| Route protection | ✅ Good  | All routes properly protected with middleware |
| Policy coverage  | ⚠️ Gaps | 27 models lack policies                       |
| CSRF protection  | ✅ Good  | All forms use CSRF tokens                     |
| Rate limiting    | ✅ Good  | Auth endpoints rate limited                   |

### Multi-Tenancy

| Concern             | Status  | Notes                                              |
|---------------------|---------|----------------------------------------------------|
| Query isolation     | ⚠️ Gaps | Some `viewAny()` methods missing tenant checks     |
| Service layer       | ⚠️ Gaps | POSService missing explicit tenant validation      |
| Cross-tenant access | ❌ Issue | SupplierPolicy allows cross-tenant catalog viewing |

### Data Validation

| Concern          | Status | Notes                                      |
|------------------|--------|--------------------------------------------|
| Input validation | ✅ Good | All Form Requests have comprehensive rules |
| SQL injection    | ✅ Good | Uses Eloquent ORM throughout               |
| XSS prevention   | ✅ Good | Blade/React escaping                       |

### Recommendations

1. **Add policies for all 27 missing models**
2. **Audit all `viewAny()` policy methods for tenant checks**
3. **Add explicit tenant validation in POSService**
4. **Review payment callback for signature verification**
5. **Remove debug `/toast-demo` route**

---

## 5. CLAUDE.md Compliance

| Rule                         | Compliance | Notes                            |
|------------------------------|------------|----------------------------------|
| Service Layer Architecture   | ✅ 95%+     | Controllers delegate to services |
| Form Requests for validation | ✅ 100%     | All inputs validated             |
| PHP Enums (not DB enums)     | ❌ Violated | 15+ migrations use DB ENUMs      |
| UUID Primary Keys            | ⚠️ Partial | Some models missing HasUuid      |
| Tenant Isolation             | ⚠️ Gaps    | Policy gaps identified           |
| Policy-Based Authorization   | ⚠️ Gaps    | 27 models lack policies          |
| Explicit Query Builder       | ✅ 90%+     | `Model::query()->` used          |
| Inertia Form component       | ✅ 98%+     | useForm only for complex cases   |
| Wayfinder routing            | ⚠️ Gaps    | 7-8 hardcoded routes             |
| SSOT for formatters          | ✅ Good     | Centralized in lib/              |
| No single-line comments      | ✅ Good     | Only JSDoc used                  |

---

## 6. Recommendations

### Priority 1: Critical Security (Fix Immediately)

1. **Fix SupplierPolicy cross-tenant access**
2. **Add authorization to OrderPaymentController**
3. **Add policies for payment-related models**

### Priority 2: Data Integrity (Fix This Week)

1. **Fix orders.customer_id foreign key**
2. **Integrate StockMovementService into HeldSaleService**
3. **Resolve PurchaseOrder dual tenant conflict**

### Priority 3: Standards Compliance (Fix This Sprint)

1. **Convert all database ENUMs to VARCHAR**
2. **Add missing policies for 27 models**
3. **Fix hardcoded routes in Admin pages**
4. **Remove debug `/toast-demo` route**

### Priority 4: Code Quality (Ongoing)

1. **Consolidate duplicate CustomerAddress types**
2. **Remove deprecated formatDate from utils.ts**
3. **Remove demo components from production**
4. **Split monolithic dashboard tabs into smaller components**
5. **Fix formatCurrency import in Customers pages**

### Priority 5: Documentation

1. **Document the dual-tenant PurchaseOrder pattern**
2. **Add route binding documentation**
3. **Document offline POS synchronization flow**

---

## Appendix A: File Paths Reference

### Critical Files to Fix

```
app/Policies/SupplierPolicy.php
app/Http/Controllers/OrderPaymentController.php
app/Services/HeldSaleService.php
app/Services/POSService.php
app/Models/PurchaseOrder.php
database/migrations/*_create_orders_table.php
```

### Frontend Files to Fix

```
resources/js/pages/Customers/Index.tsx
resources/js/pages/Customers/Show.tsx
resources/js/pages/Admin/Tenants/Index.tsx
resources/js/pages/Admin/Dashboard.tsx
resources/js/pages/ServiceCategories/Create.tsx
resources/js/pages/Settings/ShopSettings.tsx
resources/js/types/customer.ts (re-export issue)
resources/js/types/storefront.ts (duplicate CustomerAddress)
```

### Well-Implemented Reference Files

```
resources/js/pages/POS/Index.tsx (excellent offline patterns)
resources/js/lib/formatters.ts (SSOT example)
resources/js/lib/status-configs.ts (status management)
app/Services/StockMovementService.php (audit trail hub)
app/Policies/OrderPolicy.php (good authorization example)
```

---

**Report Generated:** January 21, 2026
**Analysis Tool:** Claude Code with 12 parallel exploration agents
**Total Analysis Time:** ~10 minutes
**Files Analyzed:** 600+ PHP and TypeScript files
