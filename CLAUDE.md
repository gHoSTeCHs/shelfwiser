# CLAUDE.md - ShelfWiser Development Guide

> **Version:** 1.3.0 | **Updated:** 2025-11-18
> **Project:** ShelfWiser - Multi-Tenant Inventory Management SaaS
> **Status:** Production-Ready

---

## 🎯 Project Overview

**ShelfWiser** is a feature-complete, multi-tenant SaaS for inventory management with:
- ✅ Multi-store operations with tenant isolation
- ✅ Product catalog (variants, packaging, dynamic schemas)
- ✅ Stock movements with full audit trails
- ✅ Order processing & lifecycle management
- ✅ **POS/Quick Sale system** (retail checkout)
- ✅ **Receipt generation** (PDF receipts, email delivery)
- ✅ **Customer credit/tab system** (credit management)
- ✅ **Supplier/procurement system** (B2B marketplace)
- ✅ **E-commerce frontend** (shopping cart, customer accounts)
- ✅ **Advanced reports** (sales, inventory, suppliers, financials)
- ✅ **Employee payroll** (salary management, deductions)
- ✅ **Super Admin system** (platform management)
- ✅ **Payment gateway integration** (Paystack, OPay, Flutterwave, Crypto)
- ✅ **PWA support** (offline mode, background sync)
- ✅ 8-level role hierarchy with permissions

**Current Architecture:** 35+ models • 25+ services • 12+ policies • 10+ enums • 55+ migrations

---

## 🏗️ Tech Stack

```yaml
Backend:  Laravel 11 • PHP 8.2+ • SQLite (dev) / MySQL (prod)
Auth:     Fortify + Sanctum • 2FA enabled
Frontend: React 19 • TypeScript 5.7 • Inertia.js 2.1.4
Styling:  Tailwind CSS 4.0
Build:    Vite 7.0 • Wayfinder (form-powered routing)
UI:       Radix UI • Headless UI • Lucide Icons
Charts:   ApexCharts • FullCalendar
```

---

## 📐 Architecture Patterns

### Multi-Tenancy: Row-Level Isolation

**CRITICAL:** Every tenant-scoped query MUST filter by `tenant_id`.

```php
// ❌ BAD - Returns ALL tenant data
Product::all();

// ✅ GOOD - Tenant scoped
Product::where('tenant_id', auth()->user()->tenant_id)->get();

// ✅ BEST - Use services (scoping is built-in)
app(ProductService::class)->getAllProducts();
```

**Tenant Limits:** Enforced at application level (`max_shops`, `max_users`, `max_products`)

### Service Layer Pattern

**Controllers** are thin (validation, auth, delegation)
**Services** contain business logic, transactions, caching

```php
// ProductController
public function store(CreateProductRequest $request)
{
    Gate::authorize('create', Product::class);
    $product = $this->productService->create($request->validated());
    return redirect()->route('products.show', $product);
}

// ProductService
public function create(array $data): Product
{
    return DB::transaction(function () use ($data) {
        $product = Product::create([
            'tenant_id' => auth()->user()->tenant_id, // ← REQUIRED
            'shop_id' => $data['shop_id'],
            // ...
        ]);
        Cache::tags(["tenant:{$product->tenant_id}:products"])->flush();
        return $product;
    });
}
```

### Authorization

**8-Level Hierarchy:** Super Admin (999) → Owner (100) → General Manager (80) → Store Manager (60) → Assistant Manager (50) → Sales Rep (40) → Inventory Clerk (30) → Cashier (30)

```php
// Use policies
Gate::authorize('update', $product);

// Check permissions
if (!auth()->user()->role->hasPermission('manage_inventory')) {
    abort(403);
}

// Hierarchical checks (lower cannot manage higher)
if ($targetUser->role->level() >= $currentUser->role->level()) {
    abort(403);
}
```

---

## 🧩 Core Models & Relationships

