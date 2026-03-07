# ShelfWise Architectural Extraction Document

## System Overview

ShelfWise is a multi-tenant inventory management, retail, and payroll platform built with **Laravel 11 + Inertia.js + React + TypeScript + Tailwind CSS**. It serves small-to-medium businesses across Nigeria and beyond, providing:

- **Multi-tenancy** with subscription-based tenant isolation (global scope filtering)
- **Multi-shop management** with shop-type-specific configuration (retail, pharmacy, restaurant)
- **Inventory management** with packaging hierarchies, stock movements, reorder alerts, barcode generation
- **Point-of-sale (POS)** with offline capability and held sales
- **E-commerce storefront** with customer authentication, cart, checkout, and payment gateway integration
- **Order management** with full lifecycle (pending → delivered), returns, and refunds
- **Supplier/B2B system** with connection workflows, catalog management, purchase orders, and stock reservation
- **Payroll system** with pay runs, earnings/deductions, PAYE tax calculation (PITA 2011 & NTA 2025), payslip PDF generation, and NIBSS bank file export
- **Staff management** with onboarding, role-based authorization (8-level hierarchy), and shop-scoped access
- **Customer credit** system with balance tracking and automatic payment application
- **Timesheet tracking** with clock in/out, break management, and approval workflows
- **Reporting & analytics** across sales, inventory, suppliers, financials, customer analytics, and product profitability

The codebase follows a **service-layer architecture** with thin controllers, Form Request validation, enum-based state machines, and Laravel Policies for authorization.

---

## 1. Multi-Tenancy System

### 1.1 Tenant Model

**File:** `app/Models/Tenant.php`
**Traits:** `HasFactory`, `SoftDeletes`

**Fillable Fields:**

| Field | Type | Description |
|---|---|---|
| `name` | string | Tenant organization name |
| `slug` | string (unique) | URL-friendly identifier |
| `owner_email` | string | Primary contact email |
| `business_type` | string (nullable) | Type of business |
| `phone` | string (nullable) | Contact phone |
| `logo_path` | string (nullable) | Path to logo file |
| `settings` | json (nullable) | JSON configuration storage |
| `address` | string (nullable) | Business address |
| `is_active` | boolean (default: true) | Active status |
| `subscription_plan` | string (default: 'trial') | Current subscription tier |
| `trial_ends_at` | datetime (nullable) | Trial period end date |
| `subscription_ends_at` | datetime (nullable) | Subscription expiration date |
| `max_shops` | integer (default: 10) | Shop count limit |
| `max_users` | integer (default: 10) | User count limit |
| `max_products` | integer (default: 100) | Product count limit |

**Casts:** `settings` → array, `is_active` → boolean, `trial_ends_at` → datetime, `subscription_ends_at` → datetime, `max_shops` → integer, `max_users` → integer, `max_products` → integer

**Relationships:**

| Relationship | Type | Target |
|---|---|---|
| `users()` | HasMany | User |
| `shops()` | HasMany | Shop |
| `supplierProfile()` | HasOne | SupplierProfile |
| `supplierConnections()` | HasMany | SupplierConnection (as supplier_tenant_id) |
| `buyerConnections()` | HasMany | SupplierConnection (as buyer_tenant_id) |
| `purchaseOrdersAsBuyer()` | HasMany | PurchaseOrder (as buyer_tenant_id) |
| `purchaseOrdersAsSupplier()` | HasMany | PurchaseOrder (as supplier_tenant_id) |

**Methods:**

```php
isActive(): bool
isSupplier(): bool                    // checks supplierProfile?->is_enabled
isOnTrial(): bool                     // subscription_plan === 'trial' AND trial_ends_at is future
isTrialExpired(): bool                // subscription_plan === 'trial' AND trial_ends_at is past
hasActiveSubscription(): bool         // isOnTrial() OR subscription_ends_at is future
hasReachedShopLimit(): bool           // shops()->count() >= max_shops
hasReachedUserLimit(): bool           // users()->count() >= max_users
hasReachedProductLimit(): bool        // Product::where('tenant_id', $this->id)->count() >= max_products
getRemainingDays(): int               // days until trial or subscription ends
```

### 1.2 BelongsToTenant Trait

**File:** `app/Traits/BelongsToTenant.php`

**Boot method (`bootBelongsToTenant`):**
1. Registers `TenantScope` as a global scope on the model
2. Registers a `creating` event listener that auto-sets `tenant_id` from the authenticated user's `tenant_id` if not already set

### 1.3 TenantScope (Global Scope)

**File:** `app/Scopes/TenantScope.php`
**Implements:** `Illuminate\Database\Eloquent\Scope`

```php
apply(Builder $builder, Model $model): void
```

- Checks if user is authenticated AND has a `tenant_id`
- If both true: adds `WHERE {table}.tenant_id = auth()->user()->tenant_id` to every query
- If user not authenticated or has no `tenant_id`: no filtering (allows super admin access)

### 1.4 Tenant Service

**File:** `app/Services/TenantService.php`

```php
createTenant(array $tenantData, array $ownerData): array  // Returns ['tenant' => $tenant, 'owner' => $owner]
```

- Wraps in DB transaction
- Creates Tenant with 50-day trial, auto-generated unique slug
- Creates User with role `OWNER`, `is_tenant_owner: true`

```php
private generateUniqueSlug(string $name): string  // Appends -N counter until unique
```

### 1.5 How tenant_id Propagates

1. **Registration:** `TenantService::createTenant()` sets `tenant_id` on the owner User
2. **Model creation:** `BelongsToTenant::bootBelongsToTenant()` auto-assigns `tenant_id` from `auth()->user()->tenant_id` on `creating` event
3. **Query filtering:** `TenantScope::apply()` adds `WHERE tenant_id = ?` to all queries on models using `BelongsToTenant`
4. **Staff creation:** `StaffManagementService::create()` explicitly sets `tenant_id` from the Tenant model

---

## 2. Authentication & Authorization

### 2.1 User Model

**File:** `app/Models/User.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `Notifiable`, `SoftDeletes`, `TwoFactorAuthenticatable`

**Fillable Fields:**

| Field | Type | Description |
|---|---|---|
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `email` | string (unique) | Email address |
| `tenant_id` | foreignId (nullable) | Foreign key to tenant |
| `is_tenant_owner` | boolean (default: false) | Tenant ownership flag |
| `is_super_admin` | boolean (default: false) | Super admin flag |
| `role` | UserRole enum | Role enum value |
| `is_active` | boolean (default: true) | Active status |
| `onboarding_status` | OnboardingStatus enum | Onboarding state |
| `onboarded_at` | datetime (nullable) | Onboarding completion time |
| `onboarded_by` | foreignId (nullable) | User who onboarded |
| `is_customer` | boolean (default: false) | Also a customer flag |
| `marketing_opt_in` | boolean (default: false) | Marketing consent |
| `password` | string (hashed cast) | Password |

**Hidden:** `password`, `remember_token`

**Casts:** `email_verified_at` → datetime, `password` → hashed, `role` → UserRole, `onboarding_status` → OnboardingStatus, `is_tenant_owner` → boolean, `is_super_admin` → boolean, `is_active` → boolean, `onboarded_at` → datetime, `is_customer` → boolean, `marketing_opt_in` → boolean

**Accessor:** `getNameAttribute(): string` → `trim($first_name . ' ' . $last_name)`

**Relationships:**

| Relationship | Type | Target |
|---|---|---|
| `tenant()` | BelongsTo | Tenant |
| `onboardedBy()` | BelongsTo | User (self-referential) |
| `shops()` | BelongsToMany | Shop (via shop_user pivot, ShopUser model) |
| `employeePayrollDetail()` | HasOne | EmployeePayrollDetail |
| `customDeductions()` | HasMany | EmployeeCustomDeduction |
| `employeeEarnings()` | HasMany | EmployeeEarning |
| `employeeDeductions()` | HasMany | EmployeeDeduction |
| `timesheets()` | HasMany | Timesheet |
| `fundRequests()` | HasMany | FundRequest |
| `wageAdvances()` | HasMany | WageAdvance |
| `payslips()` | HasMany | Payslip |
| `taxSettings()` | HasOne | EmployeeTaxSetting |
| `notifications()` | HasMany | Notification |

**Methods:**

```php
isTenantOwner(): bool
isSuperAdmin(): bool          // is_super_admin OR role === UserRole::SUPER_ADMIN
hasTenant(): bool              // tenant_id !== null
canAccessTenant(?int $tenantId): bool  // isSuperAdmin() OR tenant_id === $tenantId
hasPermission(string $permission): bool  // delegates to role->hasPermission()
```

### 2.2 UserRole Enum

**File:** `app/Enums/UserRole.php`
**Type:** string-backed enum

**Cases & Levels:**

| Case | Value | Level | Multi-Store Access |
|---|---|---|---|
| `SUPER_ADMIN` | `super_admin` | 999 | Yes |
| `OWNER` | `owner` | 100 | Yes |
| `GENERAL_MANAGER` | `general_manager` | 80 | Yes |
| `STORE_MANAGER` | `store_manager` | 60 | No |
| `ASSISTANT_MANAGER` | `assistant_manager` | 50 | No |
| `SALES_REP` | `sales_rep` | 40 | No |
| `CASHIER` | `cashier` | 30 | No |
| `INVENTORY_CLERK` | `inventory_clerk` | 30 | No |

**Permission Arrays (abridged — key permissions per role):**

- **SUPER_ADMIN:** All permissions including `platform_admin`, `manage_all_tenants`, `manage_subscriptions`, `impersonate_users`
- **OWNER:** All tenant permissions: `manage_tenant`, `manage_stores`, `manage_users`, `view_all_reports`, `manage_inventory`, `manage_products`, `manage_orders`, `manage_customers`, `manage_settings`, `view_financials`, `view_profits`, `view_costs`, supplier permissions, full payroll permissions
- **GENERAL_MANAGER:** Same as OWNER minus `manage_tenant`, `manage_settings`, `view_all_reports` (has `view_reports`)
- **STORE_MANAGER:** `manage_store_users`, `view_store_reports`, `manage_store_inventory`, `manage_products`, `process_orders`, `manage_customers`, `manage_purchase_orders`, `receive_stock`, timesheet view/manage/approve, `view_payroll`, `view_payroll_reports`
- **ASSISTANT_MANAGER:** `view_store_reports`, `manage_store_inventory`, `process_orders`, `manage_customers`, `approve_supplier_connections`, `manage_purchase_orders`, `receive_stock`, timesheet view/manage/approve
- **SALES_REP:** `process_orders`, `view_products`, `manage_customers`, `view_inventory`, timesheet view/manage
- **CASHIER:** `process_sales`, `view_products`, `basic_customer_info`, timesheet view/manage
- **INVENTORY_CLERK:** `manage_store_inventory`, `view_products`, `receive_stock`, `stock_transfers`, `view_purchase_orders`, timesheet view/manage

**Methods:**

```php
label(): string                        // Human-readable name
description(): string                  // Detailed responsibility description
level(): int                           // Authorization level (30-999)
permissions(): array                   // Array of permission strings
hasPermission(string $permission): bool
canAccessMultipleStores(): bool        // true for SUPER_ADMIN, OWNER, GENERAL_MANAGER
isSuperAdmin(): bool
canManagePlatform(): bool
static managementRoles(): array        // [OWNER, GM, SM, AM]
static forSelect(): array              // All except SUPER_ADMIN as [value => label]
static allForSelect(): array           // All roles as [value => label]
static tenantRoles(): array            // All except SUPER_ADMIN
```

### 2.3 Policy Classes — Complete Inventory

All 39 policy classes are in `app/Policies/`. Every policy enforces **tenant isolation** (checking `$user->tenant_id === $model->tenant_id`) and uses **role level hierarchy** for authorization.

**Common authorization patterns across all policies:**

1. **Tenant isolation:** `$user->tenant_id !== $model->tenant_id` → return false
2. **Permission-based:** `$user->role->hasPermission('permission_name')`
3. **Role level comparison:** `$user->role->level() >= threshold`
4. **Shop-scoping:** `$user->shops()->where('shops.id', $model->shop_id)->exists()`
5. **Multi-store access:** `$user->role->canAccessMultipleStores()` (OWNER/GM bypass shop checks)
6. **Self-operation guards:** Cannot delete/impersonate self; can view/update own records
7. **Status-based:** Operations restricted by model status enums (e.g., only cancel PENDING orders)
8. **Dual-tenant:** PurchaseOrderPolicy, SupplierPolicy use buyer/supplier tenant distinctions

| Policy | Model | Key Methods |
|---|---|---|
| CartPolicy | Cart/CartItem | view, update, delete, manageItem — customer ownership + tenant match |
| CustomerAddressPolicy | CustomerAddress | viewAny, view, create, update, delete — staff vs customer auth |
| CustomerOrderPolicy | Order | viewAny, view, cancel — customer-facing, CUSTOMER type only |
| CustomerPolicy | Customer | viewAny, view, create, update, delete, manage — `manage_customers` perm |
| DashboardPolicy | User | view (is_active), viewFinancials (perm), refreshCache (multi-store) |
| EmployeeDeductionPolicy | EmployeeDeduction | CRUD — payroll perms, shop intersection for STORE_MANAGER |
| EmployeeEarningPolicy | EmployeeEarning | CRUD — payroll perms, shop intersection for STORE_MANAGER |
| EmployeePayrollPolicy | User (employee) | viewPayrollDetails, updatePayrollDetails, updateDeductionPreferences, updateTaxSettings |
| FundRequestPolicy | FundRequest | CRUD + approve, reject, disburse, cancel, restore, forceDelete — role hierarchy + shop containment |
| HeldSalePolicy | HeldSale | CRUD + resume — `process_sales`/`process_orders` perms |
| ImagePolicy | Image | CRUD — `manage_inventory` perm |
| NotificationPolicy | Notification | viewAny, view, markAsRead, delete — `isForUser()` check |
| OrderItemPolicy | OrderItem | CRUD — `manage_orders` perm, shop containment |
| OrderPaymentPolicy | OrderPayment | viewAny, view, create, delete — OWNER/GM for delete |
| OrderPolicy | Order | CRUD + cancel, refund, export, fulfill, ship — status-based transitions, role level for cancel (≥SM) and refund (≥GM) |
| OrderReturnPolicy | OrderReturn | CRUD + approve, reject, process, cancel — `manage_returns` perm, SM+ for approve |
| PayRunPolicy | PayRun | CRUD + calculate, submit, approve, reject, complete, cancel, regenerate, excludeEmployee, includeEmployee, viewReports, exportReports, manageSettings — GM+ for approve/regenerate |
| PayrollPeriodPolicy | PayrollPeriod | CRUD + close, reopen — GM+ for close, OWNER for reopen |
| PayrollPolicy | PayrollPeriod | viewAny, view, create, process, approve, markAsPaid, cancel, delete, viewOwnPayslip — SM+ for viewAny, OWNER/GM for create/process/approve |
| PayslipPolicy | Payslip | viewAny, viewOwn, view — SM+ for viewAny, own payslip always |
| ProductCategoryPolicy | ProductCategory | CRUD — `manage_inventory` perm, OWNER/GM for delete |
| ProductPolicy | Product | CRUD + manage, restore, forceDelete, duplicate — shop containment, OWNER for forceDelete |
| ProductTemplatePolicy | ProductTemplate | CRUD + createProduct, saveAsTemplate — system templates bypass tenant checks |
| ProductVariantPolicy | ProductVariant | view, update, delete — via product's tenant, OWNER/GM for delete |
| PurchaseOrderPolicy | PurchaseOrder | CRUD + submit, approve, ship, receive, cancel, recordPayment, viewAsSupplier, viewAsBuyer — dual-tenant logic |
| ReceiptPolicy | Receipt | viewAny, view — `view_orders`/`manage_orders` perm |
| ReportPolicy | User | view — `view_reports` perm |
| ServicePolicy | Service | create, view, manage, delete — `manage_inventory` perm, shop containment |
| ShopPolicy | Shop | create, view, manage, delete — `manage_stores` perm, OWNER for delete |
| StaffPolicy | User | viewAny, view, create, update, delete, assignRole — role level hierarchy, cannot modify tenant owner |
| StockMovementPolicy | StockMovement | viewAny, view, create, adjustStock, transferStock, stockTake — `manage_inventory` perm |
| StorefrontPolicy | Shop | toggleStorefront, configureSettings, viewAnalytics, manageProducts, toggleRetailSales, manageOrders, viewCustomers, configureTax, configureCurrency — role-based + shop assignment |
| SupplierConnectionPolicy | SupplierConnection | viewAny, view, create, approve, reject, suspend, activate, updateTerms — dual-tenant |
| SupplierPolicy | SupplierProfile | viewAny, view, enableSupplierMode, updateProfile, manageCatalog, viewCatalog — cross-tenant catalog access via approved connections |
| SyncPolicy | Shop | syncProducts, syncCustomers, syncOrders — shop containment |
| TenantPolicy | Tenant | viewAny, view, update, manageBilling, manageUsers, manageSettings, suspend, delete — super admin for suspend/delete |
| TimesheetPolicy | Timesheet | viewAny, view, create, update, clockInOut, manageBreaks, submit, approve, reject, delete, restore, forceDelete — status-based + role hierarchy + shop intersection |
| UserPolicy | User | viewAny, view, create, update, delete, resetPassword, impersonate, manageRoles, restore, forceDelete — tenant owner for impersonate/manageRoles |
| WageAdvancePolicy | WageAdvance | viewAny, view, create, update, approve, reject, disburse, cancel, recordRepayment, delete, restore, forceDelete — payroll detail required for create |

### 2.4 Gate Definitions

**File:** `app/Providers/AppServiceProvider.php`

**Named Gates:**

```php
// PayRun gates
'payRun.viewAny', 'payRun.create', 'payRun.viewReports', 'payRun.exportReports', 'payRun.manageSettings'

