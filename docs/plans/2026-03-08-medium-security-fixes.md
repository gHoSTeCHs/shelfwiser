# Medium Security Fixes (M8, M10–M15) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 7 remaining MEDIUM security findings: CORS wildcard, email enumeration, unsafe innerHTML, PO number collisions, cart merge stock bypass, and debug/URL env defaults.

**Architecture:** Targeted fixes across config, one PHP service, one PHP controller, one migration, and three React pages plus a shared TS utility. No new abstractions — each fix is a direct, minimal change to the identified location.

**Tech Stack:** Laravel 11, PHP 8.3, React 18, TypeScript, Inertia.js

---

## Task 1: M15 + M11 — Harden .env.example

**File:** `.env.example`

**Step 1: Change APP_DEBUG to false**

Find line 4:
```
APP_DEBUG=true
```
Replace with:
```
APP_DEBUG=false
```

**Step 2: Add https production note to APP_URL**

Find line 5:
```
APP_URL=http://localhost
```
Replace with:
```
APP_URL=http://localhost
# NOTE: Must be https:// in production — password reset links, email verification, and payment callbacks are derived from this value.
```

**Step 3: Verify**

Open the file and confirm both lines are updated. No tests needed — this is a documentation/default fix.

**Step 4: Commit**

```bash
git add .env.example
git commit -m "security: set APP_DEBUG=false and document APP_URL https requirement (M11, M15)"
```

---

## Task 2: M8 — Create CORS Config

**Context:** Laravel does not publish `config/cors.php` by default. Without it, the `fruitcake/laravel-cors` / built-in CORS middleware uses `allowed_origins: ['*']` — any origin can make cross-origin requests to the API.

**File:** `config/cors.php` (create new)

**Step 1: Create the config file**

Create `config/cors.php` with this exact content:

```php
<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(
        explode(',', env('CORS_ALLOWED_ORIGINS', env('APP_URL', 'http://localhost')))
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
```

