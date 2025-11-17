# E-Commerce Architecture Decisions

**Date:** 2025-11-15
**Status:** FINALIZED - Ready for Implementation

---

## ✅ Confirmed Architectural Decisions

### 1. Customer Authentication
- **Approach:** Hybrid (Tenant-scoped + Preferred Shop)
- **Details:**
  - Customer belongs to tenant (can shop at all tenant's shops)
  - `preferred_shop_id` tracks their "home" shop for personalization
  - Separate `customers` table with dedicated auth guard
  - Email unique across platform

### 2. Stock Reservation
- **Timing:** On checkout only (Option A)
- **Details:**
  - Stock NOT reserved when added to cart
  - Stock reserved when order is placed
  - Prevents cart abandonment from locking inventory
  - Validation at checkout to ensure availability

### 3. Guest Checkout
- **MVP Approach:** Required login (Option A)
- **Details:**
  - Customers must register/login before checkout
  - Simpler implementation for MVP
  - Guest checkout deferred to post-MVP

### 4. Tax System
- **Approach:** Shop-level tax settings
- **Details:**
  ```php
  // shops table
  'vat_enabled' => true/false
  'vat_rate' => 7.5 (percentage)
  'vat_inclusive' => true/false (is tax included in product prices?)
  ```
- **Calculation:**
  - If `vat_enabled = true` and `vat_inclusive = false`: Add VAT to subtotal
  - If `vat_enabled = true` and `vat_inclusive = true`: Show tax for info only, don't add to total
  - If `vat_enabled = false`: No tax applied

### 5. Email Verification
- **Approach:** Optional (Option A)
- **Details:**
  - Customer can shop immediately after registration
  - Verification email sent but not required
  - `email_verified_at` tracked for future features

### 6. Order Confirmation Email
- **Scope:** Implement in Week 1
- **Details:**
  - Send immediately after order placement
  - Use preferred shop branding
  - Include order details, tracking number, delivery estimate
  - Template: `emails/orders/confirmation.blade.php`

### 7. Password Reset
- **Scope:** Implement in Week 1
- **Details:**
  - Standard Laravel password reset flow
  - Use `password_reset_tokens` table
  - Separate reset flow for customers vs staff
  - Email template: `emails/auth/reset-password.blade.php`

### 8. Order Status Management
- **Who Can Update:**
  - **Staff Only:** Can update order status (Manager level 60+)
  - **Customers:** Can only cancel if status = 'pending'

- **Workflow:**
  ```
  pending → processing → shipped → delivered
     ↓
  cancelled (by customer or staff)
  ```

- **Email Notifications:**
  - Customer receives email on every status change
  - Templates:
    - `emails/orders/status-processing.blade.php`
    - `emails/orders/status-shipped.blade.php`
    - `emails/orders/status-delivered.blade.php`
    - `emails/orders/status-cancelled.blade.php`

### 9. Returns/Refunds
- **Scope:** Post-MVP
- **Details:**
  - Not implementing now
  - Can add later when needed
  - No database design changes for returns yet

### 10. Order Type
- **Approach:** Enum on orders table
- **Values:**
  - `customer` - B2C e-commerce orders
  - `purchase_order` - B2B supplier orders
  - `internal` - Internal shop transfers

### 11. Currency Configuration
- **Scope:** Per-shop settings
- **Fields:**
  ```php
  'currency' => 'NGN' (3-letter code)
  'currency_symbol' => '₦'
  'currency_decimals' => 2
  ```
- **Supported:** NGN, USD, EUR, GBP, GHS, KES, ZAR

### 12. Wholesale Retail Pricing
- **Approach:** Dual pricing on variants
- **Details:**
  ```php
  // product_variants table
  'price' => 5000 (wholesale price)
  'retail_price' => 6000 (retail price, nullable)
  'allow_retail_sales' => true/false
  ```

  ```php
  // shops table
  'allow_retail_sales' => true/false (for wholesale_only shops)
  ```

- **Logic:**
  - If shop is `wholesale_only` and `allow_retail_sales = true`:
    - Show only variants where `allow_retail_sales = true`
    - Use `retail_price` if set, otherwise `price`
  - Otherwise: Use standard `price`

### 13. Storefront Toggle
- **Authorization:** Role level 60+ (Store Manager and above)
- **Policy:** `StorefrontPolicy::manageStorefront()`
- **Settings:** JSON field `storefront_settings` on shops table

---

## 📋 Implementation Scope

### Week 0: Architecture (Days 1-2)
**Migrations:**
1. Drop and recreate `customers` table (with `tenant_id` + `preferred_shop_id`)
2. Add `order_type` to orders table
3. Add currency fields to shops table (currency, currency_symbol, currency_decimals)
4. Add tax fields to shops table (vat_enabled, vat_rate, vat_inclusive)
5. Add retail pricing to product_variants (retail_price, allow_retail_sales)
6. Add retail sales toggle to shops (allow_retail_sales)

**Models & Config:**
1. Update Customer model (Authenticatable, relationships)
2. Configure customer auth guard (config/auth.php)
3. Create OrderType enum
4. Create CurrencyHelper
5. Create StorefrontPolicy

### Week 1: Backend Services (Days 3-7)
**Controllers:**
1. CustomerAuthController (login, register, logout, password reset)
2. CheckoutService (order creation, stock reservation)
3. CheckoutController (checkout page, process, success)
4. CustomerPortalController (dashboard, orders, profile)

**Email Templates:**
1. Order confirmation
2. Password reset
3. Order status updates (4 templates)

**Routes:**
1. Customer auth routes (login, register, logout, password reset)
2. Checkout routes
3. Customer portal routes

**Features:**
1. Stock reservation on checkout
2. Tax calculation based on shop settings
3. Order cancellation (customer-initiated)
4. Email notifications

### Week 2-3: Frontend (Days 8-17)
**Pages (12 total):**
1. StorefrontLayout
2. Home
3. Products
4. ProductDetail
5. Cart
6. Checkout
7. CheckoutSuccess
8. Auth/Login
9. Auth/Register
10. Account/Dashboard
11. Account/Orders
12. Account/OrderDetail
13. Account/Profile

**Components (8 total):**
1. ProductCard
2. AddToCartButton
3. QuantitySelector
4. PriceDisplay (with currency formatting)
5. ProductFilter
6. Breadcrumbs
7. AddressForm
8. OrderSummary

**Patterns:**
- All routes use Wayfinder
- All forms use `<Form>` component
- Currency formatting via CurrencyHelper

### Week 4: Admin & Polish (Days 18-21)
1. Storefront settings admin page
2. Enable/disable storefront toggle
3. Currency selector
4. Tax configuration UI
5. Retail sales configuration
6. Theme customization
7. Cart cleanup command (optional)

### Week 5: Testing (Days 22-26)
1. Feature tests (cart, checkout, auth, portal, tax)
2. Browser tests (full customer journey)
3. Stock reservation tests
4. Order cancellation tests
5. Email notification tests
6. Multi-currency tests
7. Wholesale retail pricing tests

---

## 🚫 Out of Scope (Post-MVP)

- Guest checkout
- Product reviews/ratings
- Wishlist
- Advanced search UI (just categories for now)
- Returns/refunds system
- Payment gateway integration (Stripe, Paystack)
- Shipping integration
- Order tracking (beyond status updates)
- Loyalty programs
- Multi-language support
- Mobile app
- Advanced analytics

---

## 📊 Technical Specifications

### Database Changes Summary

**New Tables:**
- `customers` (with tenant_id, preferred_shop_id)

**Modified Tables:**
- `orders` (+order_type)
- `shops` (+currency, currency_symbol, currency_decimals, vat_enabled, vat_rate, vat_inclusive, allow_retail_sales)
- `product_variants` (+retail_price, allow_retail_sales)

**New Enums:**
- `OrderType` (customer, purchase_order, internal)

**Total Migrations:** 6

### Auth Guards

```php
'guards' => [
    'web' => [...],        // Staff authentication
    'customer' => [...],   // Customer authentication (new)
],

'providers' => [
    'users' => [...],      // Staff
    'customers' => [...],  // Customers (new)
],

'passwords' => [
    'users' => [...],      // Staff password resets
    'customers' => [...],  // Customer password resets (new)
],
```

### Email Templates Required

1. `emails/orders/confirmation.blade.php`
2. `emails/orders/status-processing.blade.php`
3. `emails/orders/status-shipped.blade.php`
4. `emails/orders/status-delivered.blade.php`
5. `emails/orders/status-cancelled.blade.php`
6. `emails/auth/reset-password.blade.php`

### New Routes

```php
// Customer authentication
Route::prefix('store/{shop:slug}')
    ->get('/login', ...)
    ->post('/login', ...)
    ->get('/register', ...)
    ->post('/register', ...)
    ->post('/logout', ...)
    ->get('/password/reset', ...)
    ->post('/password/email', ...)
    ->post('/password/reset', ...)

// Checkout
    ->get('/checkout', ...)
    ->post('/checkout', ...)
    ->get('/checkout/success/{order}', ...)

// Customer portal
    ->get('/account', ...)
    ->get('/account/orders', ...)
    ->get('/account/orders/{order}', ...)
    ->post('/account/orders/{order}/cancel', ...)
    ->get('/account/profile', ...)
    ->patch('/account/profile', ...)
```

---

## 🎯 Success Criteria

**MVP is complete when:**

✅ Customers can register/login per tenant
✅ Customers can browse products and add to cart
✅ Customers can checkout with address
✅ Stock is reserved on order placement
✅ Tax calculated based on shop settings
✅ Orders created with correct order_type
✅ Order confirmation email sent
✅ Customers can view order history
✅ Customers can cancel pending orders
✅ Status change emails sent to customers
✅ Currency displayed correctly per shop
✅ Wholesale shops can sell at retail (if enabled)
✅ Staff can toggle storefront on/off
✅ Password reset works for customers
✅ All routes use Wayfinder
✅ All forms use `<Form>` component
✅ Mobile responsive
✅ Feature tests pass
✅ Browser tests pass

---

## ⏱️ Estimated Timeline

- **Week 0:** 2 days (architecture)
- **Week 1:** 5 days (backend)
- **Week 2-3:** 10 days (frontend)
- **Week 4:** 4 days (admin tools)
- **Week 5:** 5 days (testing)

**Total:** 26 working days (~5-6 weeks with 1 developer)

---

## 🚀 Ready to Proceed

All architectural decisions finalized. Implementation can begin immediately.

**Next Step:** Implement Week 0 (Architecture Updates)
