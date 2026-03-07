# ShelfWise Storefront System Analysis

**Date:** January 22, 2026
**Scope:** Complete backend and frontend storefront analysis

---

## Executive Summary

The ShelfWise storefront is a well-architected multi-tenant e-commerce system built with Laravel (backend) and
React/Inertia (frontend). It features:

- **Separate customer authentication** from staff (dual auth guards)
- **Polymorphic cart/order system** supporting both products and services
- **Multiple payment gateways** (Paystack, Cash on Delivery, Bank Transfer)
- **Customer credit system** with full audit trail
- **Server-driven cart** with no client-side state sync issues
- **Mobile-first responsive design** with dark mode support

| Metric                 | Count          |
|------------------------|----------------|
| Storefront Controllers | 5              |
| Storefront Services    | 4              |
| Frontend Pages         | 14             |
| Storefront Components  | 10             |
| TypeScript Types       | 45+ interfaces |
| Routes                 | 30+            |

---

## 1. Backend Architecture

### 1.1 Controllers

| Controller                   | Purpose                  | Key Actions                                                 |
|------------------------------|--------------------------|-------------------------------------------------------------|
| **StorefrontController**     | Product/service browsing | index, products, show, services, showService                |
| **CustomerAuthController**   | Customer authentication  | login, register, logout, password reset, email verification |
| **CartController**           | Shopping cart management | index, store, storeService, update, destroy                 |
| **CheckoutController**       | Order processing         | index, process, success, paymentCallback, paymentWebhook    |
| **CustomerPortalController** | Account management       | dashboard, orders, orderDetail, profile, updateProfile      |

### 1.2 Authentication Architecture

**Dual Guard System:**

```
Staff Authentication          Customer Authentication
├── Guard: 'web'              ├── Guard: 'customer'
├── Provider: 'users'         ├── Provider: 'customers'
├── Model: User               ├── Model: Customer
├── Password: password_reset  └── Password: customer_password_reset
└── Roles: 8-level hierarchy      └── No role system (simple customer)
```

**Key Differences:**
| Aspect | Staff (User) | Customer |
|--------|--------------|----------|
| Email Verification | Optional | Required (MustVerifyEmail) |
| Role System | 8-level hierarchy | None |
| Credit Management | No | Yes (account_balance, credit_limit) |
| Preferred Shop | No | Yes (preferred_shop_id) |

### 1.3 Route Structure

```
/store/{shop:slug}/
├── (Public)
│   ├── GET /                     → Home
│   ├── GET /products             → Product listing
│   ├── GET /products/{slug}      → Product detail
│   ├── GET /services             → Service listing
│   ├── GET /services/{slug}      → Service detail
│   ├── GET /cart                 → View cart
│   ├── POST /cart                → Add product to cart
│   └── POST /cart/service        → Add service to cart
│
├── (Guest Only - guest:customer)
│   ├── GET /login                → Login form
│   ├── POST /login               → Login (throttle: 5/min)
│   ├── GET /register             → Register form
│   └── POST /register            → Register (throttle: 3/min)
│
├── (Authenticated - auth:customer)
│   ├── GET /checkout             → Checkout page
│   ├── POST /checkout            → Process order
│   ├── GET /checkout/success     → Order confirmation
│   ├── GET /account              → Dashboard
│   ├── GET /account/orders       → Order history
│   └── PATCH /account/profile    → Update profile
│
└── (Payment - Public)
    ├── GET /payment/callback     → Paystack redirect
    └── POST /payment/webhook     → Paystack webhook
```

### 1.4 Services

| Service                   | Purpose                                                        |
|---------------------------|----------------------------------------------------------------|
| **StorefrontService**     | Cached data retrieval (30-60 min TTL), product/service queries |
| **CartService**           | Cart CRUD, guest-to-customer cart merging, summary calculation |
| **CheckoutService**       | Order creation with stock locking, payment processing          |
| **CustomerCreditService** | Credit charging, payment recording, oldest-first allocation    |

### 1.5 Data Models

**Customer Model:**

```php
Customer extends Authenticatable implements MustVerifyEmail
├── tenant_id, preferred_shop_id
├── first_name, last_name, email, phone, password
├── account_balance, credit_limit, total_purchases
├── is_active, marketing_opt_in
├── email_verified_at, last_purchase_at
└── Relationships: addresses, orders, carts, creditTransactions
```

**Cart System (Polymorphic):**

```
Cart (supports guest via session_id OR customer via customer_id)
└── CartItem (polymorphic sellable)
    ├── ProductVariant (with packaging_type)
    └── ServiceVariant (with material_option, selected_addons)
```