// Dashboard gates
'dashboard.view', 'dashboard.view_financials', 'dashboard.refresh_cache'

// Shop gates
'shop.view', 'shop.manage'

// Catalog/Supplier gates
'catalog.manage', 'catalog.viewAny', 'catalog.view', 'catalog.enableSupplierMode',
'catalog.updateProfile', 'catalog.viewCatalog'

// Purchase Order gates (13 total)
'purchaseOrder.viewAny', 'purchaseOrder.view', 'purchaseOrder.create', 'purchaseOrder.update',
'purchaseOrder.delete', 'purchaseOrder.submit', 'purchaseOrder.approve', 'purchaseOrder.ship',
'purchaseOrder.receive', 'purchaseOrder.cancel', 'purchaseOrder.recordPayment',
'purchaseOrder.viewAsSupplier', 'purchaseOrder.viewAsBuyer'

// Report & Timesheet gates
'reports.view', 'timesheet.viewAny'

// Admin gates (closure-based, super admin only)
'admin.tenants.viewAny', 'admin.tenants.view', 'admin.tenants.create',
'admin.tenants.update', 'admin.tenants.delete'
```

### 2.5 Middleware

| Middleware | File | Purpose |
|---|---|---|
| `EnsureSuperAdmin` | `app/Http/Middleware/EnsureSuperAdmin.php` | Aborts 403 if `!$user->isSuperAdmin()` |
| `EnsureStorefrontEnabled` | `app/Http/Middleware/EnsureStorefrontEnabled.php` | Aborts 404 if `!$shop->storefront_enabled` |
| `HandleInertiaRequests` | `app/Http/Middleware/HandleInertiaRequests.php` | Shares auth user, app name, sidebar state, all UserRole data with every React page |
| `HandleAppearance` | `app/Http/Middleware/HandleAppearance.php` | Shares theme preference (system/light/dark) from cookie |

---

## 3. Employee / Staff Management

### 3.1 Staff Creation & Onboarding

**StaffManagementService** (`app/Services/StaffManagementService.php`) handles basic CRUD:

```php
create(array $data, Tenant $tenant, User $creator): User
update(User $staff, array $data, User $updater): User
list(Tenant $tenant, User $requester, array $filters = []): Collection
find(int $staffId, Tenant $tenant): ?User
delete(User $staff): bool
assignShops(User $staff, array $shopIds, Tenant $tenant): void
getStatistics(Tenant $tenant): array
```

**StaffOnboardingService** (`app/Services/StaffOnboardingService.php`) handles comprehensive onboarding with payroll setup:

```php
createStaffWithPayroll(array $data, Tenant $tenant, User $creator): User
updateStaffWithPayroll(User $staff, array $data): User
```

Onboarding flow:
1. `createUser()` — Creates User with `onboarding_status: in_progress`
2. `assignShops()` — Creates ShopUser pivot records
3. `createPayrollDetail()` — Creates EmployeePayrollDetail
4. `createTaxSettings()` — Creates EmployeeTaxSetting
5. `assignDefaultEarnings()` — Creates BASIC and optionally COMMISSION EmployeeEarning records
6. Updates user: `onboarding_status: completed`, `onboarded_at`, `onboarded_by`
7. Auto-saves as EmployeeTemplate via EmployeeTemplateService

### 3.2 ShopUser Pivot Model

**File:** `app/Models/ShopUser.php`
**Traits:** `BelongsToTenant`
**Table:** `shop_user`

**Fields:** `tenant_id`, `user_id`, `shop_id`, `created_at`, `updated_at`

**Relationships:** `tenant()`, `user()`, `shop()` — all BelongsTo

### 3.3 OnboardingStatus Enum

**File:** `app/Enums/OnboardingStatus.php`

| Case | Value | Color |
|---|---|---|
| `PENDING` | `pending` | warning |
| `IN_PROGRESS` | `in_progress` | info |
| `COMPLETED` | `completed` | success |

---

## 4. Payroll System

### 4.1 EmployeePayrollDetail Model

**File:** `app/Models/EmployeePayrollDetail.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fillable Fields:**

| Field | Type | Description |
|---|---|---|
| `user_id` | foreignId (unique) | Employee |
| `tenant_id` | foreignId | Tenant |
| `employment_type` | EmploymentType enum | FULL_TIME, PART_TIME, CONTRACT, SEASONAL, INTERN |
| `pay_type` | PayType enum | SALARY, HOURLY, DAILY, COMMISSION_BASED |
| `pay_amount` | decimal(15,2) | Base pay amount |
| `pay_frequency` | PayFrequency enum | DAILY, WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| `pay_calendar_id` | foreignId (nullable) | Pay calendar reference |
| `standard_hours_per_week` | decimal(5,2) | Standard work hours |
| `overtime_multiplier` | decimal(3,2) | Overtime rate multiplier |
| `weekend_multiplier` | decimal(3,2) | Weekend rate multiplier |
| `holiday_multiplier` | decimal(3,2) | Holiday rate multiplier |
| `commission_rate` | decimal(5,2) | Commission percentage |
| `commission_basis` | string (nullable) | Basis for commission |
| `commission_cap` | decimal(15,2) (nullable) | Maximum commission |
| `tax_handling` | TaxHandling enum | SHOP_CALCULATES, EMPLOYEE_CALCULATES, EXEMPT |
| `enable_tax_calculations` | boolean | Tax calculation toggle |
| `tax_id_number` | encrypted text | Tax ID (encrypted at rest) |
| `pension_enabled` | boolean | Pension deduction flag |
| `pension_employee_rate` | decimal(5,2) (default: 8.00) | Employee pension % |
| `pension_employer_rate` | decimal(5,2) (default: 10.00) | Employer pension % |
| `nhf_enabled` | boolean | NHF deduction flag |
| `nhf_rate` | decimal(5,2) (default: 2.50) | NHF rate % |
| `nhis_enabled` | boolean | NHIS flag |
| `nhis_amount` | decimal(10,2) (nullable) | NHIS fixed amount |
| `bank_account_number` | encrypted text | Bank account (encrypted) |
| `bank_name` | string (nullable) | Bank name |
| `routing_number` | encrypted text | Routing number (encrypted) |
| `position_title` | string (nullable) | Job title |
| `department` | string (nullable) | Department |
| `start_date` | date (nullable) | Employment start |
| `end_date` | date (nullable) | Employment end |

**Methods:**

```php
getMonthlyHours(): float                        // standard_hours_per_week * 4.33
calculateHourlyRate(): float                     // Hourly: pay_amount; Salary: pay_amount / monthly_hours
calculateCommission(float $salesAmount): float   // salesAmount * commission_rate, capped
calculateOvertimePay(float $hours): float        // hours * hourlyRate * overtime_multiplier (default 1.5)
calculateWeekendPay(float $hours): float         // hours * hourlyRate * weekend_multiplier (default 2.0)
calculateHolidayPay(float $hours): float         // hours * hourlyRate * holiday_multiplier (default 2.5)
```

