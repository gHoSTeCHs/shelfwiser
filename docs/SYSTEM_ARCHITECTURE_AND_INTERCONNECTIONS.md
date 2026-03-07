# ShelfWise System Architecture & Subsystem Interconnections

**Last Verification:** January 15, 2026

> **✓ VERIFIED ACCURATE** - This document was verified against the actual codebase on January 15, 2026.
> Minor corrections applied:
> - PayRun statuses updated to include PENDING_APPROVAL and COMPLETED (was DRAFT/APPROVED/PAID)
> - Stock is tracked via InventoryLocation model (multi-location support)

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Core Domain Model](#core-domain-model)
3. [Subsystem Dependency Map](#subsystem-dependency-map)
4. [Detailed Subsystem Interconnections](#detailed-subsystem-interconnections)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SHELFWISE PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         PRESENTATION LAYER                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │    │
│  │  │  Admin Panel │  │  Staff Portal│  │  Storefront  │  │  POS App    │  │    │
│  │  │  (Super)     │  │  (Tenants)   │  │  (Customers) │  │  (Offline)  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                              Inertia.js + React                                  │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         APPLICATION LAYER                                │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │  │                      CONTROLLERS (Thin)                          │    │    │
│  │  │   Auth │ POS │ Orders │ Products │ Payroll │ Storefront │ Admin  │    │    │
│  │  └─────────────────────────────────────────────────────────────────┘    │    │
│  │                                  │                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │  │                      SERVICES (Business Logic)                   │    │    │
│  │  │   POSService │ OrderService │ PayrollService │ StockMovement...  │    │    │
│  │  └─────────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           DOMAIN LAYER                                   │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │    │
│  │  │  Tenant   │ │  Product  │ │   Order   │ │  Payroll  │ │  Customer │  │    │
│  │  │  Models   │ │  Models   │ │  Models   │ │  Models   │ │  Models   │  │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        INFRASTRUCTURE LAYER                              │    │
│  │   Database │ Payment Gateways │ File Storage │ Queue │ Cache │ Events   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Domain Model

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            MULTI-TENANCY FOUNDATION                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────┐
                                    │  TENANT  │
                                    │──────────│
                                    │ id       │
                                    │ name     │
                                    │ status   │
                                    └────┬─────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
        ┌──────────┐              ┌──────────┐              ┌──────────────┐
        │   SHOP   │              │   USER   │              │   CUSTOMER   │
        │──────────│              │──────────│              │──────────────│
        │ id       │◄─────────────│ shop_id  │              │ id           │
        │ tenant_id│              │ tenant_id│              │ tenant_id    │
        │ name     │              │ role     │              │ credit_limit │
        │ type     │              │ email    │              │ email        │
        └────┬─────┘              └──────────┘              └──────┬───────┘
             │                                                     │
             │                                                     │
    ┌────────┴────────┬────────────────────┐                      │
    │                 │                    │                      │
    ▼                 ▼                    ▼                      │
┌─────────┐    ┌───────────┐    ┌──────────────────┐              │
│ PRODUCT │    │  SERVICE  │    │ INVENTORY        │              │
│─────────│    │───────────│    │ LOCATION         │              │
│ shop_id │    │ shop_id   │    │──────────────────│              │
│ name    │    │ name      │    │ shop_id          │              │
└────┬────┘    └─────┬─────┘    └──────────────────┘              │
     │               │                    │                       │
     ▼               │                    │                       │
┌─────────────┐      │                    │                       │
│ PRODUCT     │      │                    │                       │
│ VARIANT     │◄─────┴────────────────────┘                       │
│─────────────│                                                   │
│ product_id  │                                                   │
│ sku         │                                                   │
│ price       │                                                   │
│ stock_qty   │                                                   │
└──────┬──────┘                                                   │
       │                                                          │
       │              ┌───────────────────────────────────────────┘
       │              │
       ▼              ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│         ORDER           │         │     ORDER PAYMENT       │
│─────────────────────────│         │─────────────────────────│
│ id                      │◄───────►│ order_id                │
│ shop_id                 │         │ amount                  │
│ customer_id (nullable)  │         │ payment_method          │
│ user_id (staff)         │         │ status                  │
│ type (POS/STOREFRONT)   │         └─────────────────────────┘
│ status                  │
│ total                   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│       ORDER ITEM        │         │     STOCK MOVEMENT      │
│─────────────────────────│         │─────────────────────────│
│ order_id                │────────►│ variant_id              │
│ variant_id              │         │ quantity                │
│ quantity                │         │ type (SALE/ADJUSTMENT)  │
│ price                   │         │ reference_type          │
│ discount                │         │ reference_id            │
└─────────────────────────┘         └─────────────────────────┘
```

### Payroll Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PAYROLL DOMAIN                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                    ┌──────────────────┐
    │   USER   │───────────────────►│ EMPLOYEE_PAYROLL │
    │ (Staff)  │                    │     _DETAIL      │
    └──────────┘                    │──────────────────│
         │                          │ user_id          │
         │                          │ pay_type         │
         │                          │ base_salary      │
         │                          │ bank_details     │
         │                          └────────┬─────────┘
         │                                   │
    ┌────┴─────┐                   ┌─────────┴─────────┐
    │          │                   │                   │
    ▼          ▼                   ▼                   ▼
┌────────┐ ┌──────────┐    ┌────────────┐    ┌────────────────┐
│TIMESHEET│ │WAGE      │    │ EMPLOYEE   │    │   EMPLOYEE     │
│────────│ │ADVANCE   │    │  EARNING   │    │   DEDUCTION    │
│user_id │ │──────────│    │────────────│    │────────────────│
│hours   │ │user_id   │    │user_id     │    │ user_id        │
│status  │ │amount    │    │earning_type│    │ deduction_type │
└────────┘ │status    │    │amount      │    │ amount         │
           └──────────┘    └────────────┘    └────────────────┘
                                   │                   │
                                   └─────────┬─────────┘
                                             │
                                             ▼
                           ┌─────────────────────────────┐
                           │          PAY RUN            │
                           │─────────────────────────────│
                           │ tenant_id                   │
                           │ pay_calendar_id             │
                           │ period_start / period_end   │
                           │ status (DRAFT/PENDING_APPROVAL/APPROVED/COMPLETED)│
                           └──────────────┬──────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────┐
                           │       PAY RUN ITEM          │
                           │─────────────────────────────│
                           │ pay_run_id                  │
                           │ user_id                     │
                           │ gross_pay                   │
                           │ net_pay                     │
                           │ tax_amount                  │
                           │ deductions_json             │
                           └──────────────┬──────────────┘
                                          │
                                          ▼
                           ┌─────────────────────────────┐
                           │         PAYSLIP             │
                           │─────────────────────────────│
                           │ pay_run_item_id             │
                           │ user_id                     │
                           │ pdf_path                    │
                           └─────────────────────────────┘
```

---

## Subsystem Dependency Map

### Primary Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SUBSYSTEM DEPENDENCY GRAPH                               │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │  MULTI-TENANCY   │
                              │    (Foundation)  │
                              └────────┬─────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
   ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
   │ AUTHENTICATION│          │     SHOP      │          │   CUSTOMER    │
   │ (Staff/Admin) │          │  MANAGEMENT   │          │  MANAGEMENT   │
   └───────┬───────┘          └───────┬───────┘          └───────┬───────┘
           │                          │                          │
           │         ┌────────────────┼────────────────┐         │
           │         │                │                │         │
           │         ▼                ▼                ▼         │
           │  ┌───────────┐    ┌───────────┐    ┌───────────┐    │
           │  │  PRODUCT  │    │  SERVICE  │    │ INVENTORY │    │
           │  │MANAGEMENT │    │MANAGEMENT │    │  CONTROL  │    │
           │  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘    │
           │        │                │                │          │
           │        └────────────────┼────────────────┘          │
           │                         │                           │
           │         ┌───────────────┼───────────────┐           │
           │         │               │               │           │
           │         ▼               ▼               ▼           │
           │   ┌──────────┐   ┌───────────┐   ┌───────────┐      │
           │   │   POS    │   │STOREFRONT │   │  ORDERS   │◄─────┘
           │   │  SYSTEM  │   │E-COMMERCE │   │MANAGEMENT │
           │   └────┬─────┘   └─────┬─────┘   └─────┬─────┘
           │        │               │               │
           │        └───────────────┼───────────────┘
           │                        │
           │                        ▼
           │              ┌───────────────────┐
           │              │     PAYMENTS      │
           │              │   (Gateways)      │
           │              └─────────┬─────────┘
           │                        │
           │         ┌──────────────┼──────────────┐
           │         │              │              │
           │         ▼              ▼              ▼
           │  ┌───────────┐  ┌───────────┐  ┌───────────┐
           │  │ RECEIPTS  │  │ CUSTOMER  │  │ REPORTING │
           │  │           │  │  CREDIT   │  │& ANALYTICS│
           │  └───────────┘  └───────────┘  └───────────┘
           │
           │
           ▼
   ┌───────────────────────────────────────────────────────────────┐
   │                    STAFF/HR SUBSYSTEMS                         │
   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐  │
   │  │    STAFF      │  │  TIMESHEETS   │  │   FUND REQUESTS   │  │
   │  │  MANAGEMENT   │──│  & ATTENDANCE │──│  & WAGE ADVANCES  │  │
   │  └───────┬───────┘  └───────┬───────┘  └─────────┬─────────┘  │
   │          │                  │                    │            │
   │          └──────────────────┼────────────────────┘            │
   │                             │                                 │
   │                             ▼                                 │
   │                    ┌───────────────────┐                      │
   │                    │     PAYROLL       │                      │
   │                    │    MANAGEMENT     │                      │
   │                    └─────────┬─────────┘                      │
   │                              │                                │
   │              ┌───────────────┼───────────────┐                │
   │              ▼               ▼               ▼                │
   │       ┌───────────┐   ┌───────────┐   ┌───────────┐          │
   │       │    TAX    │   │ EARNINGS  │   │DEDUCTIONS │          │
   │       │CALCULATION│   │MANAGEMENT │   │MANAGEMENT │          │
   │       └───────────┘   └───────────┘   └───────────┘          │
   └───────────────────────────────────────────────────────────────┘

                              ┌───────────────┐
                              │   SUPPLIER    │
                              │  MANAGEMENT   │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   PURCHASE    │
                              │    ORDERS     │
                              └───────────────┘
```

---

## Detailed Subsystem Interconnections

### 1. Sales Channel Integration (POS ↔ Storefront ↔ Orders)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SALES CHANNEL DATA FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────────┐                          ┌─────────────────┐
     │   POS SYSTEM    │                          │   STOREFRONT    │
     │─────────────────│                          │─────────────────│
     │ POSController   │                          │CartController   │
     │ POSService      │                          │CheckoutController│
     │ HeldSaleService │                          │CartService      │
     └────────┬────────┘                          └────────┬────────┘
              │                                            │
              │  Creates Order                             │  Creates Order
              │  type='pos'                                │  type='storefront'
              │                                            │
              └──────────────────┬─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      ORDER SERVICE      │
                    │─────────────────────────│
                    │ • createOrder()         │
                    │ • calculateTotals()     │
                    │ • applyDiscounts()      │
                    │ • validateStock()       │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐
    │    ORDER      │  │  ORDER ITEMS  │  │ STOCK MOVEMENT    │
    │    Model      │  │    Model      │  │    SERVICE        │
    │───────────────│  │───────────────│  │───────────────────│
    │ Persists      │  │ Line items    │  │ Deducts stock     │
    │ order data    │  │ with pricing  │  │ Creates audit log │
    └───────────────┘  └───────────────┘  └───────────────────┘
                                                   │
                                                   ▼
                                         ┌───────────────────┐
                                         │  PRODUCT VARIANT  │
                                         │───────────────────│
                                         │ stock_quantity    │
                                         │ updated           │
                                         └───────────────────┘
```

**Implementation Details:**

| Component | File Location | Responsibility |
|-----------|--------------|----------------|
| POSController | `app/Http/Controllers/POSController.php` | Handles POS UI, product search, customer lookup |
| POSService | `app/Services/POSService.php` | Business logic for POS transactions |
| CartService | `app/Services/CartService.php` | Shopping cart management for storefront |
| OrderService | `app/Services/OrderService.php` | Unified order creation and management |
| StockMovementService | `app/Services/StockMovementService.php` | All stock changes with audit trail |

**Data Flow:**
1. **POS Sale**: User scans products → POSService validates → OrderService creates order → StockMovementService deducts stock
2. **Storefront Sale**: Customer adds to cart → CartService manages → CheckoutService processes → OrderService creates order → StockMovementService deducts stock

---

### 2. Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT PROCESSING FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
     │     POS      │      │  STOREFRONT  │      │   CUSTOMER   │
     │   Payment    │      │   Checkout   │      │Credit Payment│
     └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   PAYMENT CONTROLLER    │
                    │─────────────────────────│
                    │ • initiatePayment()     │
                    │ • verifyPayment()       │
                    │ • handleCallback()      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  PAYMENT GATEWAY        │
                    │      MANAGER            │
                    │─────────────────────────│
                    │ • resolveGateway()      │
                    │ • processPayment()      │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FLUTTERWAVE    │    │    PAYSTACK     │    │      OPAY       │
│    GATEWAY      │    │    GATEWAY      │    │    GATEWAY      │
│─────────────────│    │─────────────────│    │─────────────────│
│ API Integration │    │ API Integration │    │ API Integration │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   WEBHOOK CONTROLLER    │
                    │─────────────────────────│
                    │ • handleWebhook()       │
                    │ • verifySignature()     │
                    │ • updatePaymentStatus() │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    ORDER PAYMENT        │
                    │       MODEL             │
                    │─────────────────────────│
                    │ status updated          │
                    │ transaction_ref stored  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌───────────────┐         ┌───────────────────┐
          │    ORDER      │         │ CUSTOMER CREDIT   │
          │ status='paid' │         │   TRANSACTION     │
          └───────────────┘         │ (if credit used)  │
                                    └───────────────────┘
```

**Payment Methods Supported:**

| Method | Implementation | Use Case |
|--------|---------------|----------|
| Cash | Direct recording | POS only |
| Card (Flutterwave) | `FlutterwaveGateway.php` | Online/POS |
| Card (Paystack) | `PaystackGateway.php` | Online/POS |
| Opay | `OpayGateway.php` | Mobile payments |
| Crypto | `CryptoGateway.php` | Alternative payment |
| Customer Credit | `CustomerCreditService.php` | B2B credit accounts |

---

### 3. Inventory Management Chain

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      INVENTORY MANAGEMENT CHAIN                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

                         STOCK INFLOW
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│  PURCHASE   │       │   MANUAL    │       │    RETURN       │
│   ORDER     │       │ ADJUSTMENT  │       │  PROCESSING     │
│ RECEIVING   │       │             │       │                 │
└──────┬──────┘       └──────┬──────┘       └────────┬────────┘
       │                     │                       │
       └─────────────────────┼───────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   STOCK MOVEMENT         │
              │       SERVICE            │
              │──────────────────────────│
              │ • adjustStock()          │
              │ • transferStock()        │
              │ • recordMovement()       │
              │ • validateQuantity()     │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │     STOCK MOVEMENT       │
              │        MODEL             │
              │──────────────────────────│
              │ • type (enum)            │
              │ • quantity (+/-)         │
              │ • reference_type         │
              │ • reference_id           │
              │ • location_id            │
              │ • performed_by           │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │    PRODUCT VARIANT       │
              │──────────────────────────│
              │ stock_quantity updated   │
              └────────────┬─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────────┐   ┌─────────────┐
│  REORDER    │   │   STOCK TAKE    │   │   REPORTS   │
│   ALERTS    │   │   VALIDATION    │   │  ANALYTICS  │
│─────────────│   │─────────────────│   │─────────────│
│ Triggered   │   │ Variance check  │   │ Stock value │
│ when low    │   │ Discrepancy     │   │ Turnover    │
└─────────────┘   └─────────────────┘   └─────────────┘

                         STOCK OUTFLOW
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│  POS SALE   │       │ STOREFRONT  │       │    WASTAGE/     │
│             │       │    SALE     │       │   WRITE-OFF     │
└─────────────┘       └─────────────┘       └─────────────────┘
```

**Stock Movement Types:**

| Type | Trigger | Effect |
|------|---------|--------|
| `SALE` | Order completion | Decreases stock |
| `PURCHASE` | PO receiving | Increases stock |
| `ADJUSTMENT` | Manual correction | +/- stock |
| `TRANSFER` | Location transfer | Moves between locations |
| `RETURN` | Customer return | Increases stock |
| `WASTAGE` | Damaged/expired | Decreases stock |

---

### 4. Payroll Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       PAYROLL PROCESSING PIPELINE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

          INPUT SOURCES
               │
    ┌──────────┼──────────┬──────────────────┐
    │          │          │                  │
    ▼          ▼          ▼                  ▼
┌────────┐ ┌────────┐ ┌──────────┐    ┌─────────────┐
│TIMESHEET│ │ WAGE   │ │ FUND     │    │  EMPLOYEE   │
│ HOURS  │ │ADVANCES│ │REQUESTS  │    │  SETTINGS   │
└────┬───┘ └───┬────┘ └────┬─────┘    │─────────────│
     │         │           │          │• Base Salary│
     │         │           │          │• Pay Type   │
     │         │           │          │• Bank Info  │
     └─────────┼───────────┘          └──────┬──────┘
               │                             │
               ▼                             │
    ┌─────────────────────┐                  │
    │   APPROVAL CHAINS   │                  │
    │─────────────────────│                  │
    │ Multi-level review  │                  │
    │ Status tracking     │                  │
    └──────────┬──────────┘                  │
               │                             │
               └──────────────┬──────────────┘
                              │
                              ▼
               ┌──────────────────────────┐
               │      PAY RUN SERVICE     │
               │──────────────────────────│
               │ • createPayRun()         │
               │ • calculateGross()       │
               │ • processDeductions()    │
               │ • calculateTax()         │
               │ • generatePayRunItems()  │
               └────────────┬─────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   EARNINGS      │ │   DEDUCTIONS    │ │ TAX CALCULATION │
│    SERVICE      │ │    SERVICE      │ │    SERVICE      │
│─────────────────│ │─────────────────│ │─────────────────│
│ • Allowances    │ │ • Pension       │ │ • PAYE          │
│ • Bonuses       │ │ • Loan repay    │ │ • Tax bands     │
│ • Overtime      │ │ • Advance repay │ │ • Reliefs       │
│ • Commissions   │ │ • Custom deduc. │ │ • Thresholds    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
               ┌──────────────────────────┐
               │       PAY RUN ITEM       │
               │──────────────────────────│
               │ • gross_pay              │
               │ • total_deductions       │
               │ • tax_amount             │
               │ • net_pay                │
               │ • earnings_breakdown     │
               │ • deductions_breakdown   │
               └────────────┬─────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌────────────┐ ┌────────────┐ ┌────────────────┐
      │  PAYSLIP   │ │   BANK     │ │   STATUTORY    │
      │    PDF     │ │  SCHEDULE  │ │    REPORTS     │
      │────────────│ │────────────│ │────────────────│
      │ Employee   │ │ Payment    │ │ • PAYE returns │
      │ pay record │ │ file for   │ │ • Pension      │
      │            │ │ bulk trans │ │ • Tax summary  │
      └────────────┘ └────────────┘ └────────────────┘
```

**Payroll Calculation Order:**
1. Fetch employee payroll details (base salary, pay type)
2. Calculate earnings (allowances, bonuses, overtime)
3. Calculate gross pay = base + earnings
4. Calculate statutory deductions (pension, NHF)
5. Calculate taxable income
6. Apply tax bands and reliefs
7. Calculate custom deductions (loans, advances)
8. Net pay = gross - all deductions

---

### 5. Supplier & Purchase Order Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SUPPLIER & PURCHASE ORDER FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐                    ┌───────────────────┐
│  SUPPLIER TENANT  │                    │   BUYER TENANT    │
│───────────────────│                    │───────────────────│
│ Creates profile   │                    │ Browses suppliers │
│ Manages catalog   │                    │ Sends connection  │
└─────────┬─────────┘                    └─────────┬─────────┘
          │                                        │
          │    ┌─────────────────────────┐         │
          └───►│  SUPPLIER CONNECTION    │◄────────┘
               │─────────────────────────│
               │ • status (pending/      │
               │   approved/rejected)    │
               │ • pricing_tier_id       │
               │ • credit_terms          │
               └───────────┬─────────────┘
                           │
                           │ When Approved
                           ▼
               ┌─────────────────────────┐
               │  CATALOG ACCESS         │
               │─────────────────────────│
               │ Buyer can view          │
               │ supplier products       │
               │ at negotiated prices    │
               └───────────┬─────────────┘
                           │
                           ▼
               ┌─────────────────────────┐
               │   PURCHASE ORDER        │
               │      SERVICE            │
               │─────────────────────────│
               │ • createPurchaseOrder() │
               │ • submitToSupplier()    │
               │ • receiveGoods()        │
               │ • recordPayment()       │
               └───────────┬─────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PURCHASE   │    │ PURCHASE ORDER  │    │ PURCHASE ORDER  │
│   ORDER     │    │     ITEMS       │    │    PAYMENT      │
│─────────────│    │─────────────────│    │─────────────────│
│ status      │    │ variant_id      │    │ amount          │
│ total       │    │ quantity        │    │ payment_date    │
│ supplier_id │    │ unit_price      │    │ reference       │
└──────┬──────┘    └─────────────────┘    └─────────────────┘
       │
       │ On Receive
       ▼
┌─────────────────────────┐
│  STOCK MOVEMENT         │
│      SERVICE            │
│─────────────────────────│
│ Creates PURCHASE type   │
│ movement records        │
│ Updates variant stock   │
└─────────────────────────┘
```

---

### 6. Customer & Credit System Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     CUSTOMER & CREDIT SYSTEM                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────┐
                    │     CUSTOMER      │
                    │───────────────────│
                    │ tenant_id         │
                    │ name, email       │
                    │ credit_limit      │
                    │ current_balance   │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    CUSTOMER     │  │     ORDERS      │  │    CUSTOMER     │
│    ADDRESS      │  │  (with credit)  │  │    CREDIT       │
│─────────────────│  │─────────────────│  │  TRANSACTIONS   │
│ Shipping/billing│  │ payment_method  │  │─────────────────│
│ addresses       │  │ = 'credit'      │  │ type (charge/   │
└─────────────────┘  └────────┬────────┘  │      payment)   │
                              │           │ amount          │
                              │           │ balance_after   │
                              ▼           └────────┬────────┘
                    ┌───────────────────┐          │
                    │  CUSTOMER CREDIT  │          │
                    │     SERVICE       │◄─────────┘
                    │───────────────────│
                    │ • checkLimit()    │
                    │ • chargeCredit()  │
                    │ • recordPayment() │
                    │ • getStatement()  │
                    └───────────────────┘

CREDIT PURCHASE FLOW:
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌────────────────┐
│  Order  │───►│ Verify  │───►│   Charge    │───►│ Update Balance │
│ Created │    │ Limit   │    │   Credit    │    │ Create Txn     │
└─────────┘    └─────────┘    └─────────────┘    └────────────────┘

CREDIT PAYMENT FLOW:
┌─────────┐    ┌─────────────┐    ┌────────────────┐    ┌─────────────┐
│ Payment │───►│ Record      │───►│ Update Balance │───►│ Update Order│
│ Received│    │ Transaction │    │ Reduce Owing   │    │ Payment Sts │
└─────────┘    └─────────────┘    └────────────────┘    └─────────────┘
```

---

## Data Flow Diagrams

### Complete POS Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE POS TRANSACTION                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

 CASHIER                    SYSTEM                           DATABASE
    │                          │                                │
    │  1. Open POS             │                                │
    ├─────────────────────────►│                                │
    │                          │  Load products, customers      │
    │                          ├───────────────────────────────►│
    │                          │◄───────────────────────────────┤
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  2. Scan/Search Product  │                                │
    ├─────────────────────────►│                                │
    │                          │  Validate stock                │
    │                          ├───────────────────────────────►│
    │                          │◄───────────────────────────────┤
    │  Product added to cart   │                                │
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  3. [Optional] Hold Sale │                                │
    ├─────────────────────────►│                                │
    │                          │  Save to held_sales            │
    │                          ├───────────────────────────────►│
    │                          │◄───────────────────────────────┤
    │  Sale held               │                                │
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  4. Select Customer      │                                │
    ├─────────────────────────►│                                │
    │                          │  Load customer + credit info   │
    │                          ├───────────────────────────────►│
    │                          │◄───────────────────────────────┤
    │  Customer attached       │                                │
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  5. Complete Sale        │                                │
    ├─────────────────────────►│                                │
    │                          │                                │
    │                          │  ┌─────────────────────────┐   │
    │                          │  │ POSService.complete()   │   │
    │                          │  │ ├─ Validate cart        │   │
    │                          │  │ ├─ Check stock          │   │
    │                          │  │ ├─ Apply discounts      │   │
    │                          │  │ └─ Calculate totals     │   │
    │                          │  └─────────────────────────┘   │
    │                          │                                │
    │                          │  ┌─────────────────────────┐   │
    │                          │  │ OrderService.create()   │   │
    │                          │  │ ├─ Create Order         │──►│ orders
    │                          │  │ ├─ Create OrderItems    │──►│ order_items
    │                          │  │ └─ Create OrderPayment  │──►│ order_payments
    │                          │  └─────────────────────────┘   │
    │                          │                                │
    │                          │  ┌─────────────────────────┐   │
    │                          │  │ StockMovementService    │   │
    │                          │  │ ├─ Record movements     │──►│ stock_movements
    │                          │  │ └─ Update variant qty   │──►│ product_variants
    │                          │  └─────────────────────────┘   │
    │                          │                                │
    │                          │  ┌─────────────────────────┐   │
    │                          │  │ [If Credit Payment]     │   │
    │                          │  │ CustomerCreditService   │   │
    │                          │  │ └─ Create transaction   │──►│ customer_credit
    │                          │  └─────────────────────────┘   │    _transactions
    │                          │                                │
    │  Order Complete          │                                │
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  6. Print Receipt        │                                │
    ├─────────────────────────►│                                │
    │                          │  ReceiptService.generate()     │
    │                          ├───────────────────────────────►│ receipts
    │  Receipt printed/emailed │◄───────────────────────────────┤
    │  ◄───────────────────────┤                                │
    │                          │                                │
```

### Storefront Checkout Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STOREFRONT CHECKOUT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

 CUSTOMER                   SYSTEM                     PAYMENT GATEWAY
    │                          │                              │
    │  1. Add to Cart          │                              │
    ├─────────────────────────►│                              │
    │                          │  CartService.add()           │
    │                          │  - Validate product          │
    │                          │  - Check stock               │
    │                          │  - Update cart session       │
    │  Cart Updated            │                              │
    │  ◄───────────────────────┤                              │
    │                          │                              │
    │  2. Proceed to Checkout  │                              │
    ├─────────────────────────►│                              │
    │                          │  CheckoutService.prepare()   │
    │                          │  - Calculate totals          │
    │                          │  - Apply discounts/coupons   │
    │                          │  - Calculate tax             │
    │  Checkout page           │                              │
    │  ◄───────────────────────┤                              │
    │                          │                              │
    │  3. Submit Payment       │                              │
    ├─────────────────────────►│                              │
    │                          │  PaymentGatewayManager       │
    │                          │  - Select gateway            │
    │                          │  - Initialize payment        │
    │                          ├─────────────────────────────►│
    │                          │                              │
    │  ◄──────────────────────────────────────────────────────┤
    │       Redirect to payment page                          │
    │                          │                              │
    │  4. Complete Payment     │                              │
    ├─────────────────────────────────────────────────────────►│
    │                          │                              │
    │                          │  Webhook received            │
    │                          │◄─────────────────────────────┤
    │                          │                              │
    │                          │  PaymentWebhookController    │
    │                          │  - Verify signature          │
    │                          │  - Update OrderPayment       │
    │                          │  - Update Order status       │
    │                          │  - Trigger stock deduction   │
    │                          │                              │
    │  Order Confirmation      │                              │
    │  ◄───────────────────────┤                              │
    │                          │                              │
```

### Pay Run Processing Sequence

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PAY RUN PROCESSING SEQUENCE                              │
└─────────────────────────────────────────────────────────────────────────────────┘

 HR/PAYROLL                 SYSTEM                           SERVICES
    │                          │                                │
    │  1. Create Pay Run       │                                │
    ├─────────────────────────►│                                │
    │                          │  PayRunService.create()        │
    │                          │  - Set period dates            │
    │                          │  - Status = DRAFT              │
    │  Pay Run created         │                                │
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  2. Process Employees    │                                │
    ├─────────────────────────►│                                │
    │                          │                                │
    │                          │  FOR EACH eligible employee:   │
    │                          │  ┌────────────────────────────┐│
    │                          │  │                            ││
    │                          │  │  EarningsService           ││
    │                          │  │  ├─ Base salary            ││
    │                          │  │  ├─ Allowances             ││
    │                          │  │  ├─ Bonuses                ││
    │                          │  │  ├─ Overtime (timesheets)  ││
    │                          │  │  └─ Commission             ││
    │                          │  │         │                  ││
    │                          │  │         ▼                  ││
    │                          │  │  GROSS PAY                 ││
    │                          │  │         │                  ││
    │                          │  │         ▼                  ││
    │                          │  │  DeductionsService         ││
    │                          │  │  ├─ Pension (statutory)    ││
    │                          │  │  ├─ NHF                    ││
    │                          │  │  ├─ Loan repayments        ││
    │                          │  │  ├─ Wage advance repay     ││
    │                          │  │  └─ Custom deductions      ││
    │                          │  │         │                  ││
    │                          │  │         ▼                  ││
    │                          │  │  TaxCalculationService     ││
    │                          │  │  ├─ Calculate taxable      ││
    │                          │  │  ├─ Apply tax bands        ││
    │                          │  │  ├─ Apply reliefs          ││
    │                          │  │  └─ PAYE amount            ││
    │                          │  │         │                  ││
    │                          │  │         ▼                  ││
    │                          │  │  NET PAY = Gross           ││
    │                          │  │           - Deductions     ││
    │                          │  │           - Tax            ││
    │                          │  │         │                  ││
    │                          │  │         ▼                  ││
    │                          │  │  Create PayRunItem         ││
    │                          │  │                            ││
    │                          │  └────────────────────────────┘│
    │                          │                                │
    │  All items calculated    │                                │
    │  ◄───────────────────────┤                                │
    │                          │                                │
    │  3. Review & Approve     │                                │
    ├─────────────────────────►│                                │
    │                          │  Status = APPROVED             │
    │                          │                                │
    │  4. Process Payment      │                                │
    ├─────────────────────────►│                                │
    │                          │  PayRunService.complete()      │
    │                          │  - Status = COMPLETED          │
    │                          │  - Generate payslips           │
    │                          │  - Update wage advance repay   │
    │                          │                                │
    │  5. Generate Reports     │                                │
    ├─────────────────────────►│                                │
    │                          │  PayrollReportService          │
    │                          │  ├─ Bank schedule (NIBSS)      │
    │                          │  ├─ Tax returns                │
    │                          │  ├─ Pension schedule           │
    │                          │  └─ Summary reports            │
    │                          │                                │
    │  Reports ready           │                                │
    │  ◄───────────────────────┤                                │
```

---

## Cross-Cutting Concerns

### 1. Multi-Tenancy Enforcement

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANCY ENFORCEMENT                                │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────┐
                    │     EVERY DATABASE QUERY    │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │   WHERE tenant_id = ?       │
                    │   (Current user's tenant)   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
     │    MODELS       │  │    SERVICES     │  │    POLICIES     │
     │─────────────────│  │─────────────────│  │─────────────────│
     │ Global scopes   │  │ Explicit filter │  │ Authorization   │
     │ for tenant      │  │ in queries      │  │ checks tenant   │
     └─────────────────┘  └─────────────────┘  └─────────────────┘

IMPLEMENTATION PATTERN:
┌─────────────────────────────────────────────────────────────────┐
│  // In Service                                                   │
│  Product::where('tenant_id', auth()->user()->tenant_id)->get(); │
│                                                                  │
│  // In Policy                                                    │
│  return $user->tenant_id === $product->tenant_id;               │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Authorization Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHORIZATION HIERARCHY                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

   ROLE LEVEL          ACCESS SCOPE                    KEY PERMISSIONS
       │                    │                               │
       ▼                    ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Super Admin (999)  │ All Tenants        │ Platform management, all operations  │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ Owner (100)        │ Own Tenant         │ Full tenant control, billing, users  │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ General Mgr (80)   │ All Shops          │ All operations except billing        │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ Store Manager (60) │ Assigned Shop(s)   │ Shop operations, staff management    │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ Asst Manager (50)  │ Assigned Shop      │ Most operations, limited settings    │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ Sales Rep (40)     │ Sales only         │ POS, orders, customers               │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ Inventory (30)     │ Inventory only     │ Stock, products, receiving           │
├────────────────────┼────────────────────┼───────────────────────────────────────┤
│ Cashier (30)       │ POS only           │ POS transactions only                │
└────────────────────┴────────────────────┴───────────────────────────────────────┘

POLICY CHECK FLOW:
┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐
│ Request  │───►│ Controller │───►│ Gate::       │───►│  Policy    │
│          │    │            │    │ authorize()  │    │  Check     │
└──────────┘    └────────────┘    └──────────────┘    └────────────┘
                                                            │
                                         ┌──────────────────┼──────────────────┐
                                         │                  │                  │
                                         ▼                  ▼                  ▼
                                   ┌──────────┐      ┌──────────┐      ┌──────────┐
                                   │ Tenant   │      │  Role    │      │ Resource │
                                   │  Match   │      │  Level   │      │  Owner   │
                                   └──────────┘      └──────────┘      └──────────┘
```

### 3. Audit Trail System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AUDIT TRAIL SYSTEM                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

              AUDITED OPERATIONS
                     │
    ┌────────────────┼────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  STOCK  │    │  PAYROLL │    │ APPROVAL │    │  ORDER   │
│ CHANGES │    │ CHANGES  │    │ ACTIONS  │    │ CHANGES  │
└────┬────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │              │               │               │
     ▼              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT LOG TABLES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  stock_movements     │ payroll_audit_logs │ approval_requests │ order_history   │
│  ─────────────────   │ ──────────────────  │ ─────────────────  │ ─────────────  │
│  • variant_id        │ • user_id          │ • request_type    │ • order_id     │
│  • type              │ • action           │ • status          │ • action       │
│  • quantity          │ • old_values       │ • approved_by     │ • performed_by │
│  • performed_by      │ • new_values       │ • notes           │ • old_status   │
│  • reference_type    │ • timestamp        │ • timestamp       │ • new_status   │
│  • reference_id      │                    │                   │                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Offline Sync Architecture (POS)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         OFFLINE SYNC ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

     POS CLIENT (Browser)                          SERVER
           │                                          │
           │  ┌────────────────────────┐              │
           │  │    IndexedDB           │              │
           │  │ ┌──────────────────┐   │              │
           │  │ │ products_cache   │   │              │
           │  │ │ customers_cache  │   │              │
           │  │ │ pending_orders   │   │              │
           │  │ │ sync_queue       │   │              │
           │  │ └──────────────────┘   │              │
           │  └────────────────────────┘              │
           │              │                           │
           │              ▼                           │
           │  ┌────────────────────────┐              │
           │  │  useOfflinePOS Hook    │              │
           │  │ ┌──────────────────┐   │              │
           │  │ │ • isOnline       │   │              │
           │  │ │ • pendingCount   │   │              │
           │  │ │ • syncStatus     │   │              │
           │  │ └──────────────────┘   │              │
           │  └───────────┬────────────┘              │
           │              │                           │
           │              ▼                           │
           │  ┌────────────────────────┐              │
           │  │  Network Status        │              │
           │  └───────────┬────────────┘              │
           │              │                           │
    ┌──────┴──────────────┼───────────────────────────┴──────┐
    │                     │                                   │
    ▼                     ▼                                   ▼
┌─────────┐        ┌───────────────┐                  ┌─────────────┐
│ OFFLINE │        │    ONLINE     │                  │   SERVER    │
│  MODE   │        │     MODE      │                  │   SYNC      │
│─────────│        │───────────────│                  │─────────────│
│ • Save  │        │ • Sync queue  │─────────────────►│ SyncController
│   to IDB│        │ • Real-time   │                  │ • Process   │
│ • Queue │        │   processing  │◄─────────────────│   orders    │
│   orders│        │               │                  │ • Return    │
└─────────┘        └───────────────┘                  │   status    │
                                                      └─────────────┘

SYNC PROCESS:
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. Connection restored                                                           │
│ 2. Read pending_orders from IndexedDB                                           │
│ 3. POST each order to /api/sync/orders                                          │
│ 4. Server processes, returns order IDs                                          │
│ 5. Mark synced orders in IndexedDB                                              │
│ 6. Refresh products/customers cache                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Subsystem Interaction Matrix

| From \ To | Auth | Products | Inventory | Orders | Payments | Customers | Payroll | Suppliers |
|-----------|------|----------|-----------|--------|----------|-----------|---------|-----------|
| **Auth** | - | Read | Read | Read | Read | Read | Read | Read |
| **Products** | - | - | Updates | Referenced | - | - | - | Catalog |
| **Inventory** | - | Updates | - | Triggered | - | - | - | Receiving |
| **Orders** | - | Read | Triggers | - | Creates | Updates | - | - |
| **Payments** | - | - | - | Updates | - | Credits | - | Records |
| **Customers** | - | - | - | Owns | Makes | - | - | - |
| **Payroll** | Staff | - | - | - | - | - | - | - |
| **Suppliers** | - | Provides | Receives | - | - | - | - | - |

---

## Technology Implementation Reference

| Layer | Technology | Key Files |
|-------|-----------|-----------|
| Frontend | React 19, TypeScript | `resources/js/pages/` |
| Routing | Inertia.js 2.1 | `routes/web.php`, `routes/api.php` |
| Controllers | Laravel 12 | `app/Http/Controllers/` |
| Services | PHP 8.2+ | `app/Services/` |
| Models | Eloquent ORM | `app/Models/` |
| Database | SQLite/MySQL | `database/migrations/` |
| Queue | Laravel Queue | `app/Jobs/` |
| Events | Laravel Events | `app/Events/`, `app/Listeners/` |
| Payments | Gateway Pattern | `app/Services/Payment/` |

---

*Document generated: December 2024*
*ShelfWise Platform v1.0*