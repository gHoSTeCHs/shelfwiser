# CLAUDE.md - ShelfWiser AI Assistant Guide

> **Last Updated:** 2025-11-14
> **Project:** ShelfWiser - Multi-Tenant Inventory Management SaaS
> **Status:** Beta Development

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Multi-Tenancy Pattern](#multi-tenancy-pattern)
4. [Database Schema & Models](#database-schema--models)
5. [Authorization & Permissions](#authorization--permissions)
6. [Development Workflows](#development-workflows)
7. [Code Conventions](#code-conventions)
8. [Current Features](#current-features)
9. [Feature Roadmap](#feature-roadmap)
10. [Critical Files Reference](#critical-files-reference)
11. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

**ShelfWiser** is a comprehensive, multi-tenant inventory management SaaS platform designed to help businesses manage:
- Multi-store operations
- Product catalogs with variants and packaging types
- Real-time inventory tracking across locations
- Order processing with complete lifecycle management
- Stock movements with full audit trails
- Role-based access control (7 hierarchical levels)
- Financial tracking and analytics

### Current State
- ✅ **Multi-tenant architecture** with strong tenant isolation
- ✅ **Shop management** (multiple shops per tenant)
- ✅ **Product management** (variants, categories, dynamic schemas)
- ✅ **Stock movements** (adjustments, transfers, sales, restocks)
- ✅ **Order system** with status workflows
- ✅ **User roles & permissions** (7-level hierarchy)
- ✅ **Customer management**
- ✅ **Dashboard with analytics**

### In Development
- 🚧 **Supplier/procurement system** (Next priority)
- 🚧 **E-commerce frontend**
- 🚧 **Payment processing**
- 🚧 **Delivery/logistics**
- 🚧 **Enhanced reporting**

---

## Architecture & Tech Stack

### Backend Stack
```yaml
Framework: Laravel 11.x
PHP Version: 8.2+
Database: MySQL (production) / SQLite (development)
Authentication: Laravel Fortify + Sanctum
Queue: Redis (production) / Database (development)
Cache: Redis (production) / File (development)
Testing: Pest PHP 4.1
```

### Frontend Stack
```yaml
UI Framework: React 19 + TypeScript 5.7
Bridge: Inertia.js (server-driven SPA)
Build Tool: Vite 7.0
Styling: Tailwind CSS 4.0
Components: Radix UI, Headless UI
Icons: Lucide React
Charts: ApexCharts
```

### Project Structure
```
shelfwiser/
├── app/
│   ├── Http/Controllers/      # Request handlers
│   ├── Models/                # Eloquent models (14 total)
│   ├── Services/              # Business logic layer (12 services, ~2200 LOC)
│   ├── Policies/              # Authorization (7 policies)
│   ├── Enums/                 # Type-safe enums (5 enums)
│   ├── Contracts/             # Interfaces
│   └── Exceptions/            # Custom exceptions
├── database/
│   ├── migrations/            # Schema definitions (26 migrations)
│   ├── seeders/               # Test data seeders (10 seeders)
│   └── factories/             # Model factories
├── resources/
│   ├── js/                    # React + TypeScript frontend
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── layouts/          # Layout wrappers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React context providers
│   │   └── types/            # TypeScript definitions
│   └── views/                 # Blade views (minimal, Inertia-driven)
├── routes/
│   ├── web.php               # Web routes
│   ├── auth.php              # Auth routes
│   └── settings.php          # User settings
└── tests/
    ├── Feature/              # Feature tests
    └── Unit/                 # Unit tests
```

---

## Multi-Tenancy Pattern

### Architecture: Account-Based Multi-Tenancy

ShelfWiser uses **row-level tenant isolation** with a shared database schema. Each tenant has complete data separation while sharing the same application instance.

### Tenant Model
```php
Tenant {
    id, name, slug (unique), owner_email
    business_type, phone, logo_path
    subscription_plan, trial_ends_at, subscription_ends_at
    max_shops, max_users, max_products
    settings (JSON), is_active
    timestamps, soft_deletes
}
```

### Isolation Strategy

1. **Row-Level Isolation**
   - Every tenant-scoped model includes `tenant_id` foreign key
   - All queries automatically filter by `auth()->user()->tenant_id`
   - Database indexes on `(tenant_id, ...)` for performance

2. **Multi-Store Support**
   - Users assigned to shops via `ShopUser` pivot table
   - Owners access all tenant shops automatically
   - Other roles assigned to specific shops
   - Dashboard dynamically loads accessible shops

3. **Data Sharing (Limited)**
   - `ProductType` and `ShopType` can be system-wide (null tenant_id) or tenant-specific
   - Scoped queries: `ProductType::accessibleTo($tenantId)` returns system + tenant types

4. **Subscription Limits**
   - `max_shops`, `max_users`, `max_products` enforced at application level
   - Trial and subscription status tracked per tenant

### Critical Rules for AI Assistants

⚠️ **NEVER** write queries without tenant scoping unless explicitly working on system-wide features.

✅ **ALWAYS** include tenant context:
```php
// GOOD
Product::where('tenant_id', auth()->user()->tenant_id)->get();

// GOOD (via service layer)
app(ProductService::class)->getAllProducts(); // Service handles scoping

// BAD - Missing tenant_id
Product::all(); // Returns data from ALL tenants!
```

✅ **ALWAYS** check tenant limits before creation:
```php
// GOOD
if ($tenant->products()->count() >= $tenant->max_products) {
    throw new TenantLimitExceededException('Product limit reached');
}
```

---

## Database Schema & Models

### Entity Relationship Overview

```
Tenant (Root)
├── User (7 role levels)
│   └── ShopUser (pivot) → Shop
├── Shop (multiple per tenant)
│   ├── Product
│   │   ├── ProductCategory (hierarchical)
│   │   ├── ProductType (system/tenant)
│   │   └── ProductVariant
│   │       ├── InventoryLocation (polymorphic)
│   │       ├── ProductPackagingType (UOM breakdown)
│   │       └── StockMovement (audit trail)
│   └── Order
│       └── OrderItem
└── Customer (extends User)
```

### Core Models (14 Total)

| Model | Tenant-Scoped | Purpose | Key Relationships |
|-------|---------------|---------|-------------------|
| **Tenant** | N/A | Organization root | hasMany: User, Shop, Product, Order |
| **User** | Yes | Staff & customers | belongsTo: Tenant; belongsToMany: Shop |
| **Shop** | Yes | Store locations | belongsTo: Tenant, ShopType; hasMany: Product, Order |
| **Product** | Yes | Catalog items | belongsTo: Tenant, Shop, ProductType, ProductCategory; hasMany: ProductVariant |
| **ProductVariant** | Indirect | SKU-level tracking | belongsTo: Product; hasMany: InventoryLocation, ProductPackagingType, StockMovement |
| **InventoryLocation** | Indirect | Stock at location | belongsTo: ProductVariant; morphTo: location (Shop/Warehouse) |
| **ProductPackagingType** | Indirect | Units of measure | belongsTo: ProductVariant |
| **StockMovement** | Yes | Audit trail | belongsTo: Tenant, ProductVariant, Shop, User |
| **Order** | Yes | Customer orders | belongsTo: Tenant, Shop, Customer; hasMany: OrderItem |
| **OrderItem** | Indirect | Order line items | belongsTo: Order, ProductVariant, ProductPackagingType |
| **ProductCategory** | Yes | Hierarchical taxonomy | belongsTo: Tenant, parent; hasMany: children, products |
| **ProductType** | Conditional | Product classification | System-wide or tenant-specific |
| **ShopType** | Conditional | Shop classification | System-wide or tenant-specific |
| **Customer** | Yes | End customers | extends User |

### Schema Patterns

**Financial Precision:**
```sql
-- All monetary fields use DECIMAL(15, 2)
price DECIMAL(15, 2)
cost_price DECIMAL(15, 2)
subtotal DECIMAL(15, 2)
tax_amount DECIMAL(15, 2)
discount_amount DECIMAL(15, 2)
```

**Audit Fields:**
```sql
-- Standard timestamps
created_at TIMESTAMP
updated_at TIMESTAMP

-- Accountability (select models)
created_by BIGINT UNSIGNED
updated_by BIGINT UNSIGNED

-- Soft deletes (Tenant, User)
deleted_at TIMESTAMP NULL
```

**Unique Constraints:**
```sql
-- Tenant-scoped uniqueness
UNIQUE KEY (tenant_id, email)     -- Users
UNIQUE KEY (tenant_id, slug)      -- Products, Categories
UNIQUE KEY (tenant_id, sku)       -- Product Variants

-- Global uniqueness
UNIQUE KEY (order_number)         -- Orders
UNIQUE KEY (reference_number)     -- Stock Movements
```

**Polymorphic Relationships:**
```sql
-- Inventory locations (Shop, Warehouse, etc.)
location_type VARCHAR(255)  -- Model class name
location_id BIGINT UNSIGNED -- Polymorphic ID
```

---

## Authorization & Permissions

### 7-Level Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ OWNER (Level 100)                                       │
│ - Full system access, billing, tenant settings         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ GENERAL_MANAGER (Level 80)                              │
│ - Multi-store oversight, financial visibility          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ STORE_MANAGER (Level 60)                                │
│ - Single store management, inventory, staff            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ASSISTANT_MANAGER (Level 50)                            │
│ - Store operations, order processing                   │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌───────────────────────────────┐
        │                               │
┌───────────────────┐          ┌────────────────────┐
│ SALES_REP (40)    │          │ INVENTORY_CLERK (30)│
│ - Sales, orders   │          │ - Stock management  │
└───────────────────┘          └────────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ↓
              ┌─────────────────────┐
              │ CASHIER (Level 30)  │
              │ - POS transactions  │
              └─────────────────────┘
```

### Permission Matrix

Each role has explicit permissions defined in `app/Enums/UserRole.php`:

```php
enum UserRole: string {
    case OWNER = 'owner';
    case GENERAL_MANAGER = 'general_manager';
    case STORE_MANAGER = 'store_manager';
    case ASSISTANT_MANAGER = 'assistant_manager';
    case SALES_REP = 'sales_rep';
    case INVENTORY_CLERK = 'inventory_clerk';
    case CASHIER = 'cashier';

    public function level(): int;
    public function permissions(): array;
    public function hasPermission(string $permission): bool;
}
```

**Key Permissions:**
- `manage_tenant` - Tenant settings, billing
- `manage_stores` - Shop CRUD
- `manage_users` - Staff management
- `manage_inventory` - Stock operations
- `manage_products` - Catalog management
- `manage_orders` - Order processing
- `view_financials` - Revenue, costs
- `view_profits` - Margin calculations
- `view_reports` - Analytics access

### Authorization Policies (7 Total)

Located in `app/Policies/`:
- `DashboardPolicy` - Dashboard access, financial views
- `StaffPolicy` - User CRUD with hierarchy checks
- `ProductPolicy` - Product management
- `OrderPolicy` - Order operations
- `StockMovementPolicy` - Stock operations
- `ProductCategoryPolicy` - Category management
- `ShopPolicy` - Shop management

**Policy Usage:**
```php
// In controllers
Gate::authorize('create', Product::class);
Gate::authorize('manage', $order);

// In Blade/Inertia
@can('update', $product)
    <!-- Edit button -->
@endcan

// In services
if (! Gate::allows('manage', $order)) {
    throw new UnauthorizedException();
}
```

### Critical Authorization Rules

1. **Hierarchical Role Checks:**
   ```php
   // Lower-level users cannot manage higher-level users
   if ($targetUser->role->level() >= $currentUser->role->level()) {
       throw new UnauthorizedException();
   }
   ```

2. **Shop Assignment:**
   ```php
   // Non-owners must be assigned to specific shops
   if (! $user->isTenantOwner() && ! $user->shops->contains($shop)) {
       throw new UnauthorizedException();
   }
   ```

3. **Tenant Boundary:**
   ```php
   // Users can ONLY access their own tenant data
   if ($resource->tenant_id !== auth()->user()->tenant_id) {
       throw new UnauthorizedException();
   }
   ```

---

## Development Workflows

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd shelfwiser

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup (SQLite for local dev)
touch database/database.sqlite
php artisan migrate
php artisan db:seed  # Optional: seed test data

# Start development servers
composer dev  # Runs: Laravel + Queue + Vite concurrently
```

### Available Scripts

**Composer Scripts:**
```bash
composer dev         # Start full dev environment (PHP + Queue + Vite)
composer dev:ssr     # Dev with SSR + logging (Pail)
composer test        # Clear config + run Pest tests
```

**NPM Scripts:**
```bash
npm run dev          # Vite dev server (HMR)
npm run build        # Production build
npm run build:ssr    # Build with SSR support
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npm run format:check # Check formatting
npm run types        # TypeScript type checking
```

### Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- Feature branches: `feature/description` or `claude/session-id`
- Pull requests required for merging to main

**Commit Message Format:**
```
type: Brief description (50 chars max)

Detailed explanation (optional)
- Bullet points for multiple changes
- Reference issues: #123

Examples:
feat: Add supplier connection workflow
fix: Resolve stock movement calculation bug
refactor: Extract order service methods
docs: Update CLAUDE.md with new patterns
```

**Pre-Commit Checks:**
```bash
npm run lint         # Passes ESLint
npm run format:check # Passes Prettier
npm run types        # No TypeScript errors
composer test        # All tests passing
```

### Testing Guidelines

**Running Tests:**
```bash
composer test              # All tests
php artisan test --filter=OrderTest  # Specific test
php artisan test --watch   # Watch mode
```

**Writing Tests (Pest PHP):**
```php
use App\Models\Product;
use App\Models\User;

it('allows owners to create products', function () {
    $user = User::factory()->owner()->create();

    $response = $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'Test Product',
            'tenant_id' => $user->tenant_id,
            'shop_id' => $user->shops->first()->id,
        ]);

    $response->assertStatus(201);
    expect(Product::count())->toBe(1);
});

it('prevents inventory clerks from deleting products', function () {
    $user = User::factory()->inventoryClerk()->create();
    $product = Product::factory()->create(['tenant_id' => $user->tenant_id]);

    $response = $this->actingAs($user)
        ->delete(route('products.destroy', $product));

    $response->assertForbidden();
});
```

### Code Quality Tools

| Tool | Command | Config File |
|------|---------|-------------|
| **Prettier** | `npm run format` | `.prettierrc` |
| **ESLint** | `npm run lint` | `eslint.config.js` |
| **TypeScript** | `npm run types` | `tsconfig.json` |
| **Pest** | `composer test` | `phpunit.xml`, `tests/Pest.php` |
| **Laravel Pint** | `./vendor/bin/pint` | `pint.json` |

---

## Code Conventions

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **Models** | Singular PascalCase | `Product`, `OrderItem`, `StockMovement` |
| **Controllers** | Singular + Controller | `ProductController`, `OrderController` |
| **Services** | Domain + Service | `ProductService`, `StockMovementService` |
| **Policies** | Model + Policy | `ProductPolicy`, `OrderPolicy` |
| **Requests** | Action + Domain + Request | `CreateOrderRequest`, `UpdateProductRequest` |
| **Tables** | Plural snake_case | `products`, `stock_movements`, `order_items` |
| **Migrations** | Timestamp_action_description | `2025_11_12_create_orders_table.php` |
| **Routes** | kebab-case | `/stock-movements`, `/product-categories` |
| **Route names** | dot.separated | `orders.show`, `stock-movements.adjust` |
| **React Pages** | PascalCase (match routes) | `Products/Index.tsx`, `Orders/Show.tsx` |
| **React Components** | PascalCase | `OrderForm`, `StockList`, `DataTable` |
| **React Hooks** | camelCase with `use` prefix | `useAppearance`, `useMobile` |

### PHP Code Style

**Service Layer Pattern:**
```php
// Controllers are thin, delegate to services
class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {}

    public function store(CreateProductRequest $request)
    {
        $product = $this->productService->create($request->validated());

        return redirect()
            ->route('products.show', $product)
            ->with('success', 'Product created successfully');
    }
}

// Services contain business logic
class ProductService
{
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create([
                'tenant_id' => auth()->user()->tenant_id,
                'shop_id' => $data['shop_id'],
                'name' => $data['name'],
                // ...
            ]);

            if ($data['has_variants']) {
                $this->createVariants($product, $data['variants']);
            }

            Cache::tags(["tenant:{$product->tenant_id}:products"])->flush();

            Log::info('Product created', ['product_id' => $product->id]);

            return $product;
        });
    }
}
```

**Enum Usage:**
```php
// Define enums with helper methods
enum OrderStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case PROCESSING = 'processing';
    case PACKED = 'packed';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    public function canEdit(): bool
    {
        return in_array($this, [self::PENDING, self::CONFIRMED]);
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'yellow',
            self::CONFIRMED, self::PROCESSING => 'blue',
            self::PACKED, self::SHIPPED => 'purple',
            self::DELIVERED => 'green',
            self::CANCELLED, self::REFUNDED => 'red',
        };
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($status) => [$status->value => ucfirst($status->name)])
            ->toArray();
    }
}

// Use in models
class Order extends Model
{
    protected $casts = [
        'status' => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
    ];
}

// Use in controllers/services
if (! $order->status->canEdit()) {
    throw new InvalidOrderStateException('Order cannot be edited');
}
```

**Policy Authorization:**
```php
// Define policies
class ProductPolicy
{
    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_products');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->tenant_id === $product->tenant_id
            && $user->role->hasPermission('manage_products');
    }

    public function delete(User $user, Product $product): bool
    {
        // Only owners and general managers can delete
        return $user->tenant_id === $product->tenant_id
            && $user->role->level() >= UserRole::GENERAL_MANAGER->level();
    }
}

// Use in controllers
public function update(UpdateProductRequest $request, Product $product)
{
    Gate::authorize('update', $product);

    // Proceed with update
}
```

**Request Validation:**
```php
class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Order::class);
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'exists:shops,id', new BelongsToTenant()],
            'customer_id' => ['required', 'exists:users,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.packaging_type_id' => ['nullable', 'exists:product_packaging_types,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Order must contain at least one item',
            'items.*.variant_id.exists' => 'Invalid product selected',
        ];
    }
}
```

**Cache Management:**
```php
// Tagged cache for easy invalidation
class ProductService
{
    private function getCacheKey(int $tenantId, string $suffix = ''): string
    {
        return "tenant:{$tenantId}:products:{$suffix}";
    }

    public function getAllProducts(): Collection
    {
        $tenantId = auth()->user()->tenant_id;

        return Cache::tags(["tenant:{$tenantId}:products"])
            ->remember(
                $this->getCacheKey($tenantId, 'all'),
                now()->addHour(),
                fn() => Product::where('tenant_id', $tenantId)->get()
            );
    }

    public function create(array $data): Product
    {
        $product = DB::transaction(function () use ($data) {
            // Create product...
        });

        // Invalidate cache
        Cache::tags(["tenant:{$product->tenant_id}:products"])->flush();

        return $product;
    }
}
```

### TypeScript/React Conventions

**Component Structure:**
```tsx
// Page components (resources/js/pages/)
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Product } from '@/types';

interface Props {
    products: Product[];
    pagination: PaginationMeta;
}

export default function ProductsIndex({ products, pagination }: Props) {
    return (
        <AppLayout>
            <Head title="Products" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Products</h1>

                {/* Component content */}
            </div>
        </AppLayout>
    );
}
```

**Reusable Components:**
```tsx
// resources/js/components/ProductCard.tsx
import { Product } from '@/types';

interface ProductCardProps {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
    return (
        <div className="rounded-lg border p-4">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.sku}</p>

            <div className="mt-4 flex gap-2">
                {onEdit && (
                    <button onClick={() => onEdit(product)}>Edit</button>
                )}
                {onDelete && (
                    <button onClick={() => onDelete(product)}>Delete</button>
                )}
            </div>
        </div>
    );
}
```

**Type Definitions:**
```typescript
// resources/js/types/index.ts
export interface Product {
    id: number;
    tenant_id: number;
    shop_id: number;
    name: string;
    slug: string;
    has_variants: boolean;
    variants?: ProductVariant[];
    created_at: string;
    updated_at: string;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    sku: string;
    barcode: string | null;
    price: number;
    cost_price: number;
    stock_quantity: number;
    reserved_quantity: number;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}
```

**Inertia Form Handling:**
```tsx
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function CreateProduct() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        shop_id: '',
        has_variants: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.store'));
    };

    return (
        <form onSubmit={submit}>
            <input
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
            />
            {errors.name && <p className="text-red-500">{errors.name}</p>}

            <button type="submit" disabled={processing}>
                Create Product
            </button>
        </form>
    );
}
```

---

## Current Features

### Implemented Features (Production-Ready)

#### 1. Multi-Tenant Management
- **Tenant Registration & Onboarding**
  - Location: `app/Models/Tenant.php`, `app/Services/TenantService.php`
  - Subscription plans (trial, basic, pro, enterprise)
  - Tenant limits (shops, users, products)
  - Soft delete support

#### 2. Authentication & User Management
- **Laravel Fortify Authentication**
  - Location: `routes/auth.php`, `app/Http/Controllers/Auth/`
  - Features: Login, register, password reset, email verification, 2FA
- **7-Level Role Hierarchy**
  - Location: `app/Enums/UserRole.php`
  - Roles: Owner, General Manager, Store Manager, Assistant Manager, Sales Rep, Inventory Clerk, Cashier
- **Shop User Assignments**
  - Location: `app/Models/ShopUser.php`
  - Users assigned to specific shops (except owners)

#### 3. Shop Management
- **Multi-Shop Support**
  - Location: `app/Http/Controllers/ShopController.php`, `app/Services/ShopService.php`
  - CRUD operations with tenant scoping
  - Shop types (system/tenant-specific)
  - Inventory models per shop
  - Address, contact, configuration management

#### 4. Product Catalog
- **Product Management**
  - Location: `app/Http/Controllers/ProductController.php`, `app/Services/ProductService.php`
  - Products with variants support
  - Custom attributes (JSON schema)
  - Product categories (hierarchical)
  - Product types (system/tenant)
- **Product Variants**
  - Location: `app/Models/ProductVariant.php`
  - SKU, barcode, batch number, serial number
  - Pricing (retail, cost, margin)
  - Expiry date tracking
- **Packaging Types**
  - Location: `app/Models/ProductPackagingType.php`
  - Units of measure (UOM)
  - Break-down logic (e.g., 1 case = 24 bottles)
  - Sealed vs. breakable packages

#### 5. Inventory Management
- **Multi-Location Stock Tracking**
  - Location: `app/Models/InventoryLocation.php`
  - Polymorphic locations (Shop, Warehouse, etc.)
  - Available vs. reserved quantities
  - Real-time stock levels
- **Stock Movements**
  - Location: `app/Http/Controllers/StockMovementController.php`, `app/Services/StockMovementService.php`
  - Types: Adjustment (in/out), Transfer, Sale, Restock, Stock-take
  - Full audit trail (quantity before/after)
  - Reference numbers for traceability
  - Reason codes and notes

#### 6. Order Management
- **Complete Order Lifecycle**
  - Location: `app/Http/Controllers/OrderController.php`, `app/Services/OrderService.php`
  - Status workflow: Pending → Confirmed → Processing → Packed → Shipped → Delivered
  - Payment status tracking
  - Order items with packaging support
  - Financial calculations (subtotal, tax, discount, shipping)
- **Order Fulfillment**
  - Stock reservation on order creation
  - Stock deduction on fulfillment
  - Partial refund support

#### 7. Dashboard & Analytics
- **Multi-Store Dashboard**
  - Location: `app/Http/Controllers/DashboardController.php`, `app/Services/DashboardService.php`
  - Permission-filtered metrics
  - Revenue, profit, margin calculations
  - Top products, recent orders
  - Custom date range filtering
- **Financial Tracking**
  - Cost price tracking (weighted average)
  - Profit margin calculations
  - Revenue analytics per shop/tenant

#### 8. User Settings
- **Profile Management**
  - Location: `app/Http/Controllers/Settings/`
  - Profile updates (name, email)
  - Password changes
  - 2FA setup/disable
  - Appearance settings (theme)

### Feature Status Matrix

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| Multi-Tenancy | ✅ Complete | `Tenant.php`, `TenantService.php` | Row-level isolation |
| Authentication | ✅ Complete | `routes/auth.php`, Fortify config | 2FA, email verification |
| Role-Based Access | ✅ Complete | `UserRole.php`, 7 policies | 7 hierarchical levels |
| Shop Management | ✅ Complete | `ShopController.php` | Multi-shop per tenant |
| Product Catalog | ✅ Complete | `ProductController.php` | Variants, categories, types |
| Packaging Types | ✅ Complete | `ProductPackagingType.php` | Break-down logic |
| Inventory Tracking | ✅ Complete | `InventoryLocation.php` | Multi-location, reserved stock |
| Stock Movements | ✅ Complete | `StockMovementController.php` | 5 movement types, audit trail |
| Order Processing | ✅ Complete | `OrderController.php` | Full lifecycle, payment status |
| Dashboard Analytics | ✅ Complete | `DashboardController.php` | Metrics, financials |
| User Settings | ✅ Complete | `Settings/` controllers | Profile, password, 2FA, theme |
| Customer Management | 🔶 Basic | `Customer.php` | Extends User, minimal features |
| API | 🔶 Minimal | `routes/api.php` | Sanctum setup, limited endpoints |
| Testing | 🚧 In Progress | `tests/` | Pest framework, basic coverage |
| Supplier System | ❌ Not Started | - | Next priority (see roadmap) |
| E-commerce Frontend | ❌ Not Started | - | Public product catalog |
| Payment Processing | ❌ Not Started | - | Stripe/PayPal integration |
| Delivery/Logistics | ❌ Not Started | - | Shipping, tracking |

---

## Feature Roadmap

### Phase 1: Supplier & Procurement System (Next Priority)

**Status:** Planned (Q1 2025)
**Duration:** 6-8 weeks
**Priority:** HIGH

#### Supplier-as-Tenant Architecture

**Concept:** Leverage existing multi-tenant infrastructure to allow tenants to become suppliers to other tenants, creating a B2B marketplace network.

**Key Benefits:**
- ✅ No duplicate inventory code (suppliers use existing Product/Variant/Stock systems)
- ✅ Network effects (each tenant adds value)
- ✅ Clean tenant-to-tenant relationships
- ✅ Multiple revenue streams (B2B + B2C)

#### New Database Tables

```sql
-- Supplier configuration per tenant
CREATE TABLE supplier_profiles (
    id BIGINT UNSIGNED PRIMARY KEY,
    tenant_id BIGINT UNSIGNED,  -- FK to tenants
    is_enabled BOOLEAN DEFAULT false,
    business_registration VARCHAR(255),
    tax_id VARCHAR(255),
    payment_terms VARCHAR(50),  -- e.g., "Net 30"
    lead_time_days INT,         -- Default delivery lead time
    minimum_order_value DECIMAL(15, 2),
    settings JSON,              -- Additional configs
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- M2M relationships between buyer and supplier tenants
CREATE TABLE supplier_connections (
    id BIGINT UNSIGNED PRIMARY KEY,
    supplier_tenant_id BIGINT UNSIGNED,  -- Supplier
    buyer_tenant_id BIGINT UNSIGNED,     -- Buyer
    status ENUM('pending', 'approved', 'active', 'suspended'),
    credit_limit DECIMAL(15, 2) NULL,
    payment_terms_override VARCHAR(50) NULL,
    notes TEXT NULL,
    requested_at TIMESTAMP,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (supplier_tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (buyer_tenant_id) REFERENCES tenants(id),
    UNIQUE KEY (supplier_tenant_id, buyer_tenant_id)
);

-- Products exposed to supplier network
CREATE TABLE supplier_catalog_items (
    id BIGINT UNSIGNED PRIMARY KEY,
    supplier_tenant_id BIGINT UNSIGNED,
    product_id BIGINT UNSIGNED,         -- FK to products
    is_available BOOLEAN DEFAULT true,
    wholesale_price DECIMAL(15, 2),     -- Different from retail
    min_order_quantity INT DEFAULT 1,
    visibility ENUM('public', 'private', 'connections_only'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (supplier_tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY (supplier_tenant_id, product_id)
);

-- Orders between tenants
CREATE TABLE purchase_orders (
    id BIGINT UNSIGNED PRIMARY KEY,
    buyer_tenant_id BIGINT UNSIGNED,
    supplier_tenant_id BIGINT UNSIGNED,
    po_number VARCHAR(255) UNIQUE,
    status ENUM('draft', 'submitted', 'approved', 'fulfilled', 'cancelled'),
    subtotal DECIMAL(15, 2),
    tax_amount DECIMAL(15, 2),
    shipping_amount DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    expected_delivery_date DATE NULL,
    notes TEXT NULL,
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (buyer_tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (supplier_tenant_id) REFERENCES tenants(id),
    INDEX (buyer_tenant_id, status),
    INDEX (supplier_tenant_id, status)
);

-- PO line items
CREATE TABLE purchase_order_items (
    id BIGINT UNSIGNED PRIMARY KEY,
    purchase_order_id BIGINT UNSIGNED,
    product_variant_id BIGINT UNSIGNED,
    quantity INT,
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    received_quantity INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

-- Track received shipments
CREATE TABLE stock_receivings (
    id BIGINT UNSIGNED PRIMARY KEY,
    purchase_order_id BIGINT UNSIGNED,
    received_by_user_id BIGINT UNSIGNED,
    received_at TIMESTAMP,
    notes TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (received_by_user_id) REFERENCES users(id)
);
```

#### Implementation Sprints

**Sprint 1-2: Core Infrastructure (Weeks 1-2)**
- Database migrations
- Models: `SupplierProfile`, `SupplierConnection`, `SupplierCatalogItem`
- Supplier settings UI
- Enable/disable supplier mode

**Sprint 3-4: Connection System (Weeks 3-4)**
- Supplier directory/search
- Connection request workflow
- Approval interface for suppliers
- Permissions and policies
- Email notifications

**Sprint 5-6: Purchase Orders (Weeks 5-6)**
- PO creation from supplier catalog
- PO submission and approval workflow
- Supplier order management dashboard
- Status updates and history
- Price locking logic

**Sprint 7-8: Receiving & Integration (Weeks 7-8)**
- Stock receiving interface
- Automatic stock movement creation (`type: 'restock'`)
- PO completion workflow
- Reporting (PO history, supplier performance)
- Testing, refinement, documentation

#### Technical Challenges & Solutions

**Challenge 1: Tenant Isolation vs. Inter-Tenant Access**
- Problem: Core principle is tenant_id scoping, but suppliers need to expose data
- Solution: Scoped queries with relationship checks
  ```php
  SupplierCatalogItem::whereHas('supplierTenant.approvedConnections', function ($query) {
      $query->where('buyer_tenant_id', auth()->user()->tenant_id)
            ->where('status', 'approved');
  })->get();
  ```

**Challenge 2: Pricing Complexity**
- Problem: Multiple pricing tiers (retail, wholesale, tiered, custom)
- Solution: Layered pricing model
  ```
  Product Variant
  ├── retail_price (B2C e-commerce)
  ├── base_cost (internal)
  └── Supplier Catalog Item
      ├── wholesale_price (default for all buyers)
      ├── Tiered Pricing (volume discounts)
      └── Connection-Specific Pricing (special rates)
  ```

**Challenge 3: Stock Reservation**
- Problem: When buyer creates PO, how to handle supplier's stock?
- Solution: Stock status states
  ```
  Physical Stock: 1000 units
  ├── Available: 700 units (can sell/allocate)
  ├── Reserved/Allocated: 200 units (pending POs)
  ├── In Transit: 100 units (shipped POs)
  └── Committed: 0 units (confirmed orders)
  ```

**Challenge 4: Permissions & Policies**
- Problem: New authorization scenarios (supplier viewing buyer's PO, etc.)
- Solution: New policies
  ```php
  PurchaseOrderPolicy::viewAsSupplier($user, $po) {
      return $user->tenant_id === $po->supplier_tenant_id
          && $user->role->can('manage_supplier_orders');
  }

  PurchaseOrderPolicy::viewAsBuyer($user, $po) {
      return $user->tenant_id === $po->buyer_tenant_id
          && $user->role->can('manage_purchase_orders');
  }
  ```

### Phase 2: E-Commerce Frontend (Months 3-4)

**Status:** Planned (Q2 2025)
**Duration:** 5-6 weeks

- Public product catalog per shop
- Shopping cart and checkout
- Customer accounts (self-registration)
- Order tracking
- Product search and filtering
- SEO optimization

### Phase 3: Payment Processing (Months 3-4)

**Status:** Planned (Q2 2025)
**Duration:** 3-4 weeks

- Stripe/PayPal integration
- Payment methods management
- Refunds and disputes
- Subscription billing (for tenants)

### Phase 4: Delivery/Shipping (Months 5-6)

**Status:** Planned (Q2 2025)
**Duration:** 4-5 weeks

- Shipping zones and rates
- Carrier integration (ShipStation, EasyPost)
- Tracking numbers
- Delivery status updates

### Phase 5: Advanced Features (Months 7+)

- **Reporting & Analytics** (4-5 weeks)
  - Sales reports
  - Inventory reports
  - Supplier performance
  - Financial reports

- **Project Management** (6-8 weeks)
  - Task management
  - Milestone tracking
  - Team collaboration
  - Delivery coordination

- **Payroll System** (10-12 weeks + legal review)
  - Employee management
  - Time tracking
  - Salary calculation
  - Tax withholding
  - Payslip generation

---

## Critical Files Reference

### Multi-Tenancy Core
```
app/Models/Tenant.php                    # Tenant root model
app/Services/TenantService.php           # Tenant operations
app/Enums/UserRole.php                   # 7-level role hierarchy
```

### Product & Inventory System
```
app/Models/Product.php                   # Catalog items
app/Models/ProductVariant.php            # SKU-level tracking
app/Models/ProductPackagingType.php      # Units of measure
app/Models/InventoryLocation.php         # Stock at locations
app/Services/ProductService.php          # Product CRUD
app/Services/StockMovementService.php    # Inventory operations
app/Http/Controllers/ProductController.php
app/Http/Controllers/StockMovementController.php
```

### Order Management
```
app/Models/Order.php                     # Customer orders
app/Models/OrderItem.php                 # Order line items
app/Services/OrderService.php            # Order lifecycle
app/Http/Controllers/OrderController.php
app/Enums/OrderStatus.php                # Status workflow
app/Enums/PaymentStatus.php
```

### Authorization
```
app/Policies/DashboardPolicy.php         # Dashboard access
app/Policies/ProductPolicy.php
app/Policies/OrderPolicy.php
app/Policies/StockMovementPolicy.php
app/Policies/StaffPolicy.php
app/Policies/ShopPolicy.php
app/Policies/ProductCategoryPolicy.php
```

### Dashboard & Analytics
```
app/Services/DashboardService.php        # Metrics, financial calculations
app/Http/Controllers/DashboardController.php
```

### Frontend
```
resources/js/app.tsx                     # Inertia setup
resources/js/layouts/AppLayout.tsx       # Main authenticated layout
resources/js/pages/Products/Index.tsx    # Product listing
resources/js/pages/Orders/Index.tsx      # Order management
resources/js/pages/Dashboard.tsx         # Dashboard
resources/js/context/ThemeContext.tsx    # Theme management
resources/js/types/index.ts              # TypeScript definitions
```

### Routes
```
routes/web.php                           # Main application routes
routes/auth.php                          # Authentication routes
routes/settings.php                      # User settings routes
routes/api.php                           # API routes (minimal)
```

### Configuration
```
config/fortify.php                       # Authentication config
config/inertia.php                       # Inertia.js config
config/sanctum.php                       # API token config
.env.example                             # Environment variables template
```

### Database
```
database/migrations/                     # 26 schema migrations
database/seeders/DatabaseSeeder.php      # Main seeder
database/seeders/TenantSeeder.php        # Test tenant data
database/factories/                      # Model factories
```

---

## AI Assistant Guidelines

### Core Principles

1. **Always Maintain Tenant Isolation**
   - Every query MUST filter by `tenant_id` unless working on system-wide features
   - Never expose cross-tenant data
   - Validate tenant boundaries in authorization checks

2. **Follow the Service Layer Pattern**
   - Keep controllers thin (validation, authorization, delegation)
   - Put business logic in services
   - Use database transactions for multi-step operations

3. **Enforce Authorization at Every Level**
   - Check role permissions before operations
   - Use policies for model-based authorization
   - Respect role hierarchy (lower cannot manage higher)

4. **Preserve Data Integrity**
   - Use database transactions for atomic operations
   - Maintain audit trails (stock movements, order history)
   - Validate tenant limits before creation

5. **Cache Wisely**
   - Use tagged caching for tenant-scoped data
   - Invalidate on create/update/delete
   - Cache expensive dashboard calculations

### Common Patterns

#### Creating Tenant-Scoped Resources

```php
// ALWAYS include tenant_id from authenticated user
$product = Product::create([
    'tenant_id' => auth()->user()->tenant_id,  // ← REQUIRED
    'shop_id' => $validated['shop_id'],
    'name' => $validated['name'],
    // ...
]);

// Validate tenant limits BEFORE creation
if ($tenant->products()->count() >= $tenant->max_products) {
    throw new TenantLimitExceededException('Product limit reached');
}
```

#### Querying Tenant-Scoped Data

```php
// ALWAYS filter by tenant_id
$products = Product::where('tenant_id', auth()->user()->tenant_id)
    ->where('shop_id', $shopId)
    ->get();

// Prefer using services (tenant scoping is encapsulated)
$products = app(ProductService::class)->getProductsForShop($shopId);
```

#### Authorization Checks

```php
// Use policies for model authorization
Gate::authorize('update', $product);

// Check role permissions
if (! auth()->user()->role->hasPermission('manage_inventory')) {
    abort(403, 'Insufficient permissions');
}

// Hierarchical role checks
if ($targetUser->role->level() >= auth()->user()->role->level()) {
    abort(403, 'Cannot manage users with equal or higher roles');
}
```

#### Stock Movement Audit Trail

```php
// ALWAYS create stock movement records when changing inventory
StockMovement::create([
    'tenant_id' => $variant->product->tenant_id,
    'product_variant_id' => $variant->id,
    'shop_id' => $location->location_id,
    'type' => StockMovementType::ADJUSTMENT_IN,
    'quantity' => $quantity,
    'quantity_before' => $variant->stock_quantity,
    'quantity_after' => $variant->stock_quantity + $quantity,
    'reference_number' => $this->generateReferenceNumber(),
    'reason' => $reason,
    'notes' => $notes,
    'performed_by' => auth()->id(),
]);
```

#### Database Transactions

```php
// Wrap multi-step operations in transactions
return DB::transaction(function () use ($data) {
    $order = Order::create([
        'tenant_id' => auth()->user()->tenant_id,
        // ...
    ]);

    foreach ($data['items'] as $item) {
        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_variant_id' => $item['variant_id'],
            'quantity' => $item['quantity'],
            // ...
        ]);

        // Reserve stock
        $this->reserveStock($orderItem);
    }

    // Invalidate cache
    Cache::tags(["tenant:{$order->tenant_id}:orders"])->flush();

    Log::info('Order created', ['order_id' => $order->id]);

    return $order;
});
```

### Testing Checklist

When implementing new features, ensure:

- [ ] Tenant isolation is enforced (queries filter by `tenant_id`)
- [ ] Authorization policies are in place
- [ ] Role permissions are checked
- [ ] Database transactions wrap multi-step operations
- [ ] Cache invalidation occurs on data changes
- [ ] Audit trails are maintained (stock movements, logs)
- [ ] Form validation is comprehensive
- [ ] Error handling is graceful
- [ ] TypeScript types are defined (frontend)
- [ ] Inertia page props are typed
- [ ] Unit/feature tests are written
- [ ] Migration is reversible (`down()` method)

### Forbidden Patterns

❌ **NEVER** query without tenant scoping (unless system-wide):
```php
// BAD
$products = Product::all();

// GOOD
$products = Product::where('tenant_id', auth()->user()->tenant_id)->get();
```

❌ **NEVER** bypass authorization:
```php
// BAD
$product->update($request->all());

// GOOD
Gate::authorize('update', $product);
$product->update($request->validated());
```

❌ **NEVER** modify inventory without audit trail:
```php
// BAD
$variant->update(['stock_quantity' => $newQuantity]);

// GOOD
app(StockMovementService::class)->adjustStock(
    $variant,
    $quantityChange,
    StockMovementType::ADJUSTMENT_IN,
    'Reason for adjustment'
);
```

❌ **NEVER** expose cross-tenant data:
```php
// BAD
return Order::find($id);  // No tenant check!

// GOOD
$order = Order::where('tenant_id', auth()->user()->tenant_id)
    ->findOrFail($id);
Gate::authorize('view', $order);
return $order;
```

❌ **NEVER** ignore tenant limits:
```php
// BAD
Product::create($data);

// GOOD
if ($tenant->products()->count() >= $tenant->max_products) {
    throw new TenantLimitExceededException();
}
Product::create($data);
```

### When Adding New Features

1. **Review Existing Patterns**
   - Check similar features for consistency
   - Follow established service/controller/policy structure

2. **Design Database Schema**
   - Include `tenant_id` for scoped tables
   - Add appropriate indexes
   - Use soft deletes where appropriate
   - Write reversible migrations

3. **Implement Service Layer**
   - Create service class in `app/Services/`
   - Handle business logic, transactions, caching
   - Log important operations

4. **Add Authorization**
   - Create policy in `app/Policies/`
   - Update role permissions in `UserRole.php`
   - Gate checks in controller

5. **Build Frontend**
   - Create page component in `resources/js/pages/`
   - Define TypeScript types in `resources/js/types/`
   - Use Inertia form helpers
   - Handle loading and error states

6. **Write Tests**
   - Feature tests for HTTP flows
   - Unit tests for service logic
   - Test authorization (allowed/forbidden cases)
   - Test tenant isolation

7. **Update Documentation**
   - Update this CLAUDE.md file
   - Add JSDoc/PHPDoc comments
   - Document API endpoints (if applicable)

### Getting Help

**When Stuck:**
1. Search codebase for similar implementations
2. Review existing services/controllers/policies
3. Check Laravel documentation
4. Review Inertia.js documentation
5. Check TypeScript definitions in `resources/js/types/`

**Key Resources:**
- Laravel 11 Docs: https://laravel.com/docs/11.x
- Inertia.js Docs: https://inertiajs.com
- React 19 Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Pest PHP: https://pestphp.com

---

## Changelog

### 2025-11-14
- Initial CLAUDE.md creation
- Comprehensive codebase analysis
- Documented current features and architecture
- Added supplier system roadmap (Phase 1)
- Defined code conventions and AI assistant guidelines

---

**Maintained by:** ShelfWiser Development Team
**For AI Assistants:** This document is your source of truth for understanding ShelfWiser's architecture, conventions, and development workflows. Always refer to this guide when implementing new features or refactoring existing code.