### 4.2 PayCalendar Model

**File:** `app/Models/PayCalendar.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `tenant_id`, `name`, `description`, `frequency` (PayFrequency), `pay_day` (int), `cutoff_day` (int), `is_default` (bool), `is_active` (bool)

**Scopes:** `active()`, `forTenant()`, `default()`

**Methods:**

```php
getNextPayDate(Carbon $from = null): Carbon
getPeriodDates(Carbon $payDate): array  // Returns [start, end] based on frequency
```

### 4.3 PayRun Model

**File:** `app/Models/PayRun.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `tenant_id`, `payroll_period_id`, `pay_calendar_id`, `reference`, `name`, `status` (PayRunStatus), `employee_count`, `total_gross`, `total_deductions`, `total_net`, `total_employer_costs`, `calculated_by`, `calculated_at`, `approved_by`, `approved_at`, `completed_by`, `completed_at`, `notes`, `metadata` (array)

**Status Lifecycle:**

```
DRAFT → CALCULATING → PENDING_REVIEW → PENDING_APPROVAL → APPROVED → PROCESSING → COMPLETED
                                     ↘ CANCELLED (from DRAFT, PENDING_REVIEW, PENDING_APPROVAL)
```

**Methods:**

```php
static generateReference(int $tenantId): string  // PR-Ymd-XXXX with row-level locking
canBeCalculated(): bool   // status in [DRAFT, PENDING_REVIEW]
canBeApproved(): bool     // status = PENDING_APPROVAL
canBeCompleted(): bool    // status = APPROVED
canBeCancelled(): bool    // status in [DRAFT, PENDING_REVIEW, PENDING_APPROVAL]
updateTotals(): void      // Sums all CALCULATED items
```

### 4.4 PayRunItem Model

**File:** `app/Models/PayRunItem.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `tenant_id`, `pay_run_id`, `user_id`, `payslip_id`, `status` (PayRunItemStatus), `basic_salary`, `gross_earnings`, `taxable_earnings`, `total_deductions`, `net_pay`, `employer_pension`, `employer_nhf`, `total_employer_cost`, `earnings_breakdown` (array), `deductions_breakdown` (array), `tax_calculation` (array), `error_message`

**Status:** `PENDING` | `CALCULATED` | `ERROR` | `EXCLUDED`

**Methods:**

```php
markAsCalculated(array $data): void
markAsError(string $message): void
exclude(string $reason): void
reset(): void
getTaxLawVersion(): ?TaxLawVersion      // From tax_calculation
isLowIncomeExempt(): bool               // From tax_calculation
getReliefsApplied(): array              // From tax_calculation
hasRentRelief(): bool
getEffectiveTaxRate(): float            // (tax / gross_earnings) × 100
```

### 4.5 Payslip Model

**File:** `app/Models/Payslip.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `payroll_period_id`, `pay_run_id`, `user_id`, `tenant_id`, `shop_id`, `basic_salary`, `gross_earnings`, `regular_hours`, `regular_pay`, `overtime_hours`, `overtime_pay`, `bonus`, `commission`, `gross_pay`, `income_tax`, `pension_employee`, `pension_employer`, `nhf`, `nhis`, `wage_advance_deduction`, `other_deductions`, `total_deductions`, `net_pay`, `ytd_gross`, `ytd_tax`, `ytd_pension`, `ytd_net`, `earnings_breakdown` (array), `deductions_breakdown` (array), `tax_breakdown` (array), `tax_calculation` (array), `employer_contributions` (array), `notes`, `status`, `cancellation_reason`, `cancelled_by`, `cancelled_at`

### 4.6 PayRunService — Complete Processing Pipeline

**File:** `app/Services/PayRunService.php`
**Dependencies:** `EarningsService`, `DeductionsService`, `TaxCalculationService`, `NotificationService`, `WageAdvanceService`

```php
createPayrollPeriod(...): PayrollPeriod      // With overlap validation
createPayRun(...): PayRun                    // Creates pay run with eligible employees
calculatePayRun(PayRun $payRun): PayRun      // Processes all items
recalculateItem(PayRunItem $item): PayRunItem
approvePayRun(...): PayRun
completePayRun(...): PayRun                  // Generates payslips
cancelPayRun(...): PayRun
excludeEmployee(...): void
includeEmployee(...): void
getEligibleEmployees(...): Collection
calculateEmployeePay(...): array
```

**Pay Run Processing Pipeline:**
1. Create PayrollPeriod (start/end dates, payment date, shop scope)
2. Create PayRun → generates PayRunItems for eligible employees
3. Calculate PayRun → for each item: compute earnings → compute deductions → compute tax → mark CALCULATED or ERROR
4. Update PayRun totals (sums all CALCULATED items)
5. Submit for approval (PENDING_REVIEW → PENDING_APPROVAL)
6. Approve PayRun (validates, GM+ required)
7. Complete PayRun (generates Payslips, marks COMPLETED)

### 4.7 EarningsService

**File:** `app/Services/EarningsService.php`

```php
getActiveEarnings(User $employee, ?Carbon $asOfDate = null): Collection
calculateEmployeeEarnings(...): array  // Returns [breakdown, total_gross, total_taxable, total_pensionable]
assignEarning(...): EmployeeEarning
updateEarning(...): EmployeeEarning
deactivateEarning(...): void
calculateCommissionEarning(...): float  // Based on Order model sales
```

### 4.8 DeductionsService

**File:** `app/Services/DeductionsService.php`

```php
getActiveDeductions(User $employee, ?Carbon $asOfDate = null): Collection  // Sorted by priority
calculateEmployeeDeductions(...): array  // Returns [breakdown, total_deductions, total_pre_tax, total_post_tax, statutory_total, voluntary_total, adjusted_taxable]
assignDeduction(...): EmployeeDeduction
updateDeduction(...): EmployeeDeduction
deactivateDeduction(...): void
```

### 4.9 Earning & Deduction Type Models

**EarningType** (`app/Models/EarningType.php`): `tenant_id`, `code`, `name`, `description`, `category` (EarningCategory), `calculation_type` (EarningCalculationType), `default_amount`, `default_rate`, `is_taxable`, `is_pensionable`, `is_recurring`, `is_system`, `is_active`, `display_order`, `metadata`

**DeductionTypeModel** (`app/Models/DeductionTypeModel.php`, table: `deduction_types`): `tenant_id`, `code`, `name`, `description`, `category` (DeductionCategory), `calculation_type` (DeductionCalculationType), `calculation_base` (DeductionCalculationBase), `default_amount`, `default_rate`, `max_amount`, `annual_cap`, `is_pre_tax`, `is_mandatory`, `is_system`, `is_active`, `priority`, `metadata`

### 4.10 EmployeeEarning & EmployeeDeduction Models

**EmployeeEarning** (`app/Models/EmployeeEarning.php`): `tenant_id`, `user_id`, `earning_type_id`, `amount`, `rate`, `effective_from`, `effective_to`, `is_active`, `custom_rules`

- `calculateAmount(float $baseSalary, array $context): float` — Uses earningType.calculation_type (FIXED, PERCENTAGE, HOURLY, FORMULA)

**EmployeeDeduction** (`app/Models/EmployeeDeduction.php`): `tenant_id`, `user_id`, `deduction_type_id`, `amount`, `rate`, `total_target`, `total_deducted`, `effective_from`, `effective_to`, `is_active`, `custom_rules`

- `calculateAmount(array $amounts): float` — Uses calculation_base + calculation_type, respects max_amount cap and total_target remaining
- `recordDeduction(float $amount): void` — Increments total_deducted, auto-deactivates if target reached

**EmployeeCustomDeduction** (`app/Models/EmployeeCustomDeduction.php`): `user_id`, `tenant_id`, `deduction_name`, `deduction_type` (DeductionType enum), `amount`, `percentage`, `is_active`, `effective_from`, `effective_to`

- `calculateDeduction(float $grossPay): float` — FIXED_AMOUNT/LOAN_REPAYMENT/etc → amount, PERCENTAGE → grossPay × percentage / 100

### 4.11 WageAdvance System

**WageAdvance Model** (`app/Models/WageAdvance.php`): `user_id`, `shop_id`, `tenant_id`, `amount_requested`, `amount_approved`, `status` (WageAdvanceStatus), `reason`, `requested_at`, `approved_by_user_id`, `approved_at`, `rejection_reason`, `disbursed_by_user_id`, `disbursed_at`, `repayment_start_date`, `repayment_installments`, `amount_repaid`, `fully_repaid_at`, `notes`

**Lifecycle:** PENDING → APPROVED → DISBURSED → REPAYING → REPAID (or CANCELLED/REJECTED)

**WageAdvanceRepayment Model** (`app/Models/WageAdvanceRepayment.php`): `wage_advance_id`, `tenant_id`, `payroll_period_id`, `amount`, `repayment_date`, `payment_method`, `reference_number`, `notes`, `recorded_by`

**WageAdvanceService** (`app/Services/WageAdvanceService.php`):

```php
calculateEligibility(User $employee, Shop $shop): array  // [eligible, reason, max_amount, available_amount, ...]
create(User $user, Shop $shop, array $data): WageAdvance
approve(WageAdvance, User $approver, ?string $reason): WageAdvance
reject(WageAdvance, User $rejector, string $reason): WageAdvance
disburse(WageAdvance, User $disburser): WageAdvance
cancel(WageAdvance, User $canceller, ?string $reason): WageAdvance
recordRepayment(...): WageAdvanceRepayment
```

### 4.12 FundRequest System

**FundRequest Model** (`app/Models/FundRequest.php`): `user_id`, `shop_id`, `tenant_id`, `request_type` (FundRequestType), `amount`, `description`, `status` (FundRequestStatus), `requested_at`, `approved_by_user_id`, `approved_at`, `rejection_reason`, `disbursed_by_user_id`, `disbursed_at`, `receipt_uploaded`, `notes`

**FundRequestType cases:** REPAIRS, FUEL, SUPPLIES, INVENTORY, UTILITIES, MAINTENANCE, EQUIPMENT, TRANSPORTATION, OTHER

### 4.13 Payroll Export & Reports

**NibssExportService** (`app/Services/NibssExportService.php`): Generates NIBSS-format bank schedule files with 50+ Nigerian bank codes, header/detail/trailer records.

**PayrollReportService** (`app/Services/PayrollReportService.php`): `getPayrollSummary()`, `getTaxRemittanceReport()`, `getPensionReport()`, `getEmployeePayHistory()`, `getDeductionReport()`, `getYearToDateReport()`

**PayrollExportService** (`app/Services/PayrollExportService.php`): Formats payroll data for CSV export.

**PayslipPdfService** (`app/Services/PayslipPdfService.php`): `generatePayslipPdf()`, `downloadPayslip()`, `streamPayslip()`, `generateBulkPayslipsPdf()`, `downloadBulkPayslips()`

**PayrollAuditLog Model** (`app/Models/PayrollAuditLog.php`): 22 ACTION_* constants tracking all payroll lifecycle events. Morphable `auditable` relationship.

### 4.14 Payroll Enums — Complete

| Enum | Cases |
|---|---|
| `PayRunStatus` | DRAFT, CALCULATING, PENDING_REVIEW, PENDING_APPROVAL, APPROVED, PROCESSING, COMPLETED, CANCELLED |
| `PayRunItemStatus` | PENDING, CALCULATED, ERROR, EXCLUDED |
| `PayrollStatus` | DRAFT, PROCESSING, PROCESSED, APPROVED, PAID, CANCELLED |
| `PayFrequency` | DAILY, WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| `PayType` | SALARY, HOURLY, DAILY, COMMISSION_BASED |
| `EmploymentType` | FULL_TIME, PART_TIME, CONTRACT, SEASONAL, INTERN |
| `WageAdvanceStatus` | PENDING, APPROVED, REJECTED, DISBURSED, REPAYING, REPAID, CANCELLED |
| `FundRequestStatus` | PENDING, APPROVED, REJECTED, DISBURSED, CANCELLED |
| `FundRequestType` | REPAIRS, FUEL, SUPPLIES, INVENTORY, UTILITIES, MAINTENANCE, EQUIPMENT, TRANSPORTATION, OTHER |
| `EarningCalculationType` | FIXED, PERCENTAGE, HOURLY, FORMULA |
| `EarningCategory` | BASE, ALLOWANCE, BONUS, COMMISSION, OVERTIME, OTHER |
| `DeductionCalculationType` | FIXED, PERCENTAGE, TIERED, FORMULA |
| `DeductionCalculationBase` | GROSS, BASIC, TAXABLE, PENSIONABLE, NET |
| `DeductionCategory` | STATUTORY, VOLUNTARY, LOAN, ADVANCE, OTHER |
| `DeductionType` | FIXED_AMOUNT, PERCENTAGE, LOAN_REPAYMENT, ADVANCE_REPAYMENT, INSURANCE, UNION_DUES, SAVINGS, OTHER |