**Order System:**

```
Order (OrderType::CUSTOMER for storefront)
├── order_number (ORD-YYYYMMDD-XXXX)
├── offline_id (idempotency key)
├── status, payment_status, payment_method
├── shipping_address, billing_address (JSON)
└── OrderItem (polymorphic sellable) → OrderPayment
```

---

## 2. Frontend Architecture

### 2.1 Page Structure

| Page                      | Purpose            | Key Features                                                     |
|---------------------------|--------------------|------------------------------------------------------------------|
| **Home.tsx**              | Landing page       | Hero, featured products/services, category cards, business hours |
| **Products.tsx**          | Product listing    | Filter sidebar, search, pagination, responsive grid              |
| **ProductDetail.tsx**     | Product page       | Variant selector, packaging, quantity, related products          |
| **Services.tsx**          | Service listing    | Same pattern as Products                                         |
| **ServiceDetail.tsx**     | Service page       | Variant, material options, addons, dynamic pricing               |
| **Cart.tsx**              | Shopping cart      | Debounced quantity updates, item removal, sticky summary         |
| **Checkout.tsx**          | Checkout           | Address forms, payment selection, Paystack inline                |
| **CheckoutSuccess.tsx**   | Confirmation       | Order summary, payment status, animations                        |
| **Account/Dashboard.tsx** | Customer dashboard | Stats, recent orders                                             |
| **Account/Orders.tsx**    | Order history      | Paginated, status badges                                         |
| **Account/Profile.tsx**   | Profile management | Update name, phone, marketing opt-in                             |

### 2.2 Component Library

| Component            | Purpose                           | Reusability |
|----------------------|-----------------------------------|-------------|
| **AddToCartButton**  | Add to cart with stock validation | High        |
| **ProductCard**      | Product listing card              | High        |
| **ServiceCard**      | Service listing card              | High        |
| **QuantitySelector** | +/- number input                  | High        |
| **PriceDisplay**     | Formatted currency                | High        |
| **OrderSummary**     | Cart/order totals                 | High        |
| **Breadcrumbs**      | Navigation trail                  | High        |
| **AddressForm**      | Address input fields              | High        |
| **ProductFilter**    | Category/search filter            | Medium      |
| **ServiceFilter**    | Service category filter           | Medium      |

### 2.3 State Management

**Server-Driven Architecture:**

- No client-side cart state (Redux, Zustand, etc.)
- Cart data comes from server via Inertia props
- Form submissions update server, page reloads with new data
- Debounced quantity updates (800ms) prevent API thrashing

**Local State Usage:**

```typescript
ProductDetail: selectedVariantId, quantity, selectedPackagingId
ServiceDetail: selectedVariantId, materialOption, selectedAddons, computed
prices
Cart: updatingItem(
for loading state
),
updateTimeoutRef(debounce)
Checkout: billingSameAsShipping, saveAddresses, selectedPaymentMethod
```

### 2.4 TypeScript Types

**Key Interfaces (storefront.ts):**

```typescript
Cart, CartItem, CartSummary
Order, OrderItem
CustomerAddress
StorefrontHomeProps, StorefrontProductsProps, CheckoutProps
AddToCartData, UpdateCartItemData
ProductSortOption, ServiceSortOption
```

**Polymorphic Support:**

```typescript
SellableType = 'App\\Models\\ProductVariant' | 'App\\Models\\ServiceVariant'
Sellable = ProductVariant | ServiceVariant
```

---

## 3. Checkout & Payment System

### 3.1 Checkout Flow

```
1. Customer views cart → validates stock availability
2. Customer enters shipping/billing addresses
3. Customer selects payment method
4. Order created in DB transaction with stock locking
5. Stock deducted via StockMovementService
6. Cart cleared
7. Payment processed (online) or redirect to success (COD)
```

### 3.2 Stock Protection

**Two-Stage Validation:**

1. **Pre-checkout** - Quick availability check
2. **At order creation** - Pessimistic row-level locking (`lockForUpdate()`)

**Idempotency:**

- `offline_id` field prevents duplicate orders
- Checked before order creation

### 3.3 Payment Gateways

| Gateway              | Status     | Features                          |
|----------------------|------------|-----------------------------------|
| **Paystack**         | Active     | Inline payment, webhooks, refunds |
| **Cash on Delivery** | Active     | No processing required            |
| **Bank Transfer**    | Active     | Manual verification               |
| OPay                 | Registered | Not fully implemented             |
| Flutterwave          | Registered | Not fully implemented             |

**Webhook Security:**

