# ShelfWise Security Audit Report

**Date:** 2026-03-06
**Scope:** Full codebase — 6 parallel domain-specific audits
**Status:** Findings only (no changes applied)

## Executive Summary

| Severity     | Count |
|--------------|-------|
| **CRITICAL** | 13    |
| **HIGH**     | 24    |
| **MEDIUM**   | 15    |
| **LOW**      | 6     |

The most dangerous clusters are: **payment verification gaps** (attackers can pay less than owed), **stock race conditions** (inventory can go negative via concurrent requests), and **missing authorization checks** (low-privilege users can perform privileged actions). Several of these are exploitable today without specialized tools.

---

## CRITICAL Findings

### C1. Payment Amount Never Verified Against Order Total

- [ ] Fixed

**Files:** `app/Http/Controllers/PaymentController.php:38-59`, `app/Http/Controllers/Webhooks/PaymentWebhookController.php:86-103`

Neither the payment callback nor the webhook handler compares the gateway-verified amount against `$order->total_amount`. An attacker can initiate a real payment for a small test transaction, then supply that verified reference against a large order — the system records the small amount as payment and marks the order paid.

---

### C2. Customer Credit Race Condition — Double-Spend

- [ ] Fixed

**File:** `app/Services/CustomerCreditService.php:18-48`

`canPurchaseOnCredit()` runs before the `DB::transaction`, and no `lockForUpdate()` is used on the Customer row. Two concurrent orders against the same credit limit both pass the check and both commit, exceeding the credit limit.

---

### C3. Duplicate OrderPayment on Concurrent Callback + Webhook

- [ ] Fixed

**File:** `app/Services/CheckoutService.php:264-295`

The storefront checkout flow has no idempotency guard — `OrderPayment::create` is called without checking for an existing payment with the same reference. The gateway redirect and webhook arrive simultaneously, both pass the `payment_status !== PAID` check, and both create payment records — double-crediting the order.

---

### C4. SupplierCatalogItem Uses BelongsToTenant But Has No `tenant_id` Column

- [ ] Fixed

**File:** `app/Models/SupplierCatalogItem.php:14`
**Migration:** `supplier_catalog_items` table has only `supplier_tenant_id`, no `tenant_id`