---

## 5. Tax Calculation System

### 5.1 Tax Models

**TaxTable** (`app/Models/TaxTable.php`): Core model for tax configuration per year/jurisdiction.

| Field | Type | Description |
|---|---|---|
| `tenant_id` | foreignId (nullable) | NULL for system tables |
| `name`, `description` | string, text | Display info |
| `jurisdiction` | string(10) (default: 'NG') | Country code |
| `effective_year` | year | Tax year |
| `effective_from`, `effective_to` | date | Active date range |
| `tax_law_reference` | string(50) | 'pita_2011' or 'nta_2025' |
| `has_low_income_exemption` | boolean | NTA 2025 feature |
| `low_income_threshold` | decimal(15,2) | ₦800,000 for NTA 2025 |
| `cra_applicable` | boolean (default: true) | CRA feature flag |
| `is_system`, `is_active` | boolean | Flags |

**TaxBand** (`app/Models/TaxBand.php`): `tax_table_id`, `min_amount`, `max_amount`, `rate`, `cumulative_tax`, `band_order`

```php
calculateTaxForBand(float $taxableIncome): float
// Returns 0 if income <= min_amount
// taxableInBand = min(taxableIncome, max_amount) - min_amount
// tax = max(0, taxableInBand) * (rate / 100)
```

**TaxRelief** (`app/Models/TaxRelief.php`): `tax_table_id`, `code`, `name`, `description`, `relief_type` (TaxReliefType), `amount`, `rate`, `cap`, `is_automatic`, `is_active`, `requires_proof`, `proof_type`, `eligibility_criteria`, `calculation_formula`

```php
calculateRelief(float $grossIncome, array $context = []): float
// FIXED: returns amount
// PERCENTAGE: grossIncome * (rate / 100)
// CAPPED_PERCENTAGE: min(grossIncome * (rate / 100), cap)
// CRA: MAX((1% of gross + ₦200,000), 20% of gross) — PITA 2011 only
// RENT_RELIEF: min(annual_rent_paid * 20%, ₦500,000) — NTA 2025 only
// LOW_INCOME_EXEMPTION: If income ≤ ₦800K → full exemption
```

**EmployeeTaxSetting** (`app/Models/EmployeeTaxSetting.php`): `tenant_id`, `user_id`, `tax_id_number`, `tax_state`, `is_tax_exempt`, `exemption_reason`, `exemption_expires_at`, `active_reliefs` (JSON), `is_homeowner`, `annual_rent_paid`, `rent_proof_document`, `rent_proof_expiry`, `relief_claims` (JSON), `low_income_auto_exempt`, `rent_relief_percentage`

### 5.2 Tax Enums

| Enum | Cases |
|---|---|
| `TaxHandling` | SHOP_CALCULATES, EMPLOYEE_CALCULATES, EXEMPT |
| `TaxLawVersion` | PITA_2011, NTA_2025 — methods: `hasCRA()`, `hasRentRelief()`, `hasLowIncomeExemption()` |
| `TaxReliefType` | FIXED, PERCENTAGE, CAPPED_PERCENTAGE, CRA, RENT_RELIEF, LOW_INCOME_EXEMPTION |

### 5.3 TaxCalculationService — Complete PAYE Formula

**File:** `app/Services/TaxCalculationService.php`

**Entry Point:**

```php
calculateMonthlyPAYE(
    User $employee,
    float $monthlyGrossIncome,
    float $monthlyPreTaxDeductions = 0,
    array $activeReliefCodes = [],
    ?Carbon $effectiveDate = null
): array
```

**Step-by-step PAYE calculation:**

1. **Exemption Check:** If `taxSettings->isCurrentlyExempt()` → return tax=0, is_exempt=true
2. **Annualize Income:** `annualGross = monthlyGross × 12` (or `× annualizationFactor` for hourly/daily workers where factor = `(standardHoursPerWeek × 52) / (standardHoursPerWeek × 4.33)`)
3. **Tax Table Selection:** `TaxTable::getActiveTableForDate()` filters by active status, jurisdiction, tenant, effective date range
4. **Low Income Exemption (NTA 2025):** If `annualGross ≤ ₦800,000` → full exemption, tax=0
5. **CRA (PITA 2011 only):** `MAX((1% of gross + ₦200,000), 20% of gross)` — NTA 2025 returns 0
6. **Rent Relief (NTA 2025 only):** If eligible: `min(annual_rent_paid × 20%, ₦500,000)` — requires proof
7. **Automatic Reliefs:** Query `is_automatic=true`, `is_active=true` reliefs (excluding CRA, LOW_INCOME_EXEMPTION, RENT_RELIEF)
8. **Manual Reliefs:** Apply employee-selected reliefs from `active_reliefs` JSON array
9. **Taxable Income:** `max(0, annualGross - annualPreTaxDeductions - totalReliefs)`
10. **Tax Calculation:** Apply tax bands in order: `Σ band.calculateTaxForBand(taxableIncome)`
11. **Monthly Tax:** `round(annualTax / 12, 2)`

**Return structure:**

```php
[
    'tax' => float,                    // Monthly PAYE to withhold
    'annual_tax' => float,
    'taxable_income' => float,         // Monthly
    'annual_taxable_income' => float,
    'total_reliefs' => float,
    'reliefs_applied' => array,        // Individual reliefs with amounts
    'band_breakdown' => array,         // Tax bands applied
    'is_exempt' => bool,
    'is_low_income_exempt' => bool,
    'tax_law_version' => string,
    'effective_date' => string,
]
```

### 5.4 PITA 2011 vs NTA 2025

| Feature | PITA 2011 | NTA 2025 (effective 2026-01-01) |
|---|---|---|
| CRA | YES: MAX((1% + ₦200K), 20%) | NO (replaced by Rent Relief) |
| Rent Relief | NO | YES: min(rent × 20%, ₦500K) |
| Low Income Exemption | NO | YES: Full exemption if ≤ ₦800K |

---

## 6. Timesheet System

### 6.1 Timesheet Model

**File:** `app/Models/Timesheet.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `user_id`, `shop_id`, `tenant_id`, `date`, `clock_in`, `clock_out`, `break_start`, `break_end`, `break_duration_minutes`, `regular_hours`, `overtime_hours`, `total_hours`, `notes`, `status` (TimesheetStatus), `approved_by_user_id`, `approved_at`, `rejection_reason`

**TimesheetStatus cases:** DRAFT, SUBMITTED, APPROVED, REJECTED, PAID

**Methods:** `isClockedIn()`, `isOnBreak()`, `getDurationMinutes()`

### 6.2 TimesheetService

**File:** `app/Services/TimesheetService.php`

```php
clockIn(User $employee, Shop $shop, ?Carbon $dateTime): Timesheet
clockOut(Timesheet $timesheet, ?Carbon $dateTime): Timesheet  // Calculates hours
startBreak(Timesheet, ?Carbon): Timesheet
endBreak(Timesheet, ?Carbon): Timesheet
submitTimesheet(Timesheet, ?string $notes): Timesheet
approveTimesheet(Timesheet, User $approver): Timesheet
rejectTimesheet(...): Timesheet
calculateHours(Timesheet): array  // [regular, overtime, total]
```

---

## 7. Inventory & Stock Management

### 7.1 Product Model

**File:** `app/Models/Product.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `tenant_id`, `shop_id`, `template_id`, `product_type_id`, `category_id`, `name`, `slug`, `description`, `custom_attributes` (array), `has_variants` (bool), `is_active` (bool), `track_stock` (bool), `is_taxable` (bool), `is_featured` (bool), `display_order` (int), `seo_title`, `seo_description`, `seo_keywords`

**Relationships:** `tenant()`, `shop()`, `template()`, `type()`, `category()` (BelongsTo), `variants()` (HasMany), `images()` (MorphMany), `supplierCatalogItem()` (HasOne)

### 7.2 ProductVariant Model

**File:** `app/Models/ProductVariant.php`
**Traits:** `HasFactory`, `SoftDeletes`

**Fields:** `product_id`, `sku` (unique), `barcode` (unique, nullable), `name`, `attributes` (array), `price`, `cost_price`, `reorder_level`, `base_unit_name`, `image_url`, `images` (array), `batch_number`, `expiry_date`, `serial_number`, `is_active`, `is_available_online`, `max_order_quantity`

**Appended attributes:** `available_stock`, `total_stock`

**Methods:**

```php
getTotalStockAttribute(): int        // Sums quantity across all inventory locations
getAvailableStockAttribute(): int    // Sums (quantity - reserved_quantity)
updateWeightedAverageCost(newQuantity, newCostPerUnit): void  // Pessimistic locking in transaction
```

### 7.3 InventoryLocation Model

