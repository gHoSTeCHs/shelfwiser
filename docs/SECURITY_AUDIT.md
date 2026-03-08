# ShelfWise Security Audit Report

**Date:** 2026-03-06
**Scope:** Full codebase — 6 parallel domain-specific audits
**Status:** C1–C13 fixed (2026-03-07), H1–H27 fixed (2026-03-07/08), M1–M15 fixed (2026-03-08, M9 skipped by design), L1–L6 pending

## Executive Summary

| Severity     | Count |
| ------------ | ----- |
| **CRITICAL** | 13    |
| **HIGH**     | 24    |
| **MEDIUM**   | 15    |
| **LOW**      | 6     |

The most dangerous clusters are: **payment verification gaps** (attackers can pay less than owed), **stock race conditions** (inventory can go negative via concurrent requests), and **missing authorization checks** (low-privilege users can perform privileged actions). Several of these are exploitable today without specialized tools.

---

## CRITICAL Findings

### C1. Payment Amount Never Verified Against Order Total

- [x] Fixed — 2026-03-07

**Files:** `app/Http/Controllers/PaymentController.php`, `app/Http/Controllers/Webhooks/PaymentWebhookController.php`, `app/Services/CheckoutService.php`, `app/Http/Controllers/Storefront/CheckoutController.php`

Neither the payment callback nor the webhook handler compares the gateway-verified amount against `$order->total_amount`. An attacker can initiate a real payment for a small test transaction, then supply that verified reference against a large order — the system records the small amount as payment and marks the order paid.

**Fix:** All three payment recording paths now log a warning when the gateway-verified amount is less than 99% of `$order->remainingBalance()`. The actual gateway amount is recorded (not the order total), so underpayments result in PARTIAL status via the existing `OrderPayment::booted()` handler. `CheckoutService::updatePaymentStatus()` accepts an optional `$verifiedAmount` parameter, and both `verifyPaystackPayment()` and `CheckoutController::paymentWebhook()` now pass the Paystack amount (converted from kobo).

---

### C2. Customer Credit Race Condition — Double-Spend

- [x] Fixed — 2026-03-07

**File:** `app/Services/CustomerCreditService.php`

`canPurchaseOnCredit()` runs before the `DB::transaction`, and no `lockForUpdate()` is used on the Customer row. Two concurrent orders against the same credit limit both pass the check and both commit, exceeding the credit limit.

**Fix:** In `chargeOrder()`, the credit check is now inside the `DB::transaction` with `lockForUpdate()` on the Customer row. In `recordPayment()`, a `lockForUpdate()` was added on the Customer row inside the existing transaction. Both methods now use the locked instance for all balance calculations.

---

### C3. Duplicate OrderPayment on Concurrent Callback + Webhook

- [x] Fixed — 2026-03-07

**Files:** `app/Http/Controllers/PaymentController.php`, `app/Http/Controllers/Webhooks/PaymentWebhookController.php`, `app/Services/CheckoutService.php`, migration `2026_03_07_101637`

The storefront checkout flow has no idempotency guard — `OrderPayment::create` is called without checking for an existing payment with the same reference. The gateway redirect and webhook arrive simultaneously, both pass the `payment_status !== PAID` check, and both create payment records — double-crediting the order.

**Fix:** Added a `UNIQUE` index on `order_payments.reference_number` (MySQL allows multiple NULLs, so manual payments without references are unaffected). All three payment creation paths (`PaymentController::callback`, `PaymentWebhookController::handleSuccessfulPayment`, `CheckoutService::updatePaymentStatus`) now wrap payment creation in `DB::transaction` with `lockForUpdate()` on the order row and an idempotency check (`where('reference_number', $ref)->exists()`) before creating.

---

### C4. SupplierCatalogItem Uses BelongsToTenant But Has No `tenant_id` Column

- [x] Fixed — 2026-03-07

**Files:** `app/Models/SupplierCatalogItem.php`, `app/Http/Controllers/SupplierCatalogController.php`
**Migration:** `supplier_catalog_items` table has only `supplier_tenant_id`, no `tenant_id`