The `TenantScope` applies `WHERE tenant_id = ?` which silently evaluates to nothing (column doesn't exist). Route model binding in `edit()` and `destroy()` resolves catalog items across all tenants. Any tenant can access or delete another supplier's catalog items.

---

### C5. SupplierCatalogController::store() Missing Gate::authorize()

- [ ] Fixed

**File:** `app/Http/Controllers/SupplierCatalogController.php:56-68`

Any authenticated user (including Cashier) can POST to `/supplier/catalog` and add products to the supplier catalog. Every other method in this controller has authorization — `store()` was missed.

---

### C6. TenantScope Silently Skipped for Guest Users

- [ ] Fixed

**File:** `app/Scopes/TenantScope.php:16`

When `auth()->check()` returns false (storefront guests), the scope applies no filter at all. Cart and CartItem models using `BelongsToTenant` are completely unscoped for guest sessions — a session ID collision would expose another tenant's cart data.

---

### C7. OrderController::updatePaymentStatus() Missing Gate::authorize()

- [ ] Fixed

**File:** `app/Http/Controllers/OrderController.php:336-353`

Any authenticated user (including Cashier) can POST to `/orders/{order}/payment` and mark any order in their tenant as paid, bypassing approval workflows. No role-level check exists.

---

### C8. StockMovementService recordSale/recordPurchase — No lockForUpdate

- [ ] Fixed

**File:** `app/Services/StockMovementService.php:333-355` (recordSale), `:260-265` (recordPurchase)

Neither method locks the `InventoryLocation` row. The caller (`POSService`) acquires a lock in a different transaction scope that is already released by the time `recordSale`'s inner transaction runs. Two concurrent POS sales for the last unit both succeed, driving stock to -1.

---

### C9. OrderService::fulfillOrder — Non-Atomic Reservation Release

- [ ] Fixed

**File:** `app/Services/OrderService.php:221-241`

`reserved_quantity` is decremented and saved without a lock, then `adjustStock` runs in a separate nested transaction. A concurrent cancellation between the two operations can drive `reserved_quantity` negative.

---

### C10. StockMovementService::stockTake — No lockForUpdate

- [ ] Fixed

**File:** `app/Services/StockMovementService.php:418-456`

`stockTake` reads `$location->quantity`, then overwrites it without locking the row. A concurrent sale between read and write is silently reversed — the stock take overwrites the sale's deduction with no audit trail.

---

### C11. SVG Upload — Stored XSS

- [ ] Fixed

**Files:** `config/images.php:23,35`, `app/Services/ImageService.php:29`

`image/svg+xml` and `svg` are allowed MIME types/extensions. Uploaded SVGs land on the `public` disk (web-accessible). An SVG with embedded `<script>` tags executes in any viewer's browser — stealing session cookies, performing CSRF, or exfiltrating data. Affects storefront customers and admin staff.

---

### C12. ImageController::reorder() — Arbitrary Model Instantiation

- [ ] Fixed

**File:** `app/Http/Controllers/ImageController.php:113-121`

`model_type` is validated only as `required|string` (no allowlist). The value is concatenated into `App\Models\{input}` and `findOrFail()` is called. Any `App\Models\*` class can be targeted — `Tenant`, `Payslip`, `PayRun`, `User` — bypassing per-model tenant isolation.

---

### C13. Storefront Payment Webhook Blocked by CSRF

- [ ] Fixed

**File:** `routes/storefront.php:52-54`

The storefront Paystack webhook is in the `web` middleware group (which includes CSRF verification) but no CSRF exemption is declared. Paystack's POST will be rejected with HTTP 419 before signature validation ever runs — all storefront payment confirmations silently fail.

---

## HIGH Findings

### H1. Price Manipulation via Client-Supplied unit_price

- [ ] Fixed

**File:** `app/Services/OrderService.php:484-510`

`unit_price` and `discount_amount` accepted directly from request payload with no server-side comparison to actual product price. A Cashier can sell an expensive item for near-zero cost.

---

### H2. OrderRefundService Calls Non-Existent Method

- [ ] Fixed

**File:** `app/Services/OrderRefundService.php:50,191`

`$this->paymentGatewayManager->getGateway(...)` — this method doesn't exist on `PaymentGatewayManager` (correct method is `gateway()`). Every refund attempt crashes with `BadMethodCallException`. No automatic refund can ever succeed.

---

### H3. Webhook Idempotency Bypassable

- [ ] Fixed

**File:** `app/Http/Controllers/Webhooks/PaymentWebhookController.php:61-103`

The idempotency check uses `reference_number`, but the order lookup falls back to parsing `order_number` from the reference. A retry with a different reference string but same order number bypasses the check. No `lockForUpdate` on the order, no transaction wrapping.

---

### H4. Flutterwave Webhook Uses Static Secret (Not HMAC Over Payload)

- [ ] Fixed

**File:** `app/Services/Payment/Gateways/FlutterwaveGateway.php:190-199`

Compares the raw secret directly against the `verif-hash` header. If the secret leaks, an attacker can forge any webhook payload — unlike Paystack/Crypto which HMAC the payload body.

---

### H5. Payment Callback Route Unauthenticated

- [ ] Fixed

**Files:** `routes/web.php:91`, `app/Http/Controllers/PaymentController.php:20-25`

`GET /payment/callback/{gateway}/{order}` has no auth middleware. Tenant check only runs `if (auth()->check())`. An unauthenticated user who knows an order UUID can trigger payment verification and credit a payment.

---

### H6. Partial Refund Not Bounded by Original Amount

- [ ] Fixed

**File:** `app/Services/OrderRefundService.php:195-201`

Cumulative `refund_amount` is never checked against `$payment->amount`. Multiple partial refunds can exceed the original charge.

---

### H7. SupplierConnectionController::store() Missing Gate::authorize()

- [ ] Fixed

**File:** `app/Http/Controllers/SupplierConnectionController.php:57-67`

Any authenticated user can initiate supplier connection requests regardless of role.

---

### H8. SupplierCatalogController::update() Missing Gate::authorize()

- [ ] Fixed

**File:** `app/Http/Controllers/SupplierCatalogController.php:81-87`

Combined with C4 (broken tenant scope), this allows cross-tenant catalog modification.

---

### H9. POS Stock Check Uses Unlocked Query (TOCTOU)

- [ ] Fixed

**File:** `app/Services/POSService.php:73-80`

`validateStockAvailability()` issues a fresh unlocked SELECT instead of using the already-locked `$locations` collection. The lock is wasted; concurrent sales both pass validation.

---

### H10. PurchaseOrder receivePurchaseOrder — No Lock on Buyer Inventory

- [ ] Fixed

**File:** `app/Services/PurchaseOrderService.php:453-469`

`increaseBuyerStock` increments `InventoryLocation.quantity` without `lockForUpdate()`. Concurrent partial receipts can cause lost updates.

---

### H11. HeldSale Expiry — Application-Level Only

- [ ] Fixed

**File:** `app/Services/HeldSaleService.php:171-208`

`reserved_quantity` is only released when the cleanup scheduler runs. If the scheduler fails, reservations persist indefinitely, blocking legitimate sales.

---

### H12. PayRun Recalculation After Review

- [ ] Fixed

**File:** `app/Services/PayRunService.php:110`, `app/Models/PayRun.php:152`

`canBeCalculated()` returns true for `PENDING_REVIEW` status. A payroll admin can silently recalculate amounts after human review with no audit trail of the change.

---

### H13. No Rate Limiting on Staff Registration

- [ ] Fixed

**File:** `routes/auth.php:16-18`

`POST /register` has no throttle middleware. Unlimited tenant accounts can be created.

---

### H14. Full Role Permission Map Exposed to All Users

- [ ] Fixed

**File:** `app/Http/Middleware/HandleInertiaRequests.php:50-56`

Every page load sends the complete permission array for every role (including SUPER_ADMIN with `impersonate_users`, `manage_all_tenants`) to every authenticated user's browser.

---

### H15. Exception Messages Leaked to Storefront Customers

- [ ] Fixed

**Files:** `app/Http/Controllers/Storefront/CheckoutController.php:207`, `app/Http/Controllers/Storefront/CartController.php:67,106,130`

Raw `$e->getMessage()` sent as flash data — database errors, PDO exceptions, and internal state can be exposed to public-facing users.

---

### H16. Exception Messages Leaked via SyncController

- [ ] Fixed

**File:** `app/Http/Controllers/Api/SyncController.php:234`

Raw exception messages returned in JSON API responses. Internal system details exposed to authenticated staff.

---

### H17. Session Secure Cookie Has No Production Default

- [ ] Fixed

**File:** `config/session.php:172`

`SESSION_SECURE_COOKIE` defaults to `null` (falsy). Session cookies transmit over plain HTTP if the env var is unset.

---

### H18. Password::defaults() Never Configured

- [ ] Fixed

**Files:** `app/Providers/AppServiceProvider.php`, all password Form Requests

Falls back to `Password::min(8)` only — no mixed case, symbols, or digits required. Used for registration, password reset, and staff creation in a SaaS handling payroll and financial data.

---

### H19. No Rate Limiting on Webhook Endpoint

- [ ] Fixed

**File:** `routes/api.php:12-13`

`POST /api/webhooks/payment/{gateway}` has no throttle. Attackers can flood with forged payloads, causing repeated DB lookups.

---

### H20. Hardcoded Weak Default Password for Quick Customer Creation

- [ ] Fixed

**File:** `app/Services/CustomerService.php:283`

`'password' => 'password'` — if staff submit the quick-create form without changing it, the customer account is trivially compromisable.

---

### H21. Undefined `tenant` Disk for Sensitive Tax Documents

- [ ] Fixed

**File:** `app/Http/Controllers/Web/EmployeeTaxSettingsController.php:106,109,111,132`

`Storage::disk('tenant')` — this disk isn't defined in `config/filesystems.php`. Runtime error, or if it silently falls back to `public`, rent proof documents are web-accessible.

---

### H22. Sensitive Gateway Response Stored Verbatim

- [ ] Fixed

**File:** `app/Http/Controllers/Webhooks/PaymentWebhookController.php:67,97,116`

Full raw webhook payloads (including PCI-sensitive card BIN data, bank details) stored in `gateway_response` column and serialized into exports.

---

### H23. Unvalidated Shipping Fields Written to Database

- [ ] Fixed

**File:** `app/Http/Controllers/OrderController.php:277-280`

`tracking_number`, `carrier`, `notes` read via `$request->input()` with no validation rules — no length constraints, type checks, or sanitization.

---

### H24. Privilege Escalation Fields in User $fillable

- [ ] Fixed

**File:** `app/Models/User.php:29-44`

`is_super_admin`, `is_tenant_owner`, and `role` are mass-assignable. Any future `User::create($request->validated())` call with a permissive Form Request would silently escalate privileges.

---

### H25. Stock FormRequests Perform Authorization (Violates Pattern + Cross-Shop Gap)

- [ ] Fixed

**Files:** `app/Http/Requests/AdjustStockRequest.php:13`, `app/Http/Requests/TransferStockRequest.php:12`, `app/Http/Requests/StockTakeRequest.php:12`

Authorization in `authorize()` instead of `Gate::authorize()` in controllers. The policy only checks `manage_inventory` permission, not shop-level assignment — a Store Manager for Shop A can manipulate stock in Shop B (same tenant).

---

### H26. No Route-Level Throttle on Main Login

- [ ] Fixed

**File:** `routes/auth.php:22-24`

The `LoginRequest` has an internal limiter (5 attempts), but no route-level throttle as defense-in-depth. The Fortify `login` named limiter referenced in config is never registered.

---

## MEDIUM Findings

### M1. OPay Webhook Uses Authorization Header — Fragile/Non-Standard

- [ ] Fixed

**File:** `app/Services/Payment/Gateways/OpayGateway.php:135-147`

The `Authorization` header is frequently stripped or modified by proxies and CDNs.

---

### M2. Storefront Paystack Callback Doesn't Compare Paid Amount to Order Total

- [ ] Fixed

**File:** `app/Services/CheckoutService.php:225-233`

`verifyPaystackPayment` checks only `status === 'success'` — the amount from the gateway response is never compared to the order.

---

### M3. CustomerCredit Stale Balance Snapshot Under Concurrency

- [ ] Fixed

**File:** `app/Services/CustomerCreditService.php:62-83`

`balance_after` stored in credit transactions is computed from an unprotected in-memory read. Concurrent calls produce incorrect audit records.

---

### M4. TenantScope Uses Default Guard Only — Fragile in Multi-Guard Context

- [ ] Fixed

**File:** `app/Scopes/TenantScope.php:16`

On storefront routes where the `customer` guard is active, the scope reads from the wrong guard.

---

### M5. OrderController::updateStatus() Missing Gate::authorize()

- [ ] Fixed

**File:** `app/Http/Controllers/OrderController.php:265-305`

Dispatches order state transitions (confirm, fulfill, cancel, etc.) with no role-level authorization check. A Cashier can cancel or deliver orders.

---

### M6. Password Reset Broker Not Tenant-Scoped

- [ ] Fixed

**File:** `app/Http/Controllers/Storefront/CustomerAuthController.php:237`

The `customers` password broker looks up by email globally. If two tenants share the same customer email, the broker may match the wrong account.

---

### M7. Sanctum Tokens Never Expire

- [ ] Fixed

**File:** `config/sanctum.php:50`

`'expiration' => null` — any API tokens issued are permanent.

---

### M8. No cors.php Config — Defaults to Allow All Origins

- [ ] Fixed

**Missing file:** `config/cors.php`

Without this file, Laravel defaults to `allowed_origins: ['*']` which allows arbitrary frontend origins to make cross-origin requests to the API.

---

### M9. Encrypted Payroll Fields Decrypted and Sent to Browser

- [ ] Fixed

**File:** `app/Models/EmployeePayrollDetail.php:70,79,81`

`tax_id_number`, `bank_account_number`, and `routing_number` use `encrypted` casts (correct for storage), but when passed to Inertia views via `toArray()`, they are automatically decrypted and sent to the React frontend.

---

### M10. Forgot Password Reveals Email Existence (Customer Storefront)

- [ ] Fixed

**File:** `app/Http/Controllers/Storefront/CustomerAuthController.php:231`

Returns explicit "We could not find a customer with that email address" — allows email enumeration.

---

### M11. APP_URL Defaults to http://

- [ ] Fixed

**File:** `config/app.php:55`

Password reset links, email verification links, and payment callback URLs will use HTTP if `APP_URL` is unset.

---

### M12. Cart Merge on Login Doesn't Re-Validate Stock

- [ ] Fixed

**File:** `app/Services/CartService.php:278-309`

Guest cart + customer cart quantities are summed without checking stock availability or `max_order_quantity`.

---

### M13. PO Number Uses md5(uniqid()) — Not Collision-Resistant

- [ ] Fixed

**File:** `app/Services/PurchaseOrderService.php:487-490`

No database lock or unique constraint check. Concurrent PO creation in the same microsecond can produce duplicates.

---

### M14. dangerouslySetInnerHTML on Pagination Labels

- [ ] Fixed

**Files:** `resources/js/pages/Customers/Index.tsx:468`, `resources/js/pages/Admin/Tenants/Index.tsx:300`, `resources/js/pages/Admin/ProductTemplates/Index.tsx:438`

Bypasses React's XSS protection. Currently renders framework-generated labels but sets a risky precedent.

---

### M15. APP_DEBUG=true in .env.example

- [ ] Fixed

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

1. **C1 + C3 + C13 (Payment)** — Fix payment amount verification, add idempotency guards, and exempt the storefront webhook from CSRF. Without these, payments are fundamentally broken.
2. **C8 + C9 + C10 (Stock Locking)** — Add `lockForUpdate()` inside the transaction scope of `recordSale`, `recordPurchase`, `stockTake`, and `fulfillOrder`. Stock integrity depends on this.
3. **C4 + C5 + H8 (Supplier Catalog)** — Fix the broken `BelongsToTenant` on `SupplierCatalogItem` and add missing authorization gates. This is a cross-tenant data breach vector.
4. **C11 + C12 (File Upload)** — Remove SVG from allowed upload types and add the `in:` whitelist to `reorder()`. SVG XSS is directly exploitable.
5. **C7 + H1 + H25 (Authorization Gaps)** — Add missing `Gate::authorize()` calls and validate prices server-side. Multiple controllers allow privilege escalation or financial manipulation.

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