**File:** `app/Models/InventoryLocation.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Fields:** `tenant_id`, `shop_id`, `product_variant_id`, `location_type` (polymorphic), `location_id` (polymorphic), `quantity`, `reserved_quantity`

**Boot validation:** reserved_quantity <= quantity on save

### 7.4 StockMovement Model

**File:** `app/Models/StockMovement.php`
**Traits:** `BelongsToTenant`, `SoftDeletes`

**Fields:** `tenant_id`, `shop_id`, `product_variant_id`, `product_packaging_type_id`, `from_location_id`, `to_location_id`, `purchase_order_id`, `type` (StockMovementType), `quantity`, `package_quantity`, `cost_per_package`, `cost_per_base_unit`, `quantity_before`, `quantity_after`, `reference_number`, `reason`, `notes`, `created_by`

### 7.5 StockMovementType Enum

**Cases:** PURCHASE, SALE, ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER_IN, TRANSFER_OUT, RETURN, DAMAGE, LOSS, STOCK_TAKE, PURCHASE_ORDER_SHIPPED, PURCHASE_ORDER_RECEIVED, PURCHASE_ORDER_RESERVED, PURCHASE_ORDER_RESERVATION_RELEASED

**Methods:** `isIncrease()`, `isDecrease()`, `requiresLocation()`, `adjustmentTypes()`, `transferTypes()`

### 7.6 StockMovementService

**File:** `app/Services/StockMovementService.php`

All methods use **pessimistic locking** (`lockForUpdate`) within DB transactions.

```php
adjustStock(variant, location, quantity, type, user, reason, notes): StockMovement
transferStock(variant, fromLocation, toLocation, quantity, user, reason, notes): array  // ['out', 'in'] paired movements
recordPurchase(variant, location, packageQuantity, packagingType, costPerPackage, user, notes): StockMovement  // Updates weighted average cost
recordSale(variant, location, quantity, packagingType, user, referenceNumber, notes, releaseReservation): StockMovement
stockTake(variant, location, actualQuantity, user, notes): ?StockMovement
checkStockAvailability(variant, quantity, shopId): bool
getAvailableStock(variant, shopId): int
```

### 7.7 ProductPackagingType Model

**File:** `app/Models/ProductPackagingType.php`

**Fields:** `tenant_id`, `product_variant_id`, `name`, `display_name`, `units_per_package`, `is_sealed_package`, `price`, `cost_price`, `is_base_unit`, `can_break_down`, `breaks_into_packaging_type_id`, `min_order_quantity`, `display_order`, `is_active`

Supports packaging hierarchy chains (carton → pack → unit) with bulk discount calculation.

### 7.8 InventoryModel Enum

**Cases:** SIMPLE_RETAIL (individual items), WHOLESALE_ONLY (sealed packages), HYBRID (retail + wholesale with package breaking)

### 7.9 Supporting Services

- **ReorderAlertService:** `getLowStockVariants()`, `getCriticalStockVariants()`, `getAlertSummary()` (cached 15 min), `getSuggestedPurchaseOrders()` (grouped by supplier)
- **BarcodeGeneratorService:** EAN-13 format `2TTTTPPPPPPPC`, pessimistic locking, batch generation, Code-128 fallback
- **PackagingBreakdownService:** `breakdownPackage()`, multi-level breakdown chains

---

## 8. Product & Service Management

### 8.1 ProductService

**File:** `app/Services/ProductService.php`

```php
create(data, tenant, shop): Product  // Resolves ProductType, creates variants + packaging
update(product, data): Product
updateVariant(variant, data): ProductVariant  // Propagates price changes to packaging types proportionally
```

### 8.2 Service Model

**File:** `app/Models/Service.php`

**Fields:** `tenant_id`, `shop_id`, `service_category_id`, `name`, `slug`, `description`, `image_url`, `has_material_options` (bool), `is_active`, `is_available_online`

### 8.3 ServiceVariant Model

**File:** `app/Models/ServiceVariant.php`

**Fields:** `service_id`, `name`, `description`, `customer_materials_price`, `shop_materials_price`, `base_price`, `estimated_duration_minutes`, `sort_order`, `is_active`

```php
getPriceForMaterialOption(MaterialOption $option): float
calculateTotalPrice(materialOption, selectedAddons): float
```

### 8.4 ServiceAddon Model

**File:** `app/Models/ServiceAddon.php`

**Fields:** `service_id` (nullable), `service_category_id` (nullable), `name`, `description`, `price`, `allows_quantity`, `max_quantity`, `sort_order`, `is_active`

Can be service-specific (service_id set) or category-wide (service_category_id set).

### 8.5 ProductType & ProductTemplate Models

**ProductType:** System-managed via seeding, controls `supports_variants`, `requires_batch_tracking`, `requires_serial_tracking`, has `config_schema` (JSON Schema for custom attributes).

**ProductTemplate:** Reusable product structures with `template_structure` (validated by TemplateStructureCast), variant configs, SKU patterns. Can be system-level or tenant-specific.

### 8.6 Image Model

**File:** `app/Models/Image.php`

Polymorphic (`imageable`) image storage with path, disk, dimensions, alt_text, sort_order, is_primary flag. Files deleted from disk on model deletion.

---

## 9. Order System

### 9.1 Order Model

**File:** `app/Models/Order.php`
**Traits:** `BelongsToTenant`, `HasFactory`, `SoftDeletes`

**Key Fields:** `tenant_id`, `shop_id`, `customer_id`, `order_number` (unique), `offline_id`, `order_type` (OrderType), `status` (OrderStatus), `payment_status` (PaymentStatus), `payment_method` (PaymentMethod), `payment_reference`, `subtotal`, `tax_amount`, `discount_amount`, `shipping_cost`, `total_amount`, `paid_amount`, `customer_notes`, `internal_notes`, `cancellation_reason`, shipping/billing addresses, tracking info, timestamps for each status transition, `created_by`/`packed_by`/`shipped_by`/`delivered_by`/`cancelled_by`/`refunded_by`

**Status State Machine:**

```
PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → DELIVERED → REFUNDED
    ↘        ↘          ↘          ↘      CANCELLED
```

### 9.2 OrderType Enum

| Case | Value | Customer-Facing | Description |
|---|---|---|---|
| `POS` | `pos` | Yes | POS sale |
| `CUSTOMER` | `customer` | Yes | Storefront order |
| `PURCHASE_ORDER` | `purchase_order` | No | Supplier order |
| `INTERNAL` | `internal` | No | Internal transfer |

### 9.3 OrderService

**File:** `app/Services/OrderService.php`

```php
createOrder(tenant, shop, items, createdBy, ?customer, ...): Order
updateOrder(order, data): Order           // Only if canEdit()
confirmOrder(order, user): Order          // Reserves inventory (lockForUpdate)
fulfillOrder(order, user): Order          // Decrements reserved, records SALE movements
cancelOrder(order, user, ?reason): Order  // Releases reservations if CONFIRMED
packOrder(order, user): Order
shipOrder(order, user, ?shippingData): Order
deliverOrder(order, user, ?notes): Order
```

### 9.4 OrderItem Model

**Fields:** `order_id`, `tenant_id`, `product_variant_id`, `product_packaging_type_id`, `sellable_type`/`sellable_id` (polymorphic — ProductVariant or ServiceVariant), `packaging_description`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `total_amount`, `metadata`

### 9.5 OrderPayment Model

**Fields:** `order_id`, `tenant_id`, `shop_id`, `amount`, `currency`, `gateway_fee`, `payment_method` (PaymentMethod), `gateway`, `gateway_reference`, `gateway_status`, `gateway_response` (array), `verified_at`, `payment_date`, `reference_number`, `notes`, `recorded_by`, refund fields

**Boot logic:** On created/deleted/restored → recalculates `order->paid_amount` and updates payment status.

### 9.6 Order Returns & Refunds

**OrderReturn** (`app/Models/OrderReturn.php`, table: `returns`): `tenant_id`, `order_id`, `customer_id`, `return_number`, `status` (OrderReturnStatus), `reason`, `notes`, `refund_amount`, `restocked`, `created_by`, `approved_by`, `rejected_by`, `completed_by`

**ReturnItem** (`app/Models/ReturnItem.php`): `return_id`, `order_item_id`, `quantity`, `reason`, `condition_notes`

**OrderReturnService:** `createReturn()`, `approveReturn()` (optionally restocks and processes refund), `rejectReturn()`, `completeReturn()`

**OrderRefundService:** `refundOrder()` (full refund via payment gateways), `partialRefund()` (item-level refund)

### 9.7 Receipt & HeldSale

**Receipt** (`app/Models/Receipt.php`): `receipt_number`, `type` ('order'|'payment'), `amount`, `pdf_path`
**ReceiptService:** PDF generation via DomPDF, email delivery

**HeldSale** (`app/Models/HeldSale.php`): `hold_reference`, `items` (JSON), `expires_at` (default +24h)
**HeldSaleService:** `holdSale()` (reserves stock), `retrieveHeldSale()`, `deleteHeldSale()` (releases stock), `cleanupExpiredHeldSales()`

---

## 10. POS System

### 10.1 POSService

**File:** `app/Services/POSService.php`

```php
searchProducts(Shop $shop, string $query, int $limit): Collection  // By SKU, barcode, or name
createQuickSale(Shop $shop, array $items, ?int $customerId, string $paymentMethod, float $amountTendered, array $options): Order
// Creates Order with status=DELIVERED, payment_status=PAID (immediate completion)
// Records stock movements, creates OrderPayment
// Handles offline_id, discount_amount, cash change calculation

searchCustomers(string $query, Shop $shop, int $limit): Collection
getSessionSummary(Shop $shop, ?string $startDate, ?string $endDate): array
// Returns: total_sales, total_revenue, total_tax, cash/card/mobile_money breakdowns
```

### 10.2 Offline Sync

Orders support `offline_id` field for IndexedDB-based offline POS. The `SyncController` (`app/Http/Controllers/Api/SyncController.php`) provides sync endpoints.

---

## 11. Storefront / E-Commerce

### 11.1 Cart System

**Cart** (`app/Models/Cart.php`): `tenant_id`, `shop_id`, `customer_id`, `session_id`, `expires_at`
**CartItem** (`app/Models/CartItem.php`): `cart_id`, `tenant_id`, `sellable_type`/`sellable_id` (polymorphic), `product_variant_id`, `product_packaging_type_id`, `quantity`, `price`, `material_option` (MaterialOption), `selected_addons` (array), `base_price`

**CartService** (`app/Services/CartService.php`):

```php
getCart(Shop, ?customerId): Cart              // 30-day expiry for customers, 7-day for guests
addItem(cart, variantId, quantity, ?packagingTypeId): CartItem
addServiceItem(cart, serviceVariantId, quantity, ?materialOption, addons): CartItem
updateQuantity(item, quantity): ?CartItem
removeItem(item): void
clearCart(cart): void
getCartSummary(cart): array                    // items, subtotal, shipping_fee, tax, total, item_count
mergeGuestCartIntoCustomerCart(sessionId, customerId, shopId): Cart
```

### 11.2 Checkout

**CheckoutService** (`app/Services/CheckoutService.php`):

```php
createOrderFromCart(cart, customer, shippingAddress, billingAddress, paymentMethod, ?customerNotes, ?paymentReference, ?idempotencyKey): Order
// Pessimistic locking on inventory, validates stock, creates order + items, records stock movements, deletes cart

verifyPaystackPayment(reference, shop): ?Order  // Direct Paystack API verification
updatePaymentStatus(paymentReference, status, ?transactionId): bool
```

### 11.3 Customer Authentication

**Customer Model** (`app/Models/Customer.php`): Separate from User model. Has own authentication guard (`customer`).

**Fields:** `tenant_id`, `preferred_shop_id`, `first_name`, `last_name`, `email`, `phone`, `password` (hashed), `is_active`, `marketing_opt_in`, `account_balance`, `credit_limit`, `total_purchases`, `last_purchase_at`

**CustomerAuthController:** Login, register, logout, email verification, password reset — all shop-scoped.

### 11.4 StorefrontService

```php
getFeaturedProducts(shop, limit=8): Collection
getProducts(shop, ?search, ?categoryId, sortBy, perPage): LengthAwarePaginator
getProductBySlug(shop, slug): ?Product
getRelatedProducts(product, limit=4): Collection
getCategories(shop): Collection
getServices(shop, ...): LengthAwarePaginator
getServiceCategories(shop): Collection
```

---

## 12. Payment System

### 12.1 PaymentGatewayInterface

**File:** `app/Services/Payment/PaymentGatewayInterface.php`

```php
getIdentifier(): string
getName(): string
isAvailable(): bool
getSupportedCurrencies(): array
supportsInlinePayment(): bool
supportsRefunds(): bool
supportsRecurring(): bool
initializePayment(Order $order, array $options): PaymentInitiationResult
verifyPayment(string $reference): PaymentVerificationResult
refund(OrderPayment $payment, ?float $amount, ?string $reason): RefundResult
validateWebhook(Request $request): bool
parseWebhook(Request $request): WebhookEvent
getCallbackUrl(Order $order): string
getWebhookUrl(): string
generateReference(Order $order): string
getMinimumAmount(string $currency): float
getMaximumAmount(string $currency): ?float
getPublicKey(): ?string
```

### 12.2 Gateway Implementations

| Gateway | Identifier | Currencies | Inline | Refunds | Webhook Validation |
|---|---|---|---|---|---|
| **PaystackGateway** | `paystack` | NGN, GHS, ZAR, USD | Yes | Yes | HMAC-SHA512 (x-paystack-signature) |
| **FlutterwaveGateway** | `flutterwave` | NGN, GHS, KES, ZAR, TZS, UGX, USD, EUR, GBP | Yes | Yes | verif-hash header |
| **OpayGateway** | `opay` | NGN | No | No | HMAC-SHA512 (Authorization header) |
| **CryptoGateway** | `crypto` | USD, EUR, NGN, GBP | No | No | HMAC-SHA512 (x-nowpayments-sig, sorted payload) |

### 12.3 Payment DTOs

**PaymentInitiationResult:** `success`, `reference`, `authorizationUrl`, `accessCode`, `inlineData`, `walletAddress`, `cryptoAmount`, `cryptoCurrency`, `qrCode`, `expiresAt`, `message`, `metadata`
- Factory methods: `redirect()`, `inline()`, `crypto()`, `failed()`

**PaymentVerificationResult:** `success`, `reference`, `status`, `amount`, `currency`, `gatewayReference`, `paymentMethod`, `channel`, `cardType`, `cardLast4`, `bank`, `customerEmail`, `gatewayFee`, `paidAt`, `message`, `rawResponse`

**RefundResult:** `success`, `reference`, `status`, `amount`, `currency`, `refundReference`, `message`, `rawResponse`

**WebhookEvent:** `type`, `reference`, `status`, `amount`, `currency`, `gatewayReference`, `paidAt`, `gatewayFee`, `metadata`, `rawPayload`

### 12.4 PaymentGatewayManager

**File:** `app/Services/Payment/PaymentGatewayManager.php`

```php
gateway(string $identifier): PaymentGatewayInterface  // Cached instance
getDefault(): PaymentGatewayInterface                  // From config('payment.default')
register(string $identifier, string $gatewayClass): void
getAvailable(): array                                  // Only configured/available
getSelectOptions(bool $onlyAvailable): array
```

---

## 13. Customer Credit System

### 13.1 CustomerCreditService

**File:** `app/Services/CustomerCreditService.php`

```php
chargeOrder(Customer $customer, Order $order): CustomerCreditTransaction
// Validates credit limit, creates 'charge' transaction, updates account_balance