Key design choices:
- `allowed_origins` defaults to `APP_URL` (the app's own domain) — not `*`
- `CORS_ALLOWED_ORIGINS` env var accepts comma-separated list for multi-domain deployments (e.g. `CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`)
- `supports_credentials: true` is required for Sanctum SPA cookie authentication to work
- `paths` covers only `api/*` and the Sanctum CSRF endpoint — web routes are same-origin and don't need CORS headers

**Step 2: Verify config loads**

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan config:show cors
```

Expected: outputs the array above with `allowed_origins` containing your `APP_URL` value.

**Step 3: Commit**

```bash
git add config/cors.php
git commit -m "security: add CORS config restricting allowed origins to APP_URL (M8)"
```

---

## Task 3: M10 — Fix Email Enumeration in Customer Forgot Password

**Context:** `CustomerAuthController::sendResetLink()` does a manual customer lookup before calling the broker, and returns an explicit "We could not find a customer with that email address" error if not found. This lets an attacker enumerate which emails are registered.

**File:** `app/Http/Controllers/Storefront/CustomerAuthController.php`

**Step 1: Read the file** (lines 218–248 from the current state)

The current `sendResetLink()` method looks like:
```php
public function sendResetLink(Request $request, Shop $shop): RedirectResponse
{
    $request->validate(['email' => ['required', 'email']]);

    $customer = Customer::where('email', $request->email)
        ->where('tenant_id', $shop->tenant_id)
        ->first();

    if (! $customer) {
        return back()->withErrors([
            'email' => 'We could not find a customer with that email address.',
        ]);
    }

    $status = Password::broker('customers')->sendResetLink([
        'email' => $request->email,
        'tenant_id' => $shop->tenant_id,
    ]);

    if ($status === Password::RESET_LINK_SENT) {
        return back()->with('status', __($status));
    }

    throw ValidationException::withMessages([
        'email' => [__($status)],
    ]);
}
```

**Step 2: Replace sendResetLink() body**

Remove the explicit customer lookup and always return a generic response. Find the entire method body and replace with:

```php
public function sendResetLink(Request $request, Shop $shop): RedirectResponse
{
    $request->validate([
        'email' => ['required', 'email'],
    ]);

    Password::broker('customers')->sendResetLink([
        'email' => $request->email,
        'tenant_id' => $shop->tenant_id,
    ]);

    return back()->with('status', 'If that email is registered, a reset link has been sent.');
}
```

Key points:
- The broker silently no-ops if the email isn't found — no exception, no error
- We discard the `$status` return value and always return the same generic message
- The `tenant_id` scope (added in M6) still ensures the broker looks up within the correct tenant
- The `Customer` import at the top of the file can stay (it's used in `register()`, `login()`, `verifyEmail()`, `resetPassword()`)

**Step 3: Run tests**

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan test --filter=CustomerAuth
```

Expected: all passing (or same pre-existing DB-state failures as before).

**Step 4: Commit**

```bash
git add app/Http/Controllers/Storefront/CustomerAuthController.php
git commit -m "security: remove email enumeration from customer forgot password (M10)"
```

---

## Task 4: M14 — Replace dangerouslySetInnerHTML on Pagination Labels

**Context:** Three pages use `dangerouslySetInnerHTML={{ __html: link.label }}` to render Laravel pagination labels. The labels contain HTML entities (`&laquo; Previous`, `Next &raquo;`, page numbers). A helper that decodes only the two known entities removes the XSS surface entirely.

**Files:**
- Modify: `resources/js/lib/utils.ts`
- Modify: `resources/js/pages/Customers/Index.tsx:468`
- Modify: `resources/js/pages/Admin/Tenants/Index.tsx:300`
- Modify: `resources/js/pages/Admin/ProductTemplates/Index.tsx:438`

**Step 1: Add helper to utils.ts**

Open `resources/js/lib/utils.ts`. Append this export at the end of the file:

```typescript
export function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}
```

This replaces only the two HTML entities Laravel pagination ever emits. No HTML parsing, no XSS surface.

**Step 2: Update Customers/Index.tsx**

Add the import at the top of the file (find the existing utils import and add `decodePaginationLabel`):
```typescript
import { cn, decodePaginationLabel } from '@/lib/utils';
```
(If `cn` is already imported from `utils`, just add `decodePaginationLabel` to the same import.)

Find (around line 467–471):
```tsx
<span
    dangerouslySetInnerHTML={{
        __html: link.label,
    }}
/>
```

Replace with:
```tsx
<span>{decodePaginationLabel(link.label)}</span>
```

**Step 3: Update Admin/Tenants/Index.tsx**

Same import addition. Find and replace the same pattern (around line 300–302):
```tsx
<span
    dangerouslySetInnerHTML={{
        __html: link.label,
    }}
/>
```
Replace with:
```tsx
<span>{decodePaginationLabel(link.label)}</span>
```

**Step 4: Update Admin/ProductTemplates/Index.tsx**

Same import addition. Find and replace the same pattern (around line 438–440).

**Step 5: Type-check**

```bash
npm run types
```

Expected: no new type errors.

**Step 6: Verify no dangerouslySetInnerHTML remains**

```bash
grep -r "dangerouslySetInnerHTML" resources/js/
```

Expected: no output.

**Step 7: Commit**

```bash
git add resources/js/lib/utils.ts resources/js/pages/Customers/Index.tsx resources/js/pages/Admin/Tenants/Index.tsx resources/js/pages/Admin/ProductTemplates/Index.tsx
git commit -m "security: replace dangerouslySetInnerHTML on pagination labels with safe helper (M14)"
```

---

## Task 5: M13 — PO Number Collision Resistance

**Context:** `PurchaseOrderService::generatePONumber()` uses `md5(uniqid())` which is time-based. Concurrent requests in the same microsecond produce identical values. There is no `UNIQUE` constraint on the column to catch this.

**Files:**
- Create: `database/migrations/2026_03_08_000000_add_unique_index_to_purchase_orders_po_number.php`
- Modify: `app/Services/PurchaseOrderService.php`

**Step 1: Create migration**

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan make:migration add_unique_index_to_purchase_orders_po_number
```

Open the generated file and replace its `up()` and `down()` with:

```php
public function up(): void
{
    Schema::table('purchase_orders', function (Blueprint $table) {
        $table->string('po_number')->unique()->change();
    });
}

public function down(): void
{
    Schema::table('purchase_orders', function (Blueprint $table) {
        $table->dropUnique(['po_number']);
    });
}
```

Add the `Schema` import if missing: `use Illuminate\Support\Facades\Schema;`

**Step 2: Run migration**

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan migrate
```

Expected: `Migrating: 2026_03_08_..._add_unique_index_to_purchase_orders_po_number` → `Migrated`.

**Step 3: Update generatePONumber() in PurchaseOrderService**

Open `app/Services/PurchaseOrderService.php`. Find:

```php
protected function generatePONumber(): string
{
    $date = now()->format('Ymd');
    $random = strtoupper(substr(md5(uniqid()), 0, 6));

    return "PO-{$date}-{$random}";
}
```

Replace with:

```php
protected function generatePONumber(): string
{
    $date = now()->format('Ymd');

    for ($attempt = 0; $attempt < 3; $attempt++) {
        $candidate = 'PO-' . $date . '-' . strtoupper(\Illuminate\Support\Str::random(6));

        if (! \App\Models\PurchaseOrder::query()->where('po_number', $candidate)->exists()) {
            return $candidate;
        }
    }

    return 'PO-' . $date . '-' . strtoupper(\Illuminate\Support\Str::random(8));
}
```

`Str::random(6)` draws from `a-zA-Z0-9` (62 chars) — 62^6 ≈ 56 billion combinations. The 3-attempt loop handles the astronomically unlikely collision; the fallback uses 8 chars for further safety. The `UNIQUE` constraint is the real guard — if all else fails, the DB rejects the insert with a clear exception rather than silently creating a duplicate.

**Step 4: Run tests**

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan test
```

Expected: same pass/fail ratio as before.

**Step 5: Commit**

```bash
git add database/migrations/2026_03_08_*_add_unique_index_to_purchase_orders_po_number.php app/Services/PurchaseOrderService.php
git commit -m "security: make PO number generation collision-resistant with unique DB constraint (M13)"
```

---

## Task 6: M12 — Cap Cart Merge Quantities to Available Stock

**Context:** `CartService::mergeGuestCartIntoCustomerCart()` sums guest + customer item quantities without checking stock. A guest who adds 10 units of a product (stock: 3) and a customer who already has 5 in cart would end up with 15 — bypassing the storefront's stock validation.

**File:** `app/Services/CartService.php`

**Step 1: Read the merge loop**

The relevant section is around line 282–298 (inside the `DB::transaction`):

```php
foreach ($guestCart->items as $guestItem) {
    if ($guestItem->isProduct()) {
        $existingItem = CartItem::where([
            'cart_id' => $customerCart->id,
            'product_variant_id' => $guestItem->product_variant_id,
            'product_packaging_type_id' => $guestItem->product_packaging_type_id,
        ])->first();

        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $guestItem->quantity;
            $existingItem->update(['quantity' => $newQuantity]);
        } else {
            $guestItem->update(['cart_id' => $customerCart->id]);
        }
    } else {
        $guestItem->update(['cart_id' => $customerCart->id]);
    }
}
```

**Step 2: Add eager loading before the loop**

Find the line that retrieves `$guestCart->items` in the merge loop. Just before the `foreach`, ensure the variant + product relationship is loaded:

Find:
```php
foreach ($guestCart->items as $guestItem) {
```

Replace with:
```php
$guestCart->load('items.productVariant.product');

foreach ($guestCart->items as $guestItem) {
```

**Step 3: Cap merged quantities**

Find the `if ($existingItem)` block inside the loop:

```php
        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $guestItem->quantity;
            $existingItem->update(['quantity' => $newQuantity]);
        } else {
```

Replace with:

```php
        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $guestItem->quantity;

            $variant = $guestItem->productVariant;
            if ($variant && ($variant->product->track_stock ?? true)) {
                $available = $this->stockMovementService->getAvailableStock($variant, $customerCart->shop_id);
                $newQuantity = min($newQuantity, max(0, $available));
            }

            if ($variant?->max_order_quantity) {
                $newQuantity = min($newQuantity, $variant->max_order_quantity);
            }

            if ($newQuantity > 0) {
                $existingItem->update(['quantity' => $newQuantity]);
            }
        } else {
```

Key design choices:
- Only caps when `track_stock` is true (untracked products can always merge freely)
- `max(0, $available)` prevents negative caps if stock is 0
- If capped to 0, the item is not updated — the customer's existing quantity remains unchanged (guest's excess is silently dropped)
- Service items (`else` branch) are unchanged — they have no stock concept
- Uses the already-injected `$this->stockMovementService` — no new dependencies

**Step 4: Run tests**

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan test --filter=Cart
```

Expected: passing (or same pre-existing failures).

**Step 5: Commit**

```bash
git add app/Services/CartService.php
git commit -m "security: cap cart merge quantities to available stock on customer login (M12)"
```

---

## Verification Checklist

After all tasks complete, run the full suite:

```bash
C:/Users/hp/.config/herd/bin/php83/php.exe artisan test
npm run types
grep -r "dangerouslySetInnerHTML" resources/js/
C:/Users/hp/.config/herd/bin/php83/php.exe artisan config:show cors
```

Manual checks:
- **M8**: `config:show cors` shows `allowed_origins` containing your APP_URL, not `*`
- **M10**: Submit forgot-password with unknown email → generic "If that email is registered..." message (not a field error)
- **M11/M15**: `.env.example` has `APP_DEBUG=false` and the https production note
- **M13**: `purchase_orders.po_number` column has a unique index (`SHOW INDEX FROM purchase_orders;`)
- **M14**: No `dangerouslySetInnerHTML` in grep output; pagination `«`/`»` still renders correctly
- **M12**: Cart merge with over-stock quantities silently caps — no crash, no error flash
