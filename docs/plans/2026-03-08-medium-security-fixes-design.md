# Design: Medium Security Fixes (M8, M10–M15)

**Date:** 2026-03-08
**Scope:** 7 remaining MEDIUM findings from the security audit
**M9 skipped:** Payroll PII fields are encrypted at rest and only sent to authorized HR pages — hiding from browser would harm UX with no realistic threat reduction.

---

## Issues and Fixes

### Group 1 — Config/Env (M8, M11, M15)

**M15 — APP_DEBUG=true in .env.example**
Change `APP_DEBUG=true` → `APP_DEBUG=false`. A developer copying .env.example to provision a production server would otherwise run in debug mode, exposing stack traces, env vars, and DB credentials.

**M11 — APP_URL defaults to http://**
Add a comment to `.env.example` next to `APP_URL` noting it must be `https://` in production. Password reset links, email verification links, and payment callback URLs are derived from this value.

**M8 — No cors.php — defaults to allow all origins**
Create `config/cors.php` (Laravel's cors config is not published by default). Set `allowed_origins` to `[env('APP_URL', 'http://localhost')]` so cross-origin requests are only accepted from the app's own origin, not `*`. Expose `CORS_ALLOWED_ORIGINS` as an env override for multi-domain deployments. All other CORS defaults remain standard (methods, headers, etc.).

---

### Group 2 — Quick Code Fixes (M10, M14)

**M10 — Forgot-password reveals email existence**
`CustomerAuthController::sendResetLink()` currently does a manual lookup and returns an explicit "We could not find a customer with that email address" error. Remove the early-return branch. Always call the password broker and return a generic response: "If that email is registered, a reset link has been sent." The broker silently no-ops if the email doesn't exist — timing is not meaningfully distinguishable.

**M14 — dangerouslySetInnerHTML on pagination labels**
Three pages (`Customers/Index`, `Admin/Tenants/Index`, `Admin/ProductTemplates/Index`) render `link.label` via `dangerouslySetInnerHTML`. Laravel pagination labels only contain `&laquo;`, `&raquo;`, and page numbers. Fix: a `decodePaginationLabel(label: string)` helper that replaces the two known HTML entities with their Unicode equivalents (`«`, `»`) and returns the result as plain text — no HTML parsing, no XSS surface.

---

### Group 3 — Model/Data Fixes (M13)

**M13 — PO number uses md5(uniqid()) — not collision-resistant**
`PurchaseOrderService::generatePONumber()` uses `md5(uniqid())` which is time-based; concurrent requests in the same microsecond produce identical values. Fix:
1. Replace generation with `Str::upper(Str::random(6))` — 62^6 ≈ 56 billion combinations vs hex's ~16 million for 6 chars.
2. Add a `UNIQUE` constraint on `purchase_orders.po_number` via migration.
3. Wrap generation in a retry loop (max 3 attempts) catching `UniqueConstraintViolationException`.

---

### Group 4 — Business Logic (M12)

**M12 — Cart merge on login doesn't re-validate stock**
`CartService::mergeGuestCartIntoCustomerCart()` sums guest + customer quantities without checking stock. Fix: after computing `$newQuantity`, load the variant's available quantity and cap `$newQuantity` to `min($newQuantity, $availableQty)`. Also enforce `max_order_quantity` if set. Silently cap rather than reject — a smaller valid cart is better UX than a broken merge. Only applies to product items (services have no stock constraint).

---

## Files to Change

| File | Fix |
|------|-----|
| `.env.example` | M11 — add https comment; M15 — APP_DEBUG=false |
| `config/cors.php` | M8 — create file |
| `app/Http/Controllers/Storefront/CustomerAuthController.php` | M10 — remove email enumeration |
| `resources/js/lib/formatters.ts` (or utils.ts) | M14 — add decodePaginationLabel helper |
| `resources/js/pages/Customers/Index.tsx` | M14 — use helper |
| `resources/js/pages/Admin/Tenants/Index.tsx` | M14 — use helper |
| `resources/js/pages/Admin/ProductTemplates/Index.tsx` | M14 — use helper |
| `app/Services/PurchaseOrderService.php` | M13 — new PO generation + retry |
| `database/migrations/*_add_unique_to_po_number.php` | M13 — unique constraint |
| `app/Services/CartService.php` | M12 — stock cap on merge |