recordPayment(Customer $customer, float $amount, string $paymentMethod, ?Shop, ?string $referenceNumber, ?string $notes): CustomerCreditTransaction
// Creates 'payment' transaction, applies to oldest unpaid orders first

getCreditSummary(Customer $customer): array
// Returns: account_balance, credit_limit, available_credit, total_purchases, unpaid_order_count, total_owed, unpaid_orders, recent_transactions
```

### 13.2 CustomerCreditTransaction Model

**Fields:** `customer_id`, `order_id`, `tenant_id`, `shop_id`, `type` ('charge'|'payment'), `amount`, `balance_before`, `balance_after`, `description`, `notes`, `reference_number`, `recorded_by`

---

## 14. Supplier System

### 14.1 SupplierProfile Model

**File:** `app/Models/SupplierProfile.php`

**Fields:** `tenant_id` (unique), `is_enabled`, `business_registration`, `tax_id`, `payment_terms`, `lead_time_days`, `minimum_order_value`, `connection_approval_mode` (ConnectionApprovalMode), `settings` (array)

### 14.2 SupplierConnection Model

**Fields:** `supplier_tenant_id`, `buyer_tenant_id`, `status` (ConnectionStatus), `credit_limit`, `payment_terms_override`, `buyer_notes`, `supplier_notes`, `requested_at`, `approved_at`, `approved_by`

**ConnectionStatus:** PENDING, APPROVED, ACTIVE, SUSPENDED, REJECTED
**ConnectionApprovalMode:** AUTO, OWNER, GENERAL_MANAGER, ASSISTANT_MANAGER

### 14.3 Catalog System

**SupplierCatalogItem:** `supplier_tenant_id`, `product_id`, `is_available`, `base_wholesale_price`, `min_order_quantity`, `visibility` (CatalogVisibility: PUBLIC, PRIVATE, CONNECTIONS_ONLY), `description`

**SupplierPricingTier:** `catalog_item_id`, `connection_id` (nullable — null = general, set = connection-specific), `min_quantity`, `max_quantity`, `price`

### 14.4 Purchase Order System

**PurchaseOrder Model:** `buyer_tenant_id`, `supplier_tenant_id`, `shop_id`, `po_number`, `status` (PurchaseOrderStatus), `subtotal`, `tax_amount`, `shipping_amount`, `discount_amount`, `total_amount`, `paid_amount`, `payment_status` (PurchaseOrderPaymentStatus), various date/user tracking fields

**PurchaseOrderStatus:** DRAFT → SUBMITTED → APPROVED → PROCESSING → SHIPPED → PARTIALLY_RECEIVED/RECEIVED → COMPLETED (or CANCELLED)

**PurchaseOrderItem:** `purchase_order_id`, `product_variant_id`, `catalog_item_id`, `quantity`, `unit_price`, `total_price`, `received_quantity`, `notes`

**PurchaseOrderPayment:** `purchase_order_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `notes`, `recorded_by`

### 14.5 PurchaseOrderService

```php
createPurchaseOrder(buyerTenant, shop, supplierTenant, data, user): PurchaseOrder
submitPurchaseOrder(po, user): PurchaseOrder       // Reserves supplier stock
approvePurchaseOrder(po, user): PurchaseOrder
shipPurchaseOrder(po, user): PurchaseOrder          // Decreases supplier stock
receivePurchaseOrder(po, user, data): PurchaseOrder // Increases buyer stock
cancelPurchaseOrder(po, ?reason): PurchaseOrder     // Releases stock reservations
recordPayment(po, data, user): PurchaseOrderPayment
```

**Stock reservation flow:**
1. **Submit:** Reserves supplier stock (increments `reserved_quantity`)
2. **Ship:** Decrements supplier's `quantity` and `reserved_quantity`, creates PURCHASE_ORDER_SHIPPED movements
3. **Receive:** Increments buyer's `quantity`, creates PURCHASE_ORDER_RECEIVED movements

---

## 15. Shop Management

### 15.1 Shop Model

**File:** `app/Models/Shop.php`

**Fields:** `tenant_id`, `shop_type_id`, `name`, `slug`, `config` (array), `inventory_model` (InventoryModel), `address`, `city`, `state`, `country`, `phone`, `email`, `is_active`, `storefront_enabled`, `storefront_settings` (array), `allow_retail_sales`, `shop_offering_type`, `currency`, `currency_symbol`, `currency_decimals`, `vat_enabled`, `vat_rate`, `vat_inclusive`

**Relationships:** `tenant()`, `type()` (BelongsTo), `users()` (BelongsToMany), `products()`, `services()`, `carts()` (HasMany), `taxSettings()` (HasOne)

### 15.2 ShopType Model

**Fields:** `tenant_id` (nullable), `label`, `slug`, `description`, `config_schema` (array), `is_active`

System-managed with tenant override capability. Has shop-type-specific config handlers:

| Handler | Config Fields |
|---|---|
| GenericConfigHandler | notes |
| RetailConfigHandler | tax_rate, pos_hardware, returns_policy_days, loyalty_program |
| PharmacyConfigHandler | dea_number, rx_validation_endpoint, controlled_substance_tracking, insurance_claim_integration, audit_logging |
| RestaurantConfigHandler | table_count, kitchen_printer_ip, delivery_radius_miles, reservation_system, menu_sections, tip_percentage_default, allergen_tracking |

### 15.3 ShopCreationService

```php
create(array $data, Tenant $tenant, User $creator): Shop
// Enforces tenant limits, resolves shop type, merges config defaults, generates unique slug
```

---

## 16. Approval System

### 16.1 ApprovalChain Model

**Fields:** `tenant_id`, `name`, `entity_type`, `minimum_amount`, `maximum_amount`, `approval_steps` (JSON array), `is_active`, `priority`, `description`

### 16.2 ApprovalRequest Model

**Fields:** `tenant_id`, `approval_chain_id`, `approvable_type`/`approvable_id` (polymorphic), `requested_by`, `status` (ApprovalRequestStatus), `current_step`, `approval_history` (JSON), `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejection_reason`

### 16.3 ApprovalService

```php
createApprovalRequest(Model $approvable, Tenant, User, ?float $amount): ?ApprovalRequest
approve(ApprovalRequest, User $approver, ?string $notes): ApprovalRequest
reject(ApprovalRequest, User $rejector, string $reason): ApprovalRequest
cancel(ApprovalRequest, User): ApprovalRequest
canUserApprove(ApprovalRequest, User): bool
needsApproval(Model, Tenant, ?float): bool
```

---

## 17. Notification System

### 17.1 Notification Model

**Fields:** `tenant_id`, `shop_id`, `user_id`, `type` (NotificationType), `title`, `message`, `data` (array), `action_url`, `is_read`, `read_at`, `notifiable_type`/`notifiable_id` (polymorphic), `minimum_role_level`

**NotificationType cases (18):** PAYROLL_PROCESSED/APPROVED/PAID/CANCELLED, TIMESHEET_SUBMITTED/APPROVED/REJECTED/PAID, FUND_REQUEST_SUBMITTED/APPROVED/REJECTED/DISBURSED/CANCELLED, WAGE_ADVANCE_REQUESTED/APPROVED/REJECTED/DISBURSED/REPAYMENT_RECORDED/FULLY_REPAID

### 17.2 NotificationService

```php
createForUser(User, NotificationType, title, message, ...): Notification
createForRole(tenantId, NotificationType, title, message, minimumRoleLevel, ...): Notification
getForUser(User, limit=20, unreadOnly=false): Collection
getUnreadCount(User): int
markAsRead(Notification): void
markAllAsRead(User): void
```

Plus domain-specific helpers: `notifyPayrollProcessed()`, `notifyTimesheetSubmitted()`, `notifyWageAdvanceRequested()`, etc.

---

## 18. Dashboard & Reporting

### 18.1 DashboardService

**File:** `app/Services/DashboardService.php`

**Tabs:** Overview, Sales, Inventory, Suppliers, Financials

Each tab provides cached aggregated data:
- **Sales:** revenue, order counts, trends, top products, revenue by shop
- **Inventory:** stock summary, low stock alerts, movements, valuation
- **Suppliers:** PO summary, top suppliers, payment/status breakdowns
- **Financials:** P&L summary, accounts receivable/payable aging, cash flow trend, expense breakdown, profit by shop

### 18.2 ReportService

**File:** `app/Services/ReportService.php`

**Reports:** Sales (by order/product/customer/shop/day), Inventory, Stock Movements, Supplier Performance, Financial P&L/Cash Flow/Balance Sheet, Customer Analytics (segmented by value/risk/inactivity), Product Profitability

### 18.3 ExportService

**File:** `app/Services/ExportService.php`

**Formats:** CSV (streamed), Excel (Maatwebsite/Excel), PDF (DomPDF)

---

## 19. Configuration & Environment

### 19.1 Custom Config Files

| File | Purpose |
|---|---|
| `config/payment.php` | Payment gateway registry, default gateway (PAYMENT_GATEWAY env), route prefixes, verification settings, supported currencies |
| `config/images.php` | Image upload settings: disk, placeholder, mime types, max file size (5MB), dimension constraints, thumbnail sizes, optimization |
| `config/countries.php` | Country list with name/code pairs |
| `config/dompdf.php` | PDF generation settings |
| `config/excel.php` | Excel export settings (Maatwebsite) |

### 19.2 Key Environment Variables

```
PAYMENT_GATEWAY=paystack              # Default payment gateway
PAYMENT_VERIFY_ON_CALLBACK=true       # Auto-verify on callback
PAYMENT_LOG_WEBHOOKS=true             # Log webhook payloads
PAYMENT_RETRY_VERIFICATION=3         # Verification retry count
PAYMENT_VERIFICATION_TIMEOUT=30      # Timeout in seconds
PAYMENT_CURRENCY=NGN                  # Default currency

PAYSTACK_SECRET_KEY=                  # Paystack API secret
PAYSTACK_PUBLIC_KEY=                  # Paystack public key
PAYSTACK_WEBHOOK_SECRET=             # Paystack webhook secret

FLUTTERWAVE_SECRET_KEY=              # Flutterwave API secret
FLUTTERWAVE_PUBLIC_KEY=              # Flutterwave public key
FLUTTERWAVE_WEBHOOK_SECRET=          # Flutterwave webhook hash

OPAY_SECRET_KEY=                     # OPay API secret
OPAY_PUBLIC_KEY=                     # OPay public key
OPAY_MERCHANT_ID=                    # OPay merchant ID

CRYPTO_API_KEY=                      # NOWPayments API key
CRYPTO_IPN_SECRET=                   # NOWPayments IPN secret

IMAGE_DISK=public                     # Image storage disk
IMAGE_MAX_FILE_SIZE=5120             # Max image KB
```

---

## 20. Events, Jobs, Listeners, Mail

### 20.1 Mail Classes

| Class | Path | Purpose |
|---|---|---|
| `OrderConfirmation` | `app/Mail/Customer/OrderConfirmation.php` | Customer order confirmation email |
| `OrderStatusUpdated` | `app/Mail/Customer/OrderStatusUpdated.php` | Order status change notification |

### 20.2 Console Commands

| Command | Signature | Purpose |
|---|---|---|
| `CleanupExpiredCarts` | `carts:cleanup {--days=30} {--dry-run}` | Deletes expired/old guest carts and empty carts |

### 20.3 Exceptions

| Exception | Purpose |
|---|---|
| `InvalidPaymentGatewayException` | Payment gateway errors |
| `TenantLimitExceededException` | Tenant limit exceeded (HTTP 422) |

---

## 21. Helpers & Utilities

### 21.1 CurrencyHelper

**File:** `app/Helpers/CurrencyHelper.php`

Static utility supporting NGN, USD, EUR, GBP, GHS, KES, ZAR:

```php
format(amount, Shop, includeSymbol=true): string
parse(formattedAmount): float
toSmallestUnit(amount, Shop): int
fromSmallestUnit(int, Shop): float
calculateTax(amount, Shop): float        // VAT based on vat_inclusive flag
getAmountExcludingTax(amount, Shop): float
getAmountIncludingTax(amount, Shop): float
```