```
Tenant (root)
├── User (7 roles) → ShopUser (pivot) → Shop  [Staff/Employees]
├── Customer (separate from User) [E-commerce customers]
│   ├── CustomerAddress
│   ├── CustomerCreditTransaction
│   ├── Cart → CartItem
│   └── Order → OrderItem
├── Shop
│   ├── Product
│   │   ├── ProductCategory (hierarchical)
│   │   ├── ProductType (system/tenant)
│   │   └── ProductVariant
│   │       ├── InventoryLocation (polymorphic)
│   │       ├── ProductPackagingType
│   │       └── StockMovement (audit trail)
│   ├── Order → OrderItem → OrderPayment
│   ├── PurchaseOrder → PurchaseOrderItem
│   ├── Receipt (order/payment PDFs)
│   └── EmployeePayroll (salary, deductions)
├── SupplierProfile (B2B marketplace)
│   ├── SupplierConnection (tenant-to-tenant)
│   ├── SupplierCatalogItem
│   └── SupplierPricingTier
└── Service (sellable services, polymorphic with Product)
```

**Key Enums:** UserRole • OrderStatus • PaymentStatus • StockMovementType • PurchaseOrderStatus • ConnectionStatus • InventoryModel

**Important:** Customer and User are separate tables. Customer = e-commerce customers, User = staff/employees.

---

## 🎨 Frontend Development

### Inertia Form Component (Wayfinder-Powered)

**ALWAYS use Inertia `Form` with wayfinder controllers for submissions.**

```tsx
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { Form } from '@inertiajs/react';

export default function Create({ shops, categories }: Props) {
    return (
        <Form
            action={ProductController.store.url()}
            method="post"
            transform={(data) => ({
                ...data,
                has_variants: data.has_variants ? '1' : '0',
            })}
        >
            {({ errors, processing }) => (
                <>
                    <Input name="name" error={!!errors.name} />
                    <InputError message={errors.name} />

                    <Button type="submit" disabled={processing}>
                        Create Product
                    </Button>
                </>
            )}
        </Form>
    );
}
```

**Controller imports:** All controllers auto-generated by wayfinder at `@/actions/App/Http/Controllers/...`

### Form Components (`@/components/form/...`)

**Input** - Text/number/email/password/date inputs
```tsx
import Input from '@/components/form/input/InputField';

<Input
    type="text"
    name="name"
    placeholder="Product name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    error={!!errors.name}  // Red border on error
    success={false}         // Green border on success
    disabled={false}
    required={true}
    hint="Helper text"      // Shows below input
    className=""            // Additional classes
/>
```

**TextArea** - Multi-line text input
```tsx
import TextArea from '@/components/form/input/TextArea';

<TextArea
    name="description"
    placeholder="Product description"
    rows={4}
    value={description}
    onChange={(value) => setDescription(value)}
    error={!!errors.description}
    disabled={false}
    hint="Max 500 characters"
/>
```

**Select** - Dropdown selection
```tsx
import Select from '@/components/form/Select';

<Select
    options={[
        { value: '', label: 'Choose option' },
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
    ]}
    placeholder="Select shop"
    onChange={(value) => setShopId(parseInt(value))}
    defaultValue=""
    className=""
/>

{/* Pair with hidden input for form submission */}
<input type="hidden" name="shop_id" value={shopId} />
```

**Checkbox** - Boolean selection
```tsx
import Checkbox from '@/components/form/input/Checkbox';

<Checkbox
    id="has_variants"
    checked={hasVariants}
    onChange={(e) => setHasVariants(e.target.checked)}
/>
```

**Label & InputError** - Form helpers
```tsx
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';

<Label htmlFor="name">
    Product Name <span className="text-error-500">*</span>
</Label>
<Input name="name" id="name" />
<InputError message={errors.name} />
```

### UI Components (`@/components/ui/...`)