```php
hash_hmac('sha512', $payload, $webhookSecret) === $signature
```

### 3.4 Customer Credit System

**Features:**

- Credit limit per customer
- Automatic oldest-order payment allocation
- Full audit trail via CustomerCreditTransaction
- Available credit = credit_limit - account_balance

---

## 4. Security & Multi-Tenancy

### 4.1 Tenant Isolation

✅ All queries filter by `tenant_id` AND `shop_id`
✅ Customer creation scoped to shop's tenant
✅ Email uniqueness enforced per tenant
✅ Cart/inventory scoped to shop
✅ Order ownership validated before access

### 4.2 Authentication Security

✅ Session regeneration on login (prevents fixation)
✅ Rate limiting on auth endpoints (5/min login, 3/min register)
✅ Signed URLs for email verification
✅ Separate password reset tables

### 4.3 Payment Security

✅ HMAC webhook signature validation
✅ UUID payment references
✅ Gateway credentials in .env
✅ Tenant ownership checks on payment endpoints

---

## 5. Caching Strategy

| Data              | TTL    | Key Pattern                                          |
|-------------------|--------|------------------------------------------------------|
| Featured Products | 30 min | `tenant:{id}:shop:{id}:storefront:featured_products` |
| Product by Slug   | 30 min | `tenant:{id}:shop:{id}:storefront:product:{slug}`    |
| Related Products  | 30 min | `tenant:{id}:shop:{id}:storefront:related:{id}`      |
| Categories        | 60 min | `tenant:{id}:shop:{id}:storefront:categories`        |
| Cart              | 10 min | Session/customer-based                               |

**Invalidation Methods:**

- `invalidateProductCache()`
- `invalidateServiceCache()`
- `invalidateAllCache()`

---

## 6. Identified Issues & Observations

### 6.1 Potential Issues

| Severity  | Issue                                         | Location              |
|-----------|-----------------------------------------------|-----------------------|
| 🟡 Medium | No optimistic updates - forms wait for server | All forms             |
| 🟡 Medium | No local cart fallback for offline            | Cart system           |
| 🟡 Medium | Limited error handling in components          | Frontend pages        |
| 🟡 Medium | No loading skeletons                          | Product/Service grids |
| 🔵 Low    | CartItem.subtotal should be required          | storefront.ts         |
| 🔵 Low    | metadata on OrderItem loosely typed           | storefront.ts         |
| 🔵 Low    | No cart persistence for abandoned carts       | Cart system           |

### 6.2 Strengths

✅ Server-driven cart eliminates sync issues
✅ Strong TypeScript with polymorphic types
✅ Excellent dark mode support
✅ Mobile-first responsive design
✅ Framer Motion animations throughout
✅ Type-safe routing via Wayfinder
✅ Complete audit trail for stock and credit
✅ Clean separation of customer/staff auth
✅ Comprehensive payment gateway architecture

### 6.3 Architecture Highlights

1. **Polymorphic Sellables** - Products and services share cart/order infrastructure
2. **Dual Tenant Fields** - Customer belongs to tenant, shops belong to tenant
3. **Guest Cart Merging** - Seamless login experience
4. **Stock Movement Audit** - All inventory changes tracked
5. **Payment Strategy Pattern** - Easy to add new gateways

---

## 7. Database Schema Summary

**Key Tables:**

```
customers              → Customer accounts (separate from users)
customer_addresses     → Shipping/billing addresses
customer_credit_transactions → Credit audit trail
carts                  → Shopping carts (guest or customer)
cart_items             → Cart line items (polymorphic)
orders                 → All order types (POS, customer, purchase)
order_items            → Order line items (polymorphic)
order_payments         → Payment records per order
```

**Key Indexes:**

- `customers`: (tenant_id, email)
- `orders`: (tenant_id, shop_id), (tenant_id, status)
- `carts`: (customer_id, shop_id), (session_id, shop_id)

---

## 8. Recommendations

### Priority 1: Quick Wins

1. Add loading skeletons for better perceived performance
2. Make `CartItem.subtotal` required in TypeScript
3. Add explicit typing for OrderItem metadata

### Priority 2: UX Improvements

1. Implement optimistic updates for cart operations
2. Add abandoned cart recovery (email reminder)
3. Improve error handling with toast notifications

### Priority 3: Future Enhancements

1. Implement remaining payment gateways (OPay, Flutterwave)
2. Add product reviews/ratings
3. Implement wishlist functionality
4. Add real-time stock updates via WebSockets

---

**Report Generated:** January 22, 2026
**Analysis Method:** 5 parallel exploration agents