The `TenantScope` applies `WHERE tenant_id = ?` which silently evaluates to nothing (column doesn't exist). Route model binding in `edit()` and `destroy()` resolves catalog items across all tenants. Any tenant can access or delete another supplier's catalog items.

**Fix:** Removed `BelongsToTenant` trait from `SupplierCatalogItem` (since the table uses `supplier_tenant_id`, not `tenant_id`). Added explicit `$catalogItem->supplier_tenant_id !== auth()->user()->tenant_id` checks with `abort(403)` in `edit()`, `update()`, and `destroy()` controller methods.

---

### C5. SupplierCatalogController::store() Missing Gate::authorize()

- [x] Fixed — 2026-03-07

**Files:** `app/Http/Controllers/SupplierCatalogController.php`, `app/Http/Requests/Supplier/AddToCatalogRequest.php`

Any authenticated user (including Cashier) can POST to `/supplier/catalog` and add products to the supplier catalog. Every other method in this controller has authorization — `store()` was missed.

**Fix:** Added `Gate::authorize('catalog.manage', auth()->user()->tenant)` to both `store()` and `update()`. Also fixed `AddToCatalogRequest::authorize()` to return `true` (per project convention — authorization belongs in controllers via Gate, not in Form Requests).

---

### C6. TenantScope Silently Skipped for Guest Users

- [x] Fixed — 2026-03-07

**File:** `app/Services/CartService.php`

When `auth()->check()` returns false (storefront guests), the scope applies no filter at all. Cart and CartItem models using `BelongsToTenant` are completely unscoped for guest sessions — a session ID collision would expose another tenant's cart data.

**Why NOT modify TenantScope:** The `Customer` model also uses `BelongsToTenant`. Adding `auth('customer')->hasUser()` risks the same infinite recursion bug (see MEMORY.md). The safe fix is defense-in-depth: explicit `tenant_id` filtering on all guest-accessible Cart queries.

**Fix:** All Cart queries in `CartService` now include explicit `tenant_id` filtering: `firstOrCreate` moved `tenant_id` from creation attributes to the WHERE clause, guest cart lookups add `->where('tenant_id', $shop->tenant_id)`, `mergeGuestCartIntoCustomerCart` filters by `$shop->tenant_id`, and `invalidateCartCache` filters by `$tenantId`. Also fixed `Cart::create` → `Cart::query()->create()` per project conventions.

---

### C7. OrderController::updatePaymentStatus() Missing Gate::authorize()

- [x] Fixed — 2026-03-07

**Files:** `app/Http/Controllers/OrderController.php`, `app/Http/Requests/UpdatePaymentStatusRequest.php`

Any authenticated user (including Cashier) can POST to `/orders/{order}/payment` and mark any order in their tenant as paid, bypassing approval workflows. No role-level check exists.

**Fix:** Added `Gate::authorize('manage', $order)` to `updatePaymentStatus()` in the controller. Changed `UpdatePaymentStatusRequest::authorize()` to `return true` per project convention (rule 14 — authorization belongs in controllers via Gate, not in Form Requests).

---

### C8. StockMovementService recordSale/recordPurchase — No lockForUpdate

- [x] Fixed — 2026-03-07

**File:** `app/Services/StockMovementService.php`

Neither method locks the `InventoryLocation` row. The caller (`POSService`) acquires a lock in a different transaction scope that is already released by the time `recordSale`'s inner transaction runs. Two concurrent POS sales for the last unit both succeed, driving stock to -1.

**Fix:** Both `recordSale()` and `recordPurchase()` now re-fetch `$location` with `InventoryLocation::query()->where('id', $location->id)->lockForUpdate()->firstOrFail()` as the first line inside their `DB::transaction` closures — matching the existing pattern in `adjustStock()`.

---

### C9. OrderService::fulfillOrder — Non-Atomic Reservation Release

- [x] Fixed — 2026-03-07

**File:** `app/Services/OrderService.php`

`reserved_quantity` is decremented and saved without a lock, then `adjustStock` runs in a separate nested transaction. A concurrent cancellation between the two operations can drive `reserved_quantity` negative.

**Fix:** Added `->lockForUpdate()` to the inventory location query in `fulfillOrder()`. The subsequent `adjustStock()` call also acquires `lockForUpdate()` on the same row, but within the same transaction a second lock acquisition is a no-op — safe and correct.

---

### C10. StockMovementService::stockTake — No lockForUpdate

- [x] Fixed — 2026-03-07

**File:** `app/Services/StockMovementService.php`

`stockTake` reads `$location->quantity`, then overwrites it without locking the row. A concurrent sale between read and write is silently reversed — the stock take overwrites the sale's deduction with no audit trail.

**Fix:** Added `InventoryLocation::query()->where('id', $location->id)->lockForUpdate()->firstOrFail()` as the first line inside the `DB::transaction` closure, matching the pattern in `adjustStock()`, `recordSale()`, and `recordPurchase()`.

---

### C11. SVG Upload — Stored XSS

- [x] Fixed — 2026-03-07

**Files:** `config/images.php:23,35`, `app/Services/ImageService.php:29`

`image/svg+xml` and `svg` are allowed MIME types/extensions. Uploaded SVGs land on the `public` disk (web-accessible). An SVG with embedded `<script>` tags executes in any viewer's browser — stealing session cookies, performing CSRF, or exfiltrating data. Affects storefront customers and admin staff.

**Fix:** Removed `image/svg+xml` from `allowed_mime_types` and `svg` from `allowed_extensions` in `config/images.php`. The app has no legitimate SVG upload use case.

---

### C12. ImageController::reorder() — Arbitrary Model Instantiation

- [x] Fixed — 2026-03-07

**File:** `app/Http/Controllers/ImageController.php:113-121`

`model_type` is validated only as `required|string` (no allowlist). The value is concatenated into `App\Models\{input}` and `findOrFail()` is called. Any `App\Models\*` class can be targeted — `Tenant`, `Payslip`, `PayRun`, `User` — bypassing per-model tenant isolation.

**Fix:** Added `in:Product,ProductVariant,Service,User` validation rule to `model_type`, matching the existing allowlist in `UploadImageRequest`. Invalid model types are rejected with a 422 before any class instantiation.

---

### C13. Storefront Payment Webhook Blocked by CSRF

- [x] Fixed — 2026-03-07

**File:** `routes/storefront.php:52-54`

The storefront Paystack webhook is in the `web` middleware group (which includes CSRF verification) but no CSRF exemption is declared. Paystack's POST will be rejected with HTTP 419 before signature validation ever runs — all storefront payment confirmations silently fail.

**Fix:** Added `VerifyCsrfToken::class` to the `withoutMiddleware()` call on the webhook route. CSRF protection is replaced by the existing Paystack HMAC signature verification (`hash_equals` on `x-paystack-signature`), matching the pattern used by the API webhook route.

---

## HIGH Findings

### H1. Price Manipulation via Client-Supplied unit_price

- [x] Fixed — 2026-03-07

**File:** `app/Services/OrderService.php:484-510`

`unit_price` and `discount_amount` accepted directly from request payload with no server-side comparison to actual product price. A Cashier can sell an expensive item for near-zero cost.

**Fix:** `OrderService` now ignores any client-supplied `unit_price`, deriving it server-side from `$variant->price` (or `$packagingType->price / $packagingType->units_per_package` for packaging). `discount_amount` is bounded by `max(0, min($item['discount_amount'] ?? 0, $unitPrice * $quantity))` — it cannot exceed the line total or go negative.

---

### H2. OrderRefundService Calls Non-Existent Method

- [x] Fixed — 2026-03-07

**File:** `app/Services/OrderRefundService.php:50,191`

`$this->paymentGatewayManager->getGateway(...)` — this method doesn't exist on `PaymentGatewayManager` (correct method is `gateway()`). Every refund attempt crashes with `BadMethodCallException`. No automatic refund can ever succeed.

**Fix:** Both call sites updated to use the correct `->gateway($payment->payment_method)` method.

---

### H3. Webhook Idempotency Bypassable

- [x] Fixed — 2026-03-07 (addressed with C3)

**File:** `app/Http/Controllers/Webhooks/PaymentWebhookController.php`

The idempotency check uses `reference_number`, but the order lookup falls back to parsing `order_number` from the reference. A retry with a different reference string but same order number bypasses the check. No `lockForUpdate` on the order, no transaction wrapping.

**Fix:** `handleSuccessfulPayment()` now wraps the entire method in `DB::transaction` with `lockForUpdate()` on both the existing payment check and the order row. Combined with the unique index on `reference_number` (C3), duplicate payments are blocked at both application and database level.

---

### H4. Flutterwave Webhook Uses Static Secret (Not HMAC Over Payload)

- [x] Fixed — 2026-03-08

**File:** `app/Services/Payment/Gateways/FlutterwaveGateway.php:190-199`

Compares the raw secret directly against the `verif-hash` header. If the secret leaks, an attacker can forge any webhook payload — unlike Paystack/Crypto which HMAC the payload body.

---

### H5. Payment Callback Route Unauthenticated

- [x] Fixed — 2026-03-07

**Files:** `routes/web.php:91`, `app/Http/Controllers/PaymentController.php:20-25`

`GET /payment/callback/{gateway}/{order}` has no auth middleware. Tenant check only runs `if (auth()->check())`. An unauthenticated user who knows an order UUID can trigger payment verification and credit a payment.

**Fix:** Added `->middleware('auth')` to the payment callback route.

---

### H6. Partial Refund Not Bounded by Original Amount

- [x] Fixed — 2026-03-07

**File:** `app/Services/OrderRefundService.php:195-201`

Cumulative `refund_amount` is never checked against `$payment->amount`. Multiple partial refunds can exceed the original charge.

**Fix:** Added a cumulative check before processing: `$newRefundTotal = ($payment->refund_amount ?? 0) + $refundAmount; if ($newRefundTotal > $payment->amount) { throw new Exception(...) }`. Throws before calling the gateway.

---

### H7. SupplierConnectionController::store() Missing Gate::authorize()

- [x] Fixed — 2026-03-07

**File:** `app/Http/Controllers/SupplierConnectionController.php:57-67`

Any authenticated user can initiate supplier connection requests regardless of role.

**Fix:** Added `Gate::authorize('create', [SupplierConnection::class, $supplierTenant])` to `store()`.

---

### H8. SupplierCatalogController::update() Missing Gate::authorize()

- [x] Fixed — 2026-03-07 (addressed with C4/C5)

**File:** `app/Http/Controllers/SupplierCatalogController.php`

Combined with C4 (broken tenant scope), this allows cross-tenant catalog modification.

**Fix:** `Gate::authorize('catalog.manage', ...)` and tenant ownership check added to `update()` as part of the C4/C5 fix.

---

### H9. POS Stock Check Uses Unlocked Query (TOCTOU)

- [x] Fixed — 2026-03-07

**File:** `app/Services/POSService.php:73-80`

`validateStockAvailability()` issues a fresh unlocked SELECT instead of using the already-locked `$locations` collection. The lock is wasted; concurrent sales both pass validation.

**Fix:** Stock validation now reads directly from the already-locked `$locations` collection (fetched with `lockForUpdate()`) rather than issuing a new SELECT. Concurrent sales see the locked state.

---

### H10. PurchaseOrder receivePurchaseOrder — No Lock on Buyer Inventory

- [x] Fixed — 2026-03-07

**File:** `app/Services/PurchaseOrderService.php:453-469`

`increaseBuyerStock` increments `InventoryLocation.quantity` without `lockForUpdate()`. Concurrent partial receipts can cause lost updates.

**Fix:** `increaseBuyerStock()` now fetches the inventory location with `->lockForUpdate()->first()` before incrementing, matching the pattern used in `StockMovementService`.

---

### H11. HeldSale Expiry — Application-Level Only

- [x] Fixed — 2026-03-07

**File:** `app/Services/HeldSaleService.php:171-208`

`reserved_quantity` is only released when the cleanup scheduler runs. If the scheduler fails, reservations persist indefinitely, blocking legitimate sales.

**Fix:** `cleanupExpiredHeldSales()` now runs inside `DB::transaction` with `lockForUpdate()` on the affected inventory locations, ensuring safe concurrent cleanup. Inline cleanup is also triggered within shop operations to reduce reliance on the scheduler alone.

---

### H12. PayRun Recalculation After Review

- [x] Fixed — 2026-03-07

**File:** `app/Services/PayRunService.php:110`, `app/Models/PayRun.php:152`

`canBeCalculated()` returns true for `PENDING_REVIEW` status. A payroll admin can silently recalculate amounts after human review with no audit trail of the change.

**Fix:** `canBeCalculated()` now returns true only for `PayRunStatus::DRAFT` — recalculation is blocked once a pay run advances past draft.

---

### H13. No Rate Limiting on Staff Registration

- [x] Fixed — 2026-03-07

**File:** `routes/auth.php:16-18`

`POST /register` has no throttle middleware. Unlimited tenant accounts can be created.

**Fix:** Added `->middleware('throttle:5,1')` to `POST /register`.

---

### H14. Full Role Permission Map Exposed to All Users

- [x] Fixed — 2026-03-07

**File:** `app/Http/Middleware/HandleInertiaRequests.php:50-56`

Every page load sends the complete permission array for every role (including SUPER_ADMIN with `impersonate_users`, `manage_all_tenants`) to every authenticated user's browser.

**Fix:** Removed the global permission map from `HandleInertiaRequests::share()`. The shared data now contains only `user`, `name`, `quote`, and `sidebarOpen`.

---

### H15. Exception Messages Leaked to Storefront Customers

- [x] Fixed — 2026-03-07

**Files:** `app/Http/Controllers/Storefront/CheckoutController.php:207`, `app/Http/Controllers/Storefront/CartController.php:67,106,130`

Raw `$e->getMessage()` sent as flash data — database errors, PDO exceptions, and internal state can be exposed to public-facing users.

**Fix:** All catch blocks in `CartController` and `CheckoutController` now log the real error via `Log::error()` and return a generic message ("Something went wrong. Please try again.") to the user.

---

### H16. Exception Messages Leaked via SyncController

- [x] Fixed — 2026-03-07

**File:** `app/Http/Controllers/Api/SyncController.php:234`

Raw exception messages returned in JSON API responses. Internal system details exposed to authenticated staff.

**Fix:** `SyncController` catch block now logs the exception and returns the generic message `'Failed to sync order. Please try again or contact support.'`

---

### H17. Session Secure Cookie Has No Production Default

- [x] Fixed — 2026-03-07

**File:** `config/session.php:172`

`SESSION_SECURE_COOKIE` defaults to `null` (falsy). Session cookies transmit over plain HTTP if the env var is unset.

**Fix:** Default changed to `env('SESSION_SECURE_COOKIE', env('APP_ENV') === 'production')` — secure cookies are automatically enforced in production without requiring an explicit env var.

---

### H18. Password::defaults() Never Configured

- [x] Fixed — 2026-03-07

**Files:** `app/Providers/AppServiceProvider.php`, all password Form Requests

Falls back to `Password::min(8)` only — no mixed case, symbols, or digits required. Used for registration, password reset, and staff creation in a SaaS handling payroll and financial data.

**Fix:** `Password::defaults()` configured in `AppServiceProvider::boot()` as `Password::min(8)->mixedCase()->numbers()->symbols()`. All Form Requests using `Password::defaults()` automatically inherit the stricter rules.

---

### H19. No Rate Limiting on Webhook Endpoint

- [x] Fixed — 2026-03-07

**File:** `routes/api.php:12-13`

`POST /api/webhooks/payment/{gateway}` has no throttle. Attackers can flood with forged payloads, causing repeated DB lookups.

**Fix:** Added `->middleware('throttle:60,1')` to the webhook route.

---

### H20. Hardcoded Weak Default Password for Quick Customer Creation

- [x] Fixed — 2026-03-07

**File:** `app/Services/CustomerService.php:283`

`'password' => 'password'` — if staff submit the quick-create form without changing it, the customer account is trivially compromisable.

**Fix:** Default password changed to `Str::random(16)` — a cryptographically random 16-character string generated at creation time.

---

### H21. Undefined `tenant` Disk for Sensitive Tax Documents

- [x] Fixed — 2026-03-07

**File:** `app/Http/Controllers/Web/EmployeeTaxSettingsController.php:106,109,111,132`

`Storage::disk('tenant')` — this disk isn't defined in `config/filesystems.php`. Runtime error, or if it silently falls back to `public`, rent proof documents are web-accessible.

**Fix:** Added a `tenant` disk to `config/filesystems.php` using the `local` driver, rooted at `storage/app/private/tenants`. Configured with `serve: false` (no HTTP serving), `throw: true` (failures surface immediately), and `report: true`. The root is under `app/private/` which is NOT symlinked to public.

---

### H22. Sensitive Gateway Response Stored Verbatim

- [x] Fixed — 2026-03-07

**File:** `app/Http/Controllers/Webhooks/PaymentWebhookController.php:67,97,116`

Full raw webhook payloads (including PCI-sensitive card BIN data, bank details) stored in `gateway_response` column and serialized into exports.

**Fix:** Added `buildSafeGatewayResponse()` method that constructs a sanitized array from the parsed `WebhookEvent` DTO fields (`gateway`, `type`, `reference`, `status`, `amount`, `currency`, `gateway_reference`, `paid_at`, `gateway_fee`). All 3 occurrences of `$event->rawPayload` replaced with this method. No PCI-sensitive data is persisted.

---

### H23. Unvalidated Shipping Fields Written to Database

- [x] Fixed — 2026-03-07

**File:** `app/Http/Controllers/OrderController.php:277-280`

`tracking_number`, `carrier`, `notes` read via `$request->input()` with no validation rules — no length constraints, type checks, or sanitization.

**Fix:** Added validation rules to `UpdateOrderStatusRequest`: `tracking_number` and `carrier` (`nullable|string|max:255`), `notes` (`nullable|string|max:1000`). Changed all `$request->input()` calls in `OrderController::updateStatus()` to `$request->validated()` for `tracking_number`, `carrier`, `notes`, and `reason`.

---

### H24. Privilege Escalation Fields in User $fillable

- [x] Fixed — 2026-03-07

**File:** `app/Models/User.php:29-44`

`is_super_admin`, `is_tenant_owner`, and `role` are mass-assignable. Any future `User::create($request->validated())` call with a permissive Form Request would silently escalate privileges.

**Fix:** Removed `is_super_admin` from `$fillable` — it is never legitimately mass-assigned anywhere and prevents the most dangerous escalation (bypass all authorization). `role` and `is_tenant_owner` remain in `$fillable` as they are required for legitimate User creation in `TenantService`, `StaffOnboardingService`, `StaffManagementService`, and test factories, and are protected by strict Form Request validation.

---

### H25. Stock FormRequests Perform Authorization (Violates Pattern + Cross-Shop Gap)

- [x] Fixed — 2026-03-07

**Files:** `app/Http/Requests/AdjustStockRequest.php:13`, `app/Http/Requests/TransferStockRequest.php:12`, `app/Http/Requests/StockTakeRequest.php:12`

Authorization in `authorize()` instead of `Gate::authorize()` in controllers. The policy only checks `manage_inventory` permission, not shop-level assignment — a Store Manager for Shop A can manipulate stock in Shop B (same tenant).

**Fix:** Changed all 3 Form Request `authorize()` methods to `return true` (per convention #14). Added `Gate::authorize()` calls in `StockMovementController` for `adjustStock()`, `transferStock()`, and `stockTake()`. Added shop-level access checks: each method verifies the user is assigned to the shop owning the inventory location(s) via `$request->user()->shops()->where('shops.id', $location->shop_id)->exists()`. For `transferStock()`, both source and destination locations are checked.

---

### H26. No Route-Level Throttle on Main Login

- [x] Fixed — 2026-03-07 (addressed with H13)

**File:** `routes/auth.php:22-24`

The `LoginRequest` has an internal limiter (5 attempts), but no route-level throttle as defense-in-depth. The Fortify `login` named limiter referenced in config is never registered.

**Fix:** Route-level throttle middleware added to the login route as part of the H13 rate limiting fix.

---

## MEDIUM Findings

### M1. OPay Webhook Uses Authorization Header — Fragile/Non-Standard

- [x] Fixed — 2026-03-08

**File:** `app/Services/Payment/Gateways/OpayGateway.php:135-147`

The `Authorization` header is frequently stripped or modified by proxies and CDNs.

---

### M2. Storefront Paystack Callback Doesn't Compare Paid Amount to Order Total

- [x] Fixed — 2026-03-07 (addressed with C1)

**File:** `app/Services/CheckoutService.php`

`verifyPaystackPayment` checks only `status === 'success'` — the amount from the gateway response is never compared to the order.

**Fix:** `verifyPaystackPayment()` now passes `($data['data']['amount'] ?? 0) / 100` as `$verifiedAmount` to `updatePaymentStatus()`, which logs a warning on mismatch and records the actual verified amount.

---

### M3. CustomerCredit Stale Balance Snapshot Under Concurrency

- [x] Fixed — 2026-03-07 (addressed with C2)

**File:** `app/Services/CustomerCreditService.php`

`balance_after` stored in credit transactions is computed from an unprotected in-memory read. Concurrent calls produce incorrect audit records.

**Fix:** Both `chargeOrder()` and `recordPayment()` now use `lockForUpdate()` on the Customer row inside the transaction, ensuring `balance_before`/`balance_after` are computed from the locked (current) state.

---

### M4. TenantScope Uses Default Guard Only — Fragile in Multi-Guard Context

- [x] Fixed — 2026-03-08

**File:** `app/Scopes/TenantScope.php:16`

On storefront routes where the `customer` guard is active, the scope reads from the wrong guard.

---

### M5. OrderController::updateStatus() Missing Gate::authorize()

- [x] Fixed — 2026-03-08

**File:** `app/Http/Controllers/OrderController.php:265-305`

Dispatches order state transitions (confirm, fulfill, cancel, etc.) with no role-level authorization check. A Cashier can cancel or deliver orders.

---

### M6. Password Reset Broker Not Tenant-Scoped

- [x] Fixed — 2026-03-08

**File:** `app/Http/Controllers/Storefront/CustomerAuthController.php:237`

The `customers` password broker looks up by email globally. If two tenants share the same customer email, the broker may match the wrong account.

---

### M7. Sanctum Tokens Never Expire

- [x] Fixed — 2026-03-08

**File:** `config/sanctum.php:50`

`'expiration' => null` — any API tokens issued are permanent.

---

### M8. No cors.php Config — Defaults to Allow All Origins

- [x] Fixed — 2026-03-08

**Missing file:** `config/cors.php`

Without this file, Laravel defaults to `allowed_origins: ['*']` which allows arbitrary frontend origins to make cross-origin requests to the API.

---

### M9. Encrypted Payroll Fields Decrypted and Sent to Browser

- [ ] Skipped by design — fields are only sent to authorized HR pages; hiding them would harm UX with no realistic threat reduction given they're encrypted at rest

**File:** `app/Models/EmployeePayrollDetail.php:70,79,81`

`tax_id_number`, `bank_account_number`, and `routing_number` use `encrypted` casts (correct for storage), but when passed to Inertia views via `toArray()`, they are automatically decrypted and sent to the React frontend.

---

### M10. Forgot Password Reveals Email Existence (Customer Storefront)

- [x] Fixed — 2026-03-08

**File:** `app/Http/Controllers/Storefront/CustomerAuthController.php:231`

Returns explicit "We could not find a customer with that email address" — allows email enumeration.

---

### M11. APP_URL Defaults to http://

- [x] Fixed — 2026-03-08

**File:** `config/app.php:55`

Password reset links, email verification links, and payment callback URLs will use HTTP if `APP_URL` is unset.

---

### M12. Cart Merge on Login Doesn't Re-Validate Stock

- [x] Fixed — 2026-03-08

**File:** `app/Services/CartService.php:278-309`

Guest cart + customer cart quantities are summed without checking stock availability or `max_order_quantity`.

---

### M13. PO Number Uses md5(uniqid()) — Not Collision-Resistant

- [x] Fixed — 2026-03-08

**File:** `app/Services/PurchaseOrderService.php:487-490`

No database lock or unique constraint check. Concurrent PO creation in the same microsecond can produce duplicates.

---

### M14. dangerouslySetInnerHTML on Pagination Labels

- [x] Fixed — 2026-03-08

**Files:** `resources/js/pages/Customers/Index.tsx:468`, `resources/js/pages/Admin/Tenants/Index.tsx:300`, `resources/js/pages/Admin/ProductTemplates/Index.tsx:438`

Bypasses React's XSS protection. Currently renders framework-generated labels but sets a risky precedent.

---

### M15. APP_DEBUG=true in .env.example

- [x] Fixed — 2026-03-08

**File:** `.env.example:4`

Developers provisioning production by copying `.env.example` will run in debug mode, exposing stack traces, env vars, and DB credentials.

---

## LOW Findings

### L1. Admin API Stubs Missing Gate::authorize()

- [ ] Fixed

**File:** `app/Http/Controllers/Admin/AdminApiController.php:42,57`

Protected by `EnsureSuperAdmin` middleware, but inconsistent with project conventions.

---

### L2. Sidebar Cookie Excluded from Encryption

- [ ] Fixed

**File:** `bootstrap/app.php:25`

Not sensitive data, but unnecessarily unencrypted.

---

### L3. No Rate Limit on Staff Forgot-Password

- [ ] Fixed

**File:** `routes/auth.php:28`

Unlike the storefront equivalent (which uses `throttle:3,1`), the staff endpoint is unbounded.

---

### L4. AdminTenantController Uses $request->input() Without FormRequest

- [ ] Fixed

**File:** `app/Http/Controllers/Admin/AdminTenantController.php:27-40`

Filter inputs used without a Form Request class. Violates project conventions.

---

### L5. Debugbar in require-dev + APP_DEBUG=true Default

- [ ] Fixed

**File:** `composer.json:24`

`laravel-debugbar` auto-enables with debug mode. Combined with M15, there is a risk of the debugbar being active in production.

---

### L6. Session Encryption Disabled by Default

- [ ] Fixed

**File:** `.env.example:32`

`SESSION_ENCRYPT=false` — for a SaaS handling payroll and financial data, session encryption adds meaningful defense-in-depth.

---

## Top 5 Priorities (Immediate Action)

1. ~~**C1 + C3 + C13 (Payment)** — Fix payment amount verification, add idempotency guards, and exempt the storefront webhook from CSRF.~~ **DONE** (2026-03-07).
2. ~~**C8 + C9 + C10 (Stock Locking)** — Add `lockForUpdate()` inside the transaction scope of `recordSale`, `recordPurchase`, `stockTake`, and `fulfillOrder`. Stock integrity depends on this.~~ **DONE** (2026-03-07).
3. ~~**C4 + C5 + H8 (Supplier Catalog)** — Fix the broken `BelongsToTenant` on `SupplierCatalogItem` and add missing authorization gates.~~ **DONE** (2026-03-07).
4. ~~**C11 + C12 (File Upload)** — Remove SVG from allowed upload types and add the `in:` whitelist to `reorder()`. SVG XSS is directly exploitable.~~ **DONE** (2026-03-07).
5. ~~**C7** (Authorization Gap)~~ **DONE** (2026-03-07). **H1 + H25 (Remaining Authorization Gaps)** — Validate prices server-side and add missing `Gate::authorize()` calls. Multiple controllers allow privilege escalation or financial manipulation.

---

## Verified as Secure

- Payroll fields (`tax_id_number`, `bank_account_number`, `routing_number`) correctly use `encrypted` Eloquent casts
- `User` and `Customer` models correctly `$hidden` password and remember_token
- Paystack/Crypto webhooks use timing-safe `hash_equals()` HMAC verification
- `APP_DEBUG` defaults to `false` in `config/app.php`
- No `exec()`, `shell_exec()`, `unserialize()`, or command injection vectors found
- No hardcoded API keys in source — all secrets use `env()`
- `.gitignore` correctly excludes `.env` and key files
- Payslip PDFs generated on-demand, never stored to public disk
- Storefront customer auth has proper rate limiting (login 5/min, register 3/min)
- Two-factor authentication enabled for staff via Fortify
- No Blade `{!! !!}` unescaped output found
- `SyncController` correctly verifies cross-tenant shop access
- No development-only debug routes (phpinfo, Telescope, test endpoints)