**Card** - Content container
```tsx
import { Card } from '@/components/ui/card';

<Card
    title="Basic Information"
    description="Configure product details"
    image="/path/to/image.jpg"  // Optional
    className="mt-4"
>
    {/* Card content */}
</Card>

{/* Or minimal usage */}
<Card className="p-6">
    <h3>Custom content</h3>
</Card>
```

**Badge** - Status/label indicators
```tsx
import Badge from '@/components/ui/badge/Badge';

<Badge
    variant="light"        // 'light' | 'solid'
    color="success"        // 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark'
    size="md"             // 'sm' | 'md'
    startIcon={<Icon />}  // Optional icon
    endIcon={<Icon />}    // Optional icon
>
    Active
</Badge>

{/* Examples */}
<Badge color="success">Approved</Badge>
<Badge variant="solid" color="error">Cancelled</Badge>
<Badge color="warning" startIcon={<AlertCircle />}>Pending</Badge>
```

**Button** - Action triggers
```tsx
import Button from '@/components/ui/button/Button';

<Button
    type="submit"                // 'button' | 'submit' | 'reset'
    variant="primary"            // 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
    size="md"                    // 'sm' | 'md' | 'lg'
    disabled={processing}
    loading={isLoading}          // Shows spinner
    fullWidth={false}
    startIcon={<Save />}         // Icon before text
    endIcon={<ArrowRight />}     // Icon after text
    onClick={() => handleClick()}
    className="mt-4"
>
    Save Product
</Button>

{/* Variant examples */}
<Button variant="primary">Primary Action</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Link-style</Button>
```

**EmptyState** - No data placeholder
```tsx
import EmptyState from '@/components/ui/EmptyState';

<EmptyState
    icon={<Package />}
    title="No products found"
    description="Get started by creating your first product."
    action={
        <Button onClick={() => router.visit('/products/create')}>
            Add Product
        </Button>
    }
/>
```

### Route Helpers (Wayfinder)

```tsx
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import { Link, router } from '@inertiajs/react';

// Form submission
<Form action={OrderController.store.url()} method="post">

// Links
<Link href={OrderController.show.url({ order: order.id })}>
    View Order
</Link>

// Programmatic navigation
router.visit(OrderController.edit.url({ order: order.id }));

// Delete with confirmation
<Form action={OrderController.destroy.url({ order: order.id })} method="delete">
    <Button type="submit" variant="destructive">Delete</Button>
</Form>
```

---

## 📋 Feature Status

| Feature | Status | Key Files | Notes |
|---------|--------|-----------|-------|
| Multi-Tenancy | ✅ | `Tenant.php`, `TenantService.php` | Row-level isolation |
| Products/Inventory | ✅ | `ProductService.php` | Variants, packaging, categories |
| Stock Movements | ✅ | `StockMovementService.php` | 5 types, full audit trail |
| Orders | ✅ | `OrderService.php` | Full lifecycle, payment tracking |
| POS System | ✅ | `POSService.php` | Quick sales, cash handling |
| Receipts | ✅ | `ReceiptService.php` | PDF generation, email delivery |
| Customer Credit | ✅ | `CustomerCreditService.php` | Credit limits, payment tracking |
| Supplier System | ✅ | `PurchaseOrderService.php` | B2B marketplace, PO workflow |
| E-Commerce | ✅ | `CartService.php`, `StorefrontService.php` | Cart, catalog, accounts |
| Employee Payroll | ✅ | `EmployeePayrollService.php` | Salary, deductions, pay periods |
| Services (sellable) | ✅ | `ServiceController.php` | Service catalog with polymorphism |
| Reports | ✅ | `ReportService.php` | 6 report types with exports |
| Staff Management | ✅ | `StaffManagementService.php` | 8-level hierarchy |
| **Super Admin** | ✅ | `AdminTenantController.php` | Platform management, subscriptions |
| **Payment Gateway** | ✅ | `PaymentGatewayManager.php` | Paystack, OPay, Flutterwave, Crypto |
| **PWA/Offline** | ✅ | `sw.js`, `indexeddb.ts`, `sync.ts` | Service worker, IndexedDB, sync |
| API | 🔶 | `routes/api.php` | Sanctum setup, webhooks |
| Testing | 🚧 | `tests/` | Needs expansion |
| Shipping/Delivery | ❌ | - | Carrier integration planned |