### 21.2 TemplateStructureCast

**File:** `app/Casts/TemplateStructureCast.php`

Custom Eloquent cast that validates ProductTemplate `template_structure` JSON: must contain 'variants' array, each variant must have 'name', optional fields (sku_suffix, attributes, packaging_types) must be arrays.

### 21.3 API Resources

| Resource | Path |
|---|---|
| `ShopResource` | `app/Http/Resources/ShopResource.php` |
| `SyncProductResource` | `app/Http/Resources/SyncProductResource.php` |

---

## 22. Database Schema — Complete Table Inventory

### Core Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `tenants` | id, name, slug (unique), owner_email, subscription_plan, trial_ends_at, max_shops/users/products | owner_id → users |
| `users` | id, tenant_id, first_name, last_name, email (unique), role, is_tenant_owner, is_super_admin, is_active, onboarding_status | tenant_id → tenants |
| `customers` | id, tenant_id, preferred_shop_id, first_name, last_name, email, password, account_balance, credit_limit, total_purchases | tenant_id → tenants, preferred_shop_id → shops |

### Shop Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `shop_types` | id, tenant_id, slug (unique), label, config_schema | tenant_id → tenants |
| `shops` | id, tenant_id, shop_type_id, name, slug, config, inventory_model, storefront_enabled, storefront_settings, currency, vat_enabled/rate/inclusive | tenant_id → tenants, shop_type_id → shop_types |
| `shop_user` | id, tenant_id, user_id, shop_id | All three FKs cascade |
| `shop_tax_settings` | id, shop_id (unique), tenant_id, tax_jurisdiction_id, enable_tax_calculations, default_tax_handling, overtime settings, pension/nhf/nhis defaults | shop_id → shops |

### Product Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `products` | id, shop_id, tenant_id, product_type_id, category_id, template_id, name, slug, has_variants, is_active, is_featured, track_stock, is_taxable, SEO fields | Multiple FKs |
| `product_variants` | id, product_id, sku (unique), barcode (unique), name, price, cost_price, reorder_level, is_available_online | product_id → products |
| `product_categories` | id, tenant_id, parent_id (self-ref), name, slug | tenant_id → tenants |
| `product_types` | id, tenant_id, slug, config_schema, supports_variants, batch/serial tracking | tenant_id → tenants |
| `product_templates` | id, tenant_id, product_type_id, category_id, template_structure, is_system | Multiple FKs |
| `product_packaging_types` | id, product_variant_id, name, units_per_package, price, cost_price, is_base_unit, can_break_down, breaks_into_packaging_type_id | product_variant_id → product_variants |

### Inventory Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `inventory_locations` | id, tenant_id, shop_id, product_variant_id, location_type/id (polymorphic), quantity, reserved_quantity | Multiple FKs |
| `stock_movements` | id, tenant_id, shop_id, product_variant_id, product_packaging_type_id, from/to_location_id, purchase_order_id, type, quantity, package_quantity, cost fields, quantity_before/after, reference_number | Multiple FKs |

### Order Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `orders` | id, tenant_id, shop_id, customer_id, order_number (unique), order_type, status, payment_status, payment_method, subtotal/tax/discount/shipping/total/paid, offline_id, tracking, timestamps per status | Multiple FKs |
| `order_items` | id, order_id, tenant_id, sellable_type/id (polymorphic), product_variant_id, product_packaging_type_id, quantity, unit_price, discount/tax/total_amount, metadata | Multiple FKs |
| `order_payments` | id, order_id, tenant_id, shop_id, amount, currency, gateway fields, payment_method, refund fields | Multiple FKs |
| `returns` | id, tenant_id, order_id, customer_id, return_number, status, reason, refund_amount, restocked | Multiple FKs |
| `return_items` | id, return_id, order_item_id, quantity, reason | return_id, order_item_id FKs |
| `receipts` | id, tenant_id, shop_id, order_id, order_payment_id, receipt_number, type, amount, pdf_path | Multiple FKs |
| `held_sales` | id, tenant_id, shop_id, hold_reference, customer_id, items (JSON), expires_at | Multiple FKs |

### Storefront Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `carts` | id, tenant_id, shop_id, customer_id, session_id, expires_at | Multiple FKs |
| `cart_items` | id, cart_id, tenant_id, sellable_type/id (polymorphic), product_variant_id, product_packaging_type_id, quantity, price, material_option, selected_addons, base_price | Multiple FKs |
| `customer_addresses` | id, tenant_id, customer_id, type, is_default, name/phone/address fields | customer_id → customers |
| `customer_credit_transactions` | id, customer_id, order_id, tenant_id, shop_id, type, amount, balance_before/after, description | Multiple FKs |

### Service Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `service_categories` | id, tenant_id, parent_id (self-ref), name, slug, icon, sort_order | tenant_id → tenants |
| `services` | id, tenant_id, shop_id, service_category_id, name, slug, has_material_options, is_available_online | Multiple FKs |
| `service_variants` | id, service_id, name, customer_materials_price, shop_materials_price, base_price, estimated_duration_minutes | service_id → services |
| `service_addons` | id, service_id, service_category_id, name, price, allows_quantity | service_id, service_category_id FKs |

### Supplier Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `supplier_profiles` | id, tenant_id (unique), is_enabled, business_registration, payment_terms, lead_time_days, minimum_order_value, connection_approval_mode | tenant_id → tenants |
| `supplier_connections` | id, supplier_tenant_id, buyer_tenant_id, status, credit_limit, payment_terms_override | Both tenant FKs |
| `supplier_catalog_items` | id, supplier_tenant_id, product_id, is_available, base_wholesale_price, min_order_quantity, visibility | supplier_tenant_id, product_id FKs |
| `supplier_pricing_tiers` | id, catalog_item_id, connection_id, min_quantity, max_quantity, price | catalog_item_id, connection_id FKs |
| `purchase_orders` | id, buyer_tenant_id, supplier_tenant_id, shop_id, po_number, status, payment_status, subtotal/tax/shipping/discount/total/paid, dates, user tracking | Multiple FKs |
| `purchase_order_items` | id, purchase_order_id, product_variant_id, catalog_item_id, quantity, unit_price, total_price, received_quantity | Multiple FKs |
| `purchase_order_payments` | id, purchase_order_id, amount, payment_date, payment_method, reference_number | purchase_order_id FK |

### Tax Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `tax_jurisdictions` | id, name, code (unique), country_code, state_province, effective_from/to | None |
| `tax_tables` | id, tenant_id, name, jurisdiction, effective_year, tax_law_reference, has_low_income_exemption, low_income_threshold, cra_applicable, is_system | tenant_id → tenants |
| `tax_bands` | id, tax_table_id, min_amount, max_amount, rate, cumulative_tax, band_order | tax_table_id → tax_tables |
| `tax_reliefs` | id, tax_table_id, code, name, relief_type, amount, rate, cap, is_automatic, requires_proof | tax_table_id → tax_tables |
| `tax_brackets` | id, tax_jurisdiction_id, income_from/to, tax_rate, bracket_order (legacy) | tax_jurisdiction_id → tax_jurisdictions |
| `corporate_tax_rates` | id, tax_jurisdiction_id, turnover_from/to, tax_rate, company_size_category | tax_jurisdiction_id → tax_jurisdictions |
| `employee_tax_settings` | id, tenant_id, user_id, tax_id_number, is_tax_exempt, active_reliefs (JSON), annual_rent_paid, rent_proof fields, rent_relief_percentage | tenant_id, user_id FKs |

### Payroll Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `employee_payroll_details` | id, user_id (unique), tenant_id, employment_type, pay_type, pay_amount, pay_frequency, tax_handling, pension/nhf/nhis config, bank details (encrypted), position, department | user_id, tenant_id FKs |
| `pay_calendars` | id, tenant_id, name, frequency, pay_day, cutoff_day, is_default | tenant_id → tenants |
| `payroll_periods` | id, tenant_id, shop_id, period_name, start/end/payment_date, status, totals, employee_count | Multiple FKs |
| `pay_runs` | id, tenant_id, payroll_period_id, pay_calendar_id, reference, status, totals, calculated/approved/completed by/at, metadata | Multiple FKs |
| `pay_run_items` | id, tenant_id, pay_run_id, user_id, payslip_id, status, salary/earnings/deductions/net breakdown (JSON), tax_calculation (JSON) | Multiple FKs |
| `payslips` | id, payroll_period_id, pay_run_id, user_id, tenant_id, shop_id, full earnings/deductions/tax breakdown, YTD fields, status | Multiple FKs |
| `payroll_audit_logs` | id, tenant_id, auditable_type/id (polymorphic), action, actor_id, old/new_values (JSON), metadata, ip_address | Multiple FKs |
| `earning_types` | id, tenant_id, code, name, category, calculation_type, defaults, is_taxable/pensionable/recurring/system | tenant_id → tenants |
| `employee_earnings` | id, tenant_id, user_id, earning_type_id, amount, rate, effective_from/to, custom_rules | Multiple FKs |
| `deduction_types` | id, tenant_id, code, name, category, calculation_type/base, defaults, max/cap, is_pre_tax/mandatory/system, priority | tenant_id → tenants |
| `employee_deductions` | id, tenant_id, user_id, deduction_type_id, amount, rate, total_target, total_deducted, effective_from/to | Multiple FKs |
| `employee_custom_deductions` | id, user_id, tenant_id, deduction_name, deduction_type, amount, percentage, effective_from/to | user_id, tenant_id FKs |
| `employee_templates` | id, tenant_id, name, role, employment_type, pay_type/amount/frequency, is_system, usage_count | tenant_id → tenants |
| `timesheets` | id, user_id, shop_id, tenant_id, date, clock_in/out, break_start/end, regular/overtime/total_hours, status | Multiple FKs |
| `wage_advances` | id, user_id, shop_id, tenant_id, amount_requested/approved, status, repayment config, amount_repaid | Multiple FKs |
| `wage_advance_repayments` | id, wage_advance_id, tenant_id, payroll_period_id, amount, repayment_date | Multiple FKs |
| `fund_requests` | id, user_id, shop_id, tenant_id, request_type, amount, status, approval/disbursement tracking | Multiple FKs |

### Other Tables

| Table | Key Columns | Foreign Keys |
|---|---|---|
| `images` | id, tenant_id, imageable_type/id (polymorphic), filename, path, disk, dimensions, is_primary | tenant_id → tenants |
| `notifications` | id, tenant_id, shop_id, user_id, type, title, message, data (JSON), is_read, notifiable_type/id (polymorphic), minimum_role_level | Multiple FKs |
| `approval_chains` | id, tenant_id, name, entity_type, min/max_amount, approval_steps (JSON), priority | tenant_id → tenants |
| `approval_requests` | id, tenant_id, approval_chain_id, approvable_type/id (polymorphic), status, current_step, approval_history (JSON) | Multiple FKs |
| `personal_access_tokens` | Standard Laravel Sanctum table | |
| `cache` / `cache_locks` | Standard Laravel cache tables | |
| `jobs` / `job_batches` / `failed_jobs` | Standard Laravel queue tables | |

---

## 23. Complete Service Inventory

| Service | File | Key Responsibilities |
|---|---|---|
| `TenantService` | app/Services/TenantService.php | Tenant + owner creation |
| `ShopCreationService` | app/Services/ShopCreationService.php | Shop creation with type config |
| `StaffManagementService` | app/Services/StaffManagementService.php | Staff CRUD, shop assignment |
| `StaffOnboardingService` | app/Services/StaffOnboardingService.php | Full onboarding with payroll |
| `ProductService` | app/Services/ProductService.php | Product + variant CRUD |
| `CategoryService` | app/Services/CategoryService.php | Category tree management |
| `ServiceManagementService` | app/Services/ServiceManagementService.php | Service + variant + addon CRUD |
| `ProductTemplateService` | app/Services/ProductTemplateService.php | Template management |
| `StockMovementService` | app/Services/StockMovementService.php | All stock changes (audit trail) |
| `ReorderAlertService` | app/Services/ReorderAlertService.php | Low stock detection |
| `BarcodeGeneratorService` | app/Services/BarcodeGeneratorService.php | EAN-13/Code-128 generation |
| `PackagingBreakdownService` | app/Services/PackagingBreakdownService.php | Package breakdown chains |
| `ImageService` | app/Services/ImageService.php | Image upload/delete/reorder |
| `OrderService` | app/Services/OrderService.php | Order lifecycle management |
| `OrderReturnService` | app/Services/OrderReturnService.php | Return processing |
| `OrderRefundService` | app/Services/OrderRefundService.php | Full/partial refunds |
| `ReceiptService` | app/Services/ReceiptService.php | PDF receipt generation |
| `HeldSaleService` | app/Services/HeldSaleService.php | POS held sales with stock reservation |
| `POSService` | app/Services/POSService.php | POS quick sales |
| `CartService` | app/Services/CartService.php | Cart management + guest merge |
| `CheckoutService` | app/Services/CheckoutService.php | Checkout + Paystack verification |
| `StorefrontService` | app/Services/StorefrontService.php | Product/service browsing |
| `CustomerService` | app/Services/CustomerService.php | Customer CRUD |
| `CustomerCreditService` | app/Services/CustomerCreditService.php | Credit charges + payments |
| `SupplierService` | app/Services/SupplierService.php | Supplier mode + catalog |
| `SupplierConnectionService` | app/Services/SupplierConnectionService.php | B2B connection workflow |
| `PurchaseOrderService` | app/Services/PurchaseOrderService.php | PO lifecycle + stock |
| `PayRunService` | app/Services/PayRunService.php | Pay run processing pipeline |
| `PayrollService` | app/Services/PayrollService.php | DEPRECATED — use PayRunService |
| `EarningsService` | app/Services/EarningsService.php | Employee earnings calculation |
| `DeductionsService` | app/Services/DeductionsService.php | Employee deductions calculation |
| `EmployeePayrollService` | app/Services/EmployeePayrollService.php | Payroll detail management |
| `TaxCalculationService` | app/Services/TaxCalculationService.php | PAYE tax calculation |
| `TaxService` | app/Services/TaxService.php | Legacy tax (mostly deprecated) |
| `PayslipPdfService` | app/Services/PayslipPdfService.php | Payslip PDF generation |
| `PayrollAuditService` | app/Services/PayrollAuditService.php | Payroll audit logging |
| `PayrollReportService` | app/Services/PayrollReportService.php | Payroll reports |
| `PayrollExportService` | app/Services/PayrollExportService.php | Payroll CSV export |
| `NibssExportService` | app/Services/NibssExportService.php | NIBSS bank schedule files |
| `WageAdvanceService` | app/Services/WageAdvanceService.php | Wage advance lifecycle |
| `WageAdvanceRepaymentService` | app/Services/WageAdvanceRepaymentService.php | Repayment recording |
| `FundRequestService` | app/Services/FundRequestService.php | Fund request lifecycle |
| `TimesheetService` | app/Services/TimesheetService.php | Clock in/out + approval |
| `EmployeeTemplateService` | app/Services/EmployeeTemplateService.php | Employee templates |
| `ApprovalService` | app/Services/ApprovalService.php | Multi-step approval chains |
| `NotificationService` | app/Services/NotificationService.php | Notification CRUD + domain helpers |
| `DashboardService` | app/Services/DashboardService.php | Dashboard metrics aggregation |
| `ReportService` | app/Services/ReportService.php | All report types |
| `ExportService` | app/Services/ExportService.php | CSV/Excel/PDF export |
| `PaymentGatewayManager` | app/Services/Payment/PaymentGatewayManager.php | Gateway registry + resolution |
| `BasePaymentGateway` | app/Services/Payment/BasePaymentGateway.php | Shared gateway logic |
| `PaystackGateway` | app/Services/Payment/Gateways/PaystackGateway.php | Paystack integration |
| `FlutterwaveGateway` | app/Services/Payment/Gateways/FlutterwaveGateway.php | Flutterwave integration |
| `OpayGateway` | app/Services/Payment/Gateways/OpayGateway.php | OPay integration |
| `CryptoGateway` | app/Services/Payment/Gateways/CryptoGateway.php | NOWPayments integration |
| `ProductConfigHandlerFactory` | app/Services/ProductConfigHandlerFactory.php | Product type config handler |
| `ShopConfigHandlerFactory` | app/Services/ShopConfigHandlerFactory.php | Shop type config handler |
| `SchemaBasedConfigHandler` | app/Services/SchemaBasedConfigHandler.php | JSON Schema validation |

---

## 24. Complete Enum Inventory

| Enum | File | Cases |
|---|---|---|
| `UserRole` | app/Enums/UserRole.php | SUPER_ADMIN, OWNER, GENERAL_MANAGER, STORE_MANAGER, ASSISTANT_MANAGER, SALES_REP, CASHIER, INVENTORY_CLERK |
| `OnboardingStatus` | app/Enums/OnboardingStatus.php | PENDING, IN_PROGRESS, COMPLETED |
| `OrderStatus` | app/Enums/OrderStatus.php | PENDING, CONFIRMED, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED, REFUNDED |
| `OrderType` | app/Enums/OrderType.php | POS, CUSTOMER, PURCHASE_ORDER, INTERNAL |
| `OrderReturnStatus` | app/Enums/OrderReturnStatus.php | PENDING, APPROVED, REJECTED, COMPLETED |
| `PaymentStatus` | app/Enums/PaymentStatus.php | UNPAID, PARTIAL, PAID, REFUNDED, FAILED |
| `PaymentMethod` | app/Enums/PaymentMethod.php | CASH, CARD, MOBILE_MONEY, BANK_TRANSFER, CHEQUE, CUSTOMER_CREDIT, PAYSTACK, CASH_ON_DELIVERY |
| `StockMovementType` | app/Enums/StockMovementType.php | PURCHASE, SALE, ADJUSTMENT_IN/OUT, TRANSFER_IN/OUT, RETURN, DAMAGE, LOSS, STOCK_TAKE, PO_SHIPPED/RECEIVED/RESERVED/RELEASED |
| `InventoryModel` | app/Enums/InventoryModel.php | SIMPLE_RETAIL, WHOLESALE_ONLY, HYBRID |
| `MaterialOption` | app/Enums/MaterialOption.php | CUSTOMER_MATERIALS, SHOP_MATERIALS, NONE |
| `PayRunStatus` | app/Enums/PayRunStatus.php | DRAFT, CALCULATING, PENDING_REVIEW, PENDING_APPROVAL, APPROVED, PROCESSING, COMPLETED, CANCELLED |
| `PayRunItemStatus` | app/Enums/PayRunItemStatus.php | PENDING, CALCULATED, ERROR, EXCLUDED |
| `PayrollStatus` | app/Enums/PayrollStatus.php | DRAFT, PROCESSING, PROCESSED, APPROVED, PAID, CANCELLED |
| `PayFrequency` | app/Enums/PayFrequency.php | DAILY, WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| `PayType` | app/Enums/PayType.php | SALARY, HOURLY, DAILY, COMMISSION_BASED |
| `EmploymentType` | app/Enums/EmploymentType.php | FULL_TIME, PART_TIME, CONTRACT, SEASONAL, INTERN |
| `TimesheetStatus` | app/Enums/TimesheetStatus.php | DRAFT, SUBMITTED, APPROVED, REJECTED, PAID |
| `WageAdvanceStatus` | app/Enums/WageAdvanceStatus.php | PENDING, APPROVED, REJECTED, DISBURSED, REPAYING, REPAID, CANCELLED |
| `FundRequestStatus` | app/Enums/FundRequestStatus.php | PENDING, APPROVED, REJECTED, DISBURSED, CANCELLED |
| `FundRequestType` | app/Enums/FundRequestType.php | REPAIRS, FUEL, SUPPLIES, INVENTORY, UTILITIES, MAINTENANCE, EQUIPMENT, TRANSPORTATION, OTHER |
| `EarningCalculationType` | app/Enums/EarningCalculationType.php | FIXED, PERCENTAGE, HOURLY, FORMULA |
| `EarningCategory` | app/Enums/EarningCategory.php | BASE, ALLOWANCE, BONUS, COMMISSION, OVERTIME, OTHER |
| `DeductionCalculationType` | app/Enums/DeductionCalculationType.php | FIXED, PERCENTAGE, TIERED, FORMULA |
| `DeductionCalculationBase` | app/Enums/DeductionCalculationBase.php | GROSS, BASIC, TAXABLE, PENSIONABLE, NET |
| `DeductionCategory` | app/Enums/DeductionCategory.php | STATUTORY, VOLUNTARY, LOAN, ADVANCE, OTHER |
| `DeductionType` | app/Enums/DeductionType.php | FIXED_AMOUNT, PERCENTAGE, LOAN_REPAYMENT, ADVANCE_REPAYMENT, INSURANCE, UNION_DUES, SAVINGS, OTHER |
| `TaxHandling` | app/Enums/TaxHandling.php | SHOP_CALCULATES, EMPLOYEE_CALCULATES, EXEMPT |
| `TaxLawVersion` | app/Enums/TaxLawVersion.php | PITA_2011, NTA_2025 |
| `TaxReliefType` | app/Enums/TaxReliefType.php | FIXED, PERCENTAGE, CAPPED_PERCENTAGE, CRA, RENT_RELIEF, LOW_INCOME_EXEMPTION |
| `ConnectionStatus` | app/Enums/ConnectionStatus.php | PENDING, APPROVED, ACTIVE, SUSPENDED, REJECTED |
| `ConnectionApprovalMode` | app/Enums/ConnectionApprovalMode.php | AUTO, OWNER, GENERAL_MANAGER, ASSISTANT_MANAGER |
| `CatalogVisibility` | app/Enums/CatalogVisibility.php | PUBLIC, PRIVATE, CONNECTIONS_ONLY |
| `PurchaseOrderStatus` | app/Enums/PurchaseOrderStatus.php | DRAFT, SUBMITTED, APPROVED, PROCESSING, SHIPPED, PARTIALLY_RECEIVED, RECEIVED, COMPLETED, CANCELLED |
| `PurchaseOrderPaymentStatus` | app/Enums/PurchaseOrderPaymentStatus.php | PENDING, PARTIAL, PAID, OVERDUE, CANCELLED |
| `ApprovalRequestStatus` | app/Enums/ApprovalRequestStatus.php | PENDING, APPROVED, REJECTED |
| `CompanySizeCategory` | app/Enums/CompanySizeCategory.php | SMALL, MEDIUM, LARGE |
| `NotificationType` | app/Enums/NotificationType.php | 18 cases across PAYROLL, TIMESHEET, FUND_REQUEST, WAGE_ADVANCE domains |

---

## 25. Cross-Cutting Architectural Patterns

### Tenant Isolation
- Every model using `BelongsToTenant` has automatic query filtering via `TenantScope`
- `tenant_id` auto-assigned on model creation from authenticated user
- Super admins bypass tenant scope (no tenant_id on their queries)

### Pessimistic Locking
- `lockForUpdate()` used throughout StockMovementService, HeldSaleService, OrderService, PurchaseOrderService, BarcodeGeneratorService
- Prevents race conditions on concurrent stock updates, reference number generation

### State Machines
- All lifecycle models use enum-based state machines with `canTransitionTo()` methods
- Status transitions validated in service layer before database updates

### Caching Strategy
- Tag-based caching: `tenant:{id}:resource:list`, `tenant:{id}:resource:{id}`
- Explicit invalidation on mutations
- TTLs vary: 5 min (dashboard), 15 min (alerts), 30 min (storefront products), 60 min (categories, supplier reports)

### Service Layer Architecture
- Controllers are thin: validate → authorize → delegate to service → redirect
- Services contain all business logic, DB transactions, cache management
- Form Requests always return `true` in `authorize()` — authorization done via `Gate::authorize()` in controllers

### Polymorphic Relations
- Images: `imageable_type`/`imageable_id`
- Cart/Order items: `sellable_type`/`sellable_id` (ProductVariant or ServiceVariant)
- Inventory locations: `location_type`/`location_id`
- Approval requests: `approvable_type`/`approvable_id`
- Notifications: `notifiable_type`/`notifiable_id`
- Audit logs: `auditable_type`/`auditable_id`

### Dual-Tenant Relationships
- SupplierConnection bridges `supplier_tenant_id` ↔ `buyer_tenant_id`
- PurchaseOrder has both `buyer_tenant_id` and `supplier_tenant_id`
- Stock movements flow across tenants during PO shipment/receipt