---

## ⚡ Development Workflows

### Local Setup

```bash
# Environment
cp .env.example .env
php artisan key:generate

# Database (SQLite)
touch database/database.sqlite
php artisan migrate --seed

# Development servers
composer dev  # Laravel + Queue + Vite
```

### Available Commands

```bash
# Backend
composer dev          # Full dev stack
composer test         # Run Pest tests
./vendor/bin/pint     # Code formatting

# Frontend
npm run dev           # Vite HMR
npm run build         # Production build
npm run lint          # ESLint + fix
npm run format        # Prettier
npm run types         # TypeScript check
```

### Git Workflow

```bash
# Commit format
feat: Add purchase order approval workflow
fix: Resolve stock calculation bug
refactor: Extract supplier service methods
docs: Update CLAUDE.md feature status
```

---

## 🔒 Critical Rules

### ❌ NEVER Do This

1. **Query without tenant scoping** (unless system-wide)
   ```php
   Product::all(); // ❌ Exposes ALL tenant data
   ```

2. **Bypass authorization**
   ```php
   $product->update($request->all()); // ❌ No auth check
   ```

3. **Modify inventory without audit**
   ```php
   $variant->update(['stock_quantity' => $new]); // ❌ No trail
   ```

4. **Ignore tenant limits**
   ```php
   Product::create($data); // ❌ May exceed max_products
   ```

5. **Hardcode route URLs**
   ```tsx
   <Link href="/products/1"> // ❌ Use wayfinder controllers
   ```

### ✅ ALWAYS Do This

1. **Use tenant-scoped queries**
   ```php
   Product::where('tenant_id', auth()->user()->tenant_id)->get();
   ```

2. **Authorize actions**
   ```php
   Gate::authorize('update', $product);
   $product->update($validated);
   ```

3. **Create stock movements**
   ```php
   app(StockMovementService::class)->adjustStock($variant, $qty, $type, $reason);
   ```

4. **Check tenant limits**
   ```php
   if ($tenant->products()->count() >= $tenant->max_products) {
       throw new TenantLimitExceededException();
   }
   ```

5. **Use wayfinder routes**
   ```tsx
   <Form action={ProductController.store.url()} method="post">
   ```

6. **Wrap multi-step operations in transactions**
   ```php
   return DB::transaction(function () use ($data) {
       // Multiple DB operations
   });
   ```

7. **Use tagged caching for tenant data**
   ```php
   Cache::tags(["tenant:{$tenantId}:products"])
       ->remember($key, $ttl, $callback);
   ```

---

## 🗂️ Critical Files

```
# Backend Core
app/Models/Tenant.php                           # Tenant root
app/Models/User.php                             # Staff/employees (8 roles)
app/Models/Customer.php                         # E-commerce customers (separate!)
app/Services/ProductService.php                 # Product CRUD
app/Services/StockMovementService.php           # Inventory operations
app/Services/OrderService.php                   # Order lifecycle
app/Services/POSService.php                     # Point of sale
app/Services/CartService.php                    # E-commerce cart
app/Services/EmployeePayrollService.php         # Payroll management
app/Enums/UserRole.php                          # 8-level roles

# Payment System
app/Services/Payment/PaymentGatewayManager.php  # Gateway factory
app/Services/Payment/PaymentGatewayInterface.php # Gateway contract
app/Services/Payment/Gateways/PaystackGateway.php
app/Http/Controllers/PaymentController.php      # Callbacks
app/Http/Controllers/Webhooks/PaymentWebhookController.php

# Admin System
app/Http/Controllers/Admin/AdminTenantController.php
app/Http/Middleware/EnsureSuperAdmin.php

# PWA/Offline
public/sw.js                                    # Service worker
public/manifest.json                            # PWA manifest
resources/js/lib/indexeddb.ts                   # IndexedDB utilities
resources/js/lib/sync.ts                        # Sync mechanism
resources/js/hooks/usePWA.ts                    # PWA hook

# Frontend
resources/js/app.tsx                            # Inertia entry
resources/js/layouts/AppLayout.tsx              # Main layout
resources/js/components/payment/                # Payment components
resources/js/components/ui/                     # UI components
resources/js/components/form/                   # Form components

# Routes
routes/web.php                                  # Main routes
routes/api.php                                  # API + webhooks
routes/storefront.php                           # E-commerce routes

# Config
config/payment.php                              # Gateway configuration
config/services.php                             # API keys
```

---

## 🚀 Quick Implementation Guide

### Adding a New Feature

1. **Database**
   ```bash
   php artisan make:migration create_feature_table
   # Include tenant_id, indexes, timestamps
   ```

2. **Model + Service**
   ```bash
   php artisan make:model Feature
   # Add to app/Services/FeatureService.php
   ```

3. **Policy**
   ```bash
   php artisan make:policy FeaturePolicy
   # Register in AuthServiceProvider
   ```

4. **Controller**
   ```php
   class FeatureController extends Controller {
       public function __construct(private FeatureService $service) {}
   }
   ```

5. **Routes**
   ```php
   Route::resource('features', FeatureController::class);
   ```

6. **Frontend Page**
   ```tsx
   // resources/js/pages/Features/Index.tsx
   import FeatureController from '@/actions/App/Http/Controllers/FeatureController';

   export default function Index({ features }: Props) {
       return (
           <AppLayout>
               <Head title="Features" />
               {/* Implementation */}
           </AppLayout>
       );
   }
   ```

7. **Tests**
   ```bash
   php artisan make:test FeatureTest
   # Write feature tests with Pest
   ```

---

## 🧪 Testing Guidelines

```php
// Pest tests
it('allows owners to create features', function () {
    $user = User::factory()->owner()->create();

    $response = $this->actingAs($user)
        ->post(route('features.store'), [
            'name' => 'Test Feature',
            'tenant_id' => $user->tenant_id,
        ]);

    $response->assertStatus(201);
    expect(Feature::count())->toBe(1);
});

it('prevents unauthorized access', function () {
    $user = User::factory()->cashier()->create();

    $response = $this->actingAs($user)
        ->post(route('features.store'), ['name' => 'Test']);

    $response->assertForbidden();
});
```

---

## 📝 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **Models** | Singular PascalCase | `Product`, `OrderItem` |
| **Services** | Domain + Service | `ProductService` |
| **Controllers** | Singular + Controller | `ProductController` |
| **Policies** | Model + Policy | `ProductPolicy` |
| **Tables** | Plural snake_case | `products`, `order_items` |
| **Routes** | kebab-case | `/stock-movements` |
| **Route names** | dot.separated | `products.store` |
| **React Pages** | PascalCase | `Products/Index.tsx` |
| **React Components** | PascalCase | `ProductCard`, `OrderForm` |
| **Hooks** | camelCase + `use` | `useAppearance`, `useMobile` |

---

## 📚 Resources

- [Laravel 11 Docs](https://laravel.com/docs/11.x)
- [Inertia.js Docs](https://inertiajs.com)
- [Wayfinder Plugin](https://github.com/laravel/vite-plugin-wayfinder)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Pest PHP](https://pestphp.com)

---

## 🎯 Next Priorities

1. **Shipping Integration** - Carrier APIs (FedEx, UPS, DHL)
2. **Expand Testing** - POS system, receipts, customer credit, payroll
3. **Production Deployment** - Performance monitoring, error tracking, backups
4. **API Documentation** - OpenAPI/Swagger docs for external integrations
5. **Mobile Apps** - Native iOS/Android apps using the existing PWA foundation

---

**Last Updated:** 2025-11-18
