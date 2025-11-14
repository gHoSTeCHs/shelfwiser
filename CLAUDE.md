# ShelfWiser - AI Assistant Guide

This document provides comprehensive guidance for AI assistants working on the ShelfWiser inventory management system. It covers the codebase architecture, development patterns, and key conventions to follow.

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Architecture & Project Structure](#architecture--project-structure)
3. [Type System & Type Safety](#type-system--type-safety)
4. [Wayfinder Integration](#wayfinder-integration)
5. [Form Patterns](#form-patterns)
6. [Component Patterns](#component-patterns)
7. [Controller & Service Patterns](#controller--service-patterns)
8. [Database Models & Multi-Tenancy](#database-models--multi-tenancy)
9. [Authentication & Authorization](#authentication--authorization)
10. [Testing with Pest](#testing-with-pest)
11. [Key Conventions](#key-conventions)
12. [Creating New Features](#creating-new-features)
13. [Common Utilities](#common-utilities)
14. [Development Workflow](#development-workflow)

---

## Tech Stack Overview

### Backend
- **Laravel 12** with PHP 8.2+
- **Laravel Fortify** for authentication (2FA enabled)
- **Laravel Sanctum** for API authentication
- **Laravel Wayfinder** (v0.1.9) - Type-safe route generation
- **Inertia.js** (v2.x) - Server-driven SPA with SSR enabled
- **Pest PHP** for testing

### Frontend
- **React 19** with TypeScript (strict mode)
- **Vite 7** for build tooling
- **Tailwind CSS v4** with custom design system
- **Radix UI** for accessible component primitives
- **Lucide React** for icons
- **ApexCharts** for data visualization
- **FullCalendar** for calendar views

### Key Features
- Multi-tenant architecture with tenant scoping
- SSR-enabled for better performance and SEO
- Type-safe full-stack with Wayfinder
- Dynamic product/shop configuration system
- Comprehensive authorization with policies
- Rich domain modeling with PHP enums

---

## Architecture & Project Structure

### Backend Structure (`/app`)

```
app/
├── Contracts/              # Interfaces and contracts
├── Enums/                  # PHP enums for type-safe state management
│   ├── OrderStatus.php
│   ├── PaymentStatus.php
│   ├── StockMovementType.php
│   └── UserRole.php
├── Http/
│   ├── Controllers/        # Resource and action controllers
│   │   ├── Auth/          # Authentication controllers
│   │   ├── Settings/      # User settings
│   │   ├── Web/           # Web-specific controllers
│   │   ├── ProductController.php
│   │   ├── OrderController.php
│   │   └── StockMovementController.php
│   ├── Middleware/
│   │   ├── HandleInertiaRequests.php  # Shares data to frontend
│   │   └── HandleAppearance.php       # Theme handling
│   └── Requests/          # Form request validation classes
│       ├── CreateProductRequest.php
│       └── UpdateProductRequest.php
├── Models/                # Eloquent models (all tenant-scoped)
│   ├── Product.php
│   ├── Order.php
│   ├── Shop.php
│   └── Tenant.php
├── Policies/              # Authorization policies
│   ├── ProductPolicy.php
│   └── OrderPolicy.php
└── Services/              # Business logic layer
    └── ProductService.php
```

### Frontend Structure (`/resources/js`)

```
resources/js/
├── actions/               # Wayfinder-generated controller actions (auto-generated)
├── components/
│   ├── form/             # Form components
│   │   ├── input/
│   │   │   ├── InputField.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   └── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── Label.tsx
│   │   └── InputError.tsx
│   ├── ui/               # Radix UI-based primitives
│   │   ├── button/
│   │   ├── card/
│   │   ├── dropdown/
│   │   ├── modal/
│   │   └── table/
│   └── [domain]/         # Domain-specific components
│       ├── inventory/
│       ├── orders/
│       └── shops/
├── context/              # React context providers
│   ├── SidebarContext.tsx
│   ├── ThemeContext.tsx
│   └── UserRoleContext.tsx
├── hooks/                # Custom React hooks
│   └── use-appearance.ts
├── layouts/              # Layout components
│   ├── AppLayout.tsx
│   ├── AppHeader.tsx
│   ├── AppSidebar.tsx
│   └── AuthPageLayout.tsx
├── pages/                # Inertia page components
│   ├── Products/
│   │   ├── Index.tsx
│   │   ├── Create.tsx
│   │   ├── Edit.tsx
│   │   └── Show.tsx
│   ├── Orders/
│   └── Dashboard.tsx
├── types/                # TypeScript type definitions
│   ├── index.d.ts       # Shared types, User, Auth
│   ├── product.ts
│   ├── order.ts
│   └── shop.ts
├── lib/                  # Utility functions
│   └── utils.ts         # cn(), flattenCategories(), etc.
├── app.tsx              # Inertia app entry
└── ssr.tsx              # SSR entry point
```

### Routes Structure

```
routes/
├── web.php              # Main web routes (resource controllers)
├── auth.php             # Authentication routes (Fortify)
├── settings.php         # User settings routes
└── api.php              # API routes (minimal usage)
```

---

## Type System & Type Safety

### TypeScript Type Definitions

All types should mirror Laravel models and API responses. Store types in `/resources/js/types/`.

**Example: Product Types** (`resources/js/types/product.ts`)

```typescript
export interface ProductType {
    id: number;
    slug: string;
    label: string;
    description: string;
    config_schema: {
        type: string;
        properties: Record<string, SchemaProperty>;
        required: string[];
    } | null;
    supports_variants: boolean;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    has_variants: boolean;
    is_active: boolean;
    type: ProductType;
    category: ProductCategory | null;
    shop: Shop;
    variants: ProductVariant[];
    created_at: string;
    updated_at: string;
}
```

### Shared Props Type

Global data shared from Laravel to all pages is typed in `resources/js/types/index.d.ts`:

```typescript
export interface SharedData {
    auth: Auth;
    sidebarOpen: boolean;
    userRoles: UserRole[];
    [key: string]: unknown;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRoleValue;
    is_tenant_owner: boolean;
    two_factor_enabled?: boolean;
}

export interface Auth {
    user: User;
}
```

### Using Shared Props in Components

```typescript
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export default function MyComponent() {
    const { auth } = usePage<SharedData>().props;

    return <div>Welcome, {auth.user.first_name}!</div>;
}
```

### PHP Enums with TypeScript

PHP enums should have corresponding TypeScript string literal types:

**PHP Enum** (`app/Enums/OrderStatus.php`):
```php
enum OrderStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
}
```

**TypeScript Type** (`resources/js/types/order.ts`):
```typescript
export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'delivered'
    | 'cancelled';
```

---

## Wayfinder Integration

**Wayfinder** generates type-safe TypeScript route helpers from Laravel controllers, providing autocomplete and compile-time route validation.

### Configuration

Configured in `vite.config.ts`:

```typescript
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

export default defineConfig({
    plugins: [
        laravel({ /* ... */ }),
        react(),
        wayfinder({
            formVariants: true,  // Enable form-specific route helpers
        }),
    ],
});
```

### Generated Actions

Wayfinder automatically generates TypeScript modules in `/resources/js/actions/` matching your Laravel controller structure.

**Example: ProductController Routes**

```php
// routes/web.php
Route::resource('products', ProductController::class);
```

**Generated TypeScript:**

```typescript
// resources/js/actions/App/Http/Controllers/ProductController.ts
export default {
    index: {
        url: () => '/products',
        method: 'GET',
    },
    create: {
        url: () => '/products/create',
        method: 'GET',
    },
    store: {
        url: () => '/products',
        method: 'POST',
    },
    show: {
        url: (id: number) => `/products/${id}`,
        method: 'GET',
    },
    edit: {
        url: (id: number) => `/products/${id}/edit`,
        method: 'GET',
    },
    update: {
        url: (id: number) => `/products/${id}`,
        method: 'PUT',
    },
    destroy: {
        url: (id: number) => `/products/${id}`,
        method: 'DELETE',
    },
};
```

### Using Wayfinder in Forms

**Import the generated controller:**

```typescript
import ProductController from '@/actions/App/Http/Controllers/ProductController';
```

**Use with Inertia Form component:**

```typescript
<Form action={ProductController.store.url()} method="post">
    {/* Form fields */}
</Form>
```

**With route parameters:**

```typescript
<Form action={ProductController.update.url(product.id)} method="put">
    {/* Form fields */}
</Form>
```

### Navigation with Wayfinder

```typescript
import { Link } from '@inertiajs/react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';

<Link href={ProductController.show.url(product.id)}>
    View Product
</Link>
```

---

## Form Patterns

### Backend: Form Request Validation

All form validation should use dedicated FormRequest classes in `app/Http/Requests/`.

**Example: CreateProductRequest.php**

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Product::class);
    }

    public function rules(): array
    {
        $rules = [
            'shop_id' => ['required', 'exists:shops,id'],
            'product_type_slug' => ['required', 'exists:product_types,slug'],
            'name' => ['required', 'string', 'max:255'],
        ];

        if ($this->boolean('has_variants')) {
            $rules['variants'] = ['required', 'array', 'min:1'];
            $rules['variants.*.sku'] = ['required', 'string', 'unique:product_variants,sku'];
            $rules['variants.*.price'] = ['required', 'numeric', 'min:0'];
        } else {
            $rules['sku'] = ['required', 'string', 'unique:product_variants,sku'];
            $rules['price'] = ['required', 'numeric', 'min:0'];
        }

        return $rules;
    }
}
```

### Frontend: Inertia Form Component

**Always use Inertia's `<Form>` component** for forms, managed by Wayfinder-generated controllers.

**Basic Form Pattern:**

```typescript
import { Form } from '@inertiajs/react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';

export default function Create() {
    return (
        <Form
            action={ProductController.store.url()}
            method="post"
            transform={(data) => ({
                ...data,
                has_variants: hasVariants ? '1' : '0',
            })}
        >
            {({ errors, processing }) => (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">
                            Product Name
                            <span className="text-error-500"> *</span>
                        </Label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            error={!!errors.name}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? 'Creating...' : 'Create Product'}
                    </Button>
                </div>
            )}
        </Form>
    );
}
```

### Form Component Reference

**Available Form Components** in `/resources/js/components/form/`:

1. **InputField.tsx** - Text, email, number, password inputs
   ```typescript
   <Input
       type="text"
       name="name"
       value={value}
       onChange={(e) => setValue(e.target.value)}
       error={!!errors.name}
       required
   />
   ```

2. **TextArea.tsx** - Multi-line text input
   ```typescript
   <TextArea
       name="description"
       rows={4}
       error={!!errors.description}
   />
   ```

3. **Checkbox.tsx** - Boolean checkbox input
   ```typescript
   <Checkbox
       name="is_active"
       checked={isActive}
       onChange={(e) => setIsActive(e.target.checked)}
   />
   ```

4. **Select.tsx** - Dropdown select
   ```typescript
   <Select
       name="shop_id"
       value={shopId}
       onChange={(e) => setShopId(e.target.value)}
       error={!!errors.shop_id}
   >
       <option value="">Select a shop</option>
       {shops.map(shop => (
           <option key={shop.id} value={shop.id}>{shop.name}</option>
       ))}
   </Select>
   ```

5. **Label.tsx** - Form labels
   ```typescript
   <Label htmlFor="name">Product Name</Label>
   ```

6. **InputError.tsx** - Error message display
   ```typescript
   <InputError message={errors.name} />
   ```

### Form Transform Pattern

Use the `transform` prop to modify data before submission:

```typescript
<Form
    action={ProductController.store.url()}
    method="post"
    transform={(data) => ({
        ...data,
        // Convert boolean to string for Laravel
        has_variants: data.has_variants ? '1' : '0',
        // Transform nested objects
        config: transformConfigBySchema(data.config, schema),
        // Filter out empty values
        tags: data.tags?.filter(Boolean),
    })}
>
```

---

## Component Patterns

### Page Component Structure

All Inertia pages should follow this pattern:

```typescript
import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';

// Define props interface matching Laravel controller return
interface Props {
    products: PaginatedResponse<Product>;
    stats: ProductStats;
}

export default function Index({ products, stats }: Props) {
    return (
        <AppLayout>
            <Head title="Products" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold">Products</h1>
                {/* Page content */}
            </div>
        </AppLayout>
    );
}
```

### Layout Components

**AppLayout** (`resources/js/layouts/AppLayout.tsx`) provides the main application shell:

```typescript
import AppLayout from '@/layouts/AppLayout';

export default function MyPage() {
    return (
        <AppLayout>
            {/* Your page content */}
        </AppLayout>
    );
}
```

**AuthPageLayout** for authentication pages:

```typescript
import AuthPageLayout from '@/layouts/AuthPageLayout';

export default function Login() {
    return (
        <AuthPageLayout>
            {/* Login form */}
        </AuthPageLayout>
    );
}
```

### Radix UI Components

UI components in `/resources/js/components/ui/` are built with Radix UI primitives:

**Button Component:**

```typescript
import Button from '@/components/ui/button/Button';

<Button variant="primary" size="md">
    Click Me
</Button>
```

**Available variants:** `primary`, `outline`, `ghost`, `destructive`
**Available sizes:** `sm`, `md`, `lg`

### Using Context Providers

**Sidebar Context:**

```typescript
import { useSidebar } from '@/context/SidebarContext';

const { isExpanded, toggle } = useSidebar();
```

**User Role Context:**

```typescript
import { useUserRole } from '@/context/UserRoleContext';

const { can } = useUserRole();

if (can('create_products')) {
    // Show create button
}
```

### Icon Usage

Use Lucide React for icons:

```typescript
import { Plus, Edit, Trash2, Search } from 'lucide-react';

<Button>
    <Plus className="mr-2 h-4 w-4" />
    Add Product
</Button>
```

---

## Controller & Service Patterns

### Controller Pattern

Controllers should be thin, delegating business logic to services.

**ProductController.php** (typical structure):

```php
namespace App\Http\Controllers;

use App\Http\Requests\CreateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Product::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Products/Index', [
            'products' => Product::where('tenant_id', $tenantId)
                ->with(['type', 'category', 'shop', 'variants'])
                ->latest()
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Product::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Products/Create', [
            'shops' => Shop::where('tenant_id', $tenantId)->get(),
            'productTypes' => ProductType::accessibleTo($tenantId)->get(),
            'categories' => ProductCategory::where('tenant_id', $tenantId)->get(),
        ]);
    }

    public function store(CreateProductRequest $request): RedirectResponse
    {
        $product = $this->productService->create(
            $request->validated(),
            $request->user()->tenant,
            Shop::findOrFail($request->input('shop_id'))
        );

        return redirect()->route('products.index')
            ->with('success', "Product '{$product->name}' created successfully.");
    }

    public function show(Product $product): Response
    {
        Gate::authorize('view', $product);

        $product->load(['type', 'category', 'shop', 'variants.stockMovements']);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
```

**Key Patterns:**
- ✅ Authorize before every action using `Gate::authorize()`
- ✅ Scope all queries by `tenant_id`
- ✅ Use `Inertia::render()` for page responses
- ✅ Return `RedirectResponse` for mutations with flash messages
- ✅ Eager load relationships to prevent N+1 queries
- ✅ Inject services via constructor dependency injection
- ✅ Use Form Requests for validation (never validate in controller)

### Service Layer Pattern

Complex business logic should live in service classes in `app/Services/`.

**ProductService.php** example:

```php
namespace App\Services;

use App\Models\Product;
use App\Models\ProductType;
use App\Models\Tenant;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductService
{
    public function create(array $data, Tenant $tenant, Shop $shop): Product
    {
        Log::info('Product creation started', ['tenant' => $tenant->id]);

        try {
            return DB::transaction(function () use ($data, $tenant, $shop) {
                // Resolve relationships
                $productType = $this->resolveProductType(
                    $data['product_type_slug'],
                    $tenant
                );

                // Generate unique slug
                $slug = $this->generateUniqueSlug($data['name'], $tenant);

                // Create product
                $product = Product::create([
                    'tenant_id' => $tenant->id,
                    'shop_id' => $shop->id,
                    'product_type_id' => $productType->id,
                    'name' => $data['name'],
                    'slug' => $slug,
                    'description' => $data['description'] ?? null,
                    'has_variants' => $data['has_variants'] ?? false,
                    'is_active' => $data['is_active'] ?? true,
                ]);

                // Create variants if applicable
                if ($product->has_variants && isset($data['variants'])) {
                    foreach ($data['variants'] as $variantData) {
                        $this->createVariant($product, $variantData);
                    }
                }

                // Invalidate cache
                Cache::tags(["tenant:{$tenant->id}:products"])->flush();

                return $product->load('type', 'variants');
            });
        } catch (\Throwable $e) {
            Log::error('Product creation failed', [
                'exception' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    private function resolveProductType(string $slug, Tenant $tenant): ProductType
    {
        return Cache::tags(["tenant:{$tenant->id}:product_types"])
            ->remember("product_type:{$slug}", 3600, fn() =>
                ProductType::accessibleTo($tenant->id)
                    ->where('slug', $slug)
                    ->firstOrFail()
            );
    }

    private function generateUniqueSlug(string $name, Tenant $tenant): string
    {
        $slug = Str::slug($name);
        $count = 1;

        while (Product::where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = Str::slug($name) . '-' . $count++;
        }

        return $slug;
    }

    private function createVariant(Product $product, array $data): void
    {
        // Variant creation logic
    }
}
```

**Service Pattern Guidelines:**
- ✅ Use database transactions for multi-model operations
- ✅ Log important operations for debugging
- ✅ Cache expensive queries and invalidate on mutations
- ✅ Extract helper methods for clarity
- ✅ Throw exceptions on errors (let controller handle)
- ✅ Return loaded relationships to prevent additional queries

---

## Database Models & Multi-Tenancy

### Multi-Tenant Architecture

**All models must be scoped by `tenant_id`**. This is the most critical convention in the codebase.

**Tenant Model** (`app/Models/Tenant.php`):

```php
class Tenant extends Model
{
    protected $fillable = [
        'name', 'slug', 'owner_email', 'business_type',
        'phone', 'logo_path', 'settings', 'is_active', 'max_users',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function shops(): HasMany
    {
        return $this->hasMany(Shop::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
```

### Model Pattern

**Product Model** (typical structure):

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'tenant_id',
        'shop_id',
        'product_type_id',
        'category_id',
        'name',
        'slug',
        'description',
        'custom_attributes',
        'has_variants',
        'is_active',
    ];

    protected $casts = [
        'custom_attributes' => 'array',
        'has_variants' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(ProductType::class, 'product_type_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    // Scopes
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Business logic methods
    public function canBeDeleted(): bool
    {
        return !$this->variants()->whereHas('orders')->exists();
    }
}
```

### Model with Enum Casting

**Order Model** with enum casting:

```php
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;

class Order extends Model
{
    protected $casts = [
        'status' => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
        'subtotal' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    // Auto-generate order number on creation
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = self::generateOrderNumber($order->tenant_id);
            }
        });
    }

    // Business logic
    public function canEdit(): bool
    {
        return $this->status->canEdit();
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(
            fn($item) => $item->unit_price * $item->quantity
        );
        $this->total_amount = $this->subtotal + $this->tax_amount - $this->discount_amount;
    }
}
```

### Critical Model Conventions

1. **Always scope by tenant_id** in queries:
   ```php
   // ✅ Correct
   Product::where('tenant_id', auth()->user()->tenant_id)->get();

   // ❌ Wrong - security issue!
   Product::all();
   ```

2. **Use eager loading** to prevent N+1 queries:
   ```php
   // ✅ Correct
   Product::with(['type', 'category', 'shop', 'variants'])->get();

   // ❌ Wrong - N+1 queries
   $products = Product::all();
   foreach ($products as $product) {
       echo $product->type->name; // Separate query each time
   }
   ```

3. **Use query scopes** for reusable filters:
   ```php
   Product::forTenant(auth()->user()->tenant_id)
       ->active()
       ->latest()
       ->get();
   ```

4. **Cast enums** for type safety:
   ```php
   protected $casts = [
       'status' => OrderStatus::class,
       'payment_status' => PaymentStatus::class,
   ];
   ```

---

## Authentication & Authorization

### Authentication (Laravel Fortify)

Fortify is configured with 2FA enabled. Configuration in `config/fortify.php`:

```php
'features' => [
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],

'home' => '/dashboard',
```

### Accessing Current User

```php
// In controllers
$user = auth()->user();
$user = $request->user();

// Get tenant ID
$tenantId = auth()->user()->tenant_id;
```

### Authorization with Policies

All authorization should use policies in `app/Policies/`.

**ProductPolicy.php:**

```php
namespace App\Policies;

use App\Models\User;
use App\Models\Product;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->can('view_products');
    }

    public function view(User $user, Product $product): bool
    {
        return $user->tenant_id === $product->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->role->can('create_products');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->tenant_id === $product->tenant_id
            && $user->role->can('manage_products');
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->tenant_id === $product->tenant_id
            && $user->role->can('delete_products');
    }
}
```

### Using Authorization in Controllers

```php
use Illuminate\Support\Facades\Gate;

// For resource policies
Gate::authorize('viewAny', Product::class);
Gate::authorize('view', $product);
Gate::authorize('update', $product);

// Or use the authorize method
$this->authorize('update', $product);
```

### User Roles & Permissions

**UserRole Enum** (`app/Enums/UserRole.php`):

```php
enum UserRole: string
{
    case OWNER = 'owner';
    case ADMIN = 'admin';
    case MANAGER = 'manager';
    case STAFF = 'staff';

    public function label(): string
    {
        return match ($this) {
            self::OWNER => 'Owner',
            self::ADMIN => 'Administrator',
            self::MANAGER => 'Manager',
            self::STAFF => 'Staff',
        };
    }

    public function can(string $permission): bool
    {
        return in_array($permission, $this->permissions());
    }

    public function permissions(): array
    {
        return match ($this) {
            self::OWNER => [
                'manage_all',
                'view_products',
                'create_products',
                'manage_products',
                'delete_products',
                'manage_orders',
                'manage_staff',
                'manage_settings',
            ],
            self::ADMIN => [
                'view_products',
                'create_products',
                'manage_products',
                'delete_products',
                'manage_orders',
                'manage_staff',
            ],
            self::MANAGER => [
                'view_products',
                'create_products',
                'manage_products',
                'manage_orders',
            ],
            self::STAFF => [
                'view_products',
                'manage_orders',
            ],
        };
    }
}
```

### Frontend Authorization

```typescript
import { usePage } from '@inertiajs/react';
import { useUserRole } from '@/context/UserRoleContext';

const { auth } = usePage<SharedData>().props;
const { can } = useUserRole();

// Check role
if (auth.user.role === 'admin') {
    // Show admin features
}

// Check permission
if (can('create_products')) {
    <Button>Create Product</Button>
}
```

---

## Testing with Pest

### Test Structure

Tests are in `/tests/Feature/` and use Pest PHP.

**Basic Test Pattern:**

```php
<?php

use App\Models\User;
use App\Models\Product;
use App\Models\Tenant;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to login', function () {
    $this->get(route('products.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view products', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('products.index'))
        ->assertOk()
        ->assertInertia(fn($page) => $page
            ->component('Products/Index')
            ->has('products.data')
        );
});

test('users can create products', function () {
    $user = User::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $user->tenant_id]);

    $this->actingAs($user)
        ->post(route('products.store'), [
            'shop_id' => $shop->id,
            'name' => 'Test Product',
            'product_type_slug' => 'simple',
            'sku' => 'TEST-001',
            'price' => 100,
        ])
        ->assertRedirect(route('products.index'))
        ->assertSessionHas('success');

    expect(Product::where('name', 'Test Product')->exists())->toBeTrue();
});

test('users cannot view products from other tenants', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create(); // Different tenant

    $product = Product::factory()->create(['tenant_id' => $user2->tenant_id]);

    $this->actingAs($user1)
        ->get(route('products.show', $product))
        ->assertForbidden();
});
```

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=ProductTest

# Run tests with coverage
php artisan test --coverage
```

---

## Key Conventions

### Naming Conventions

- **Controllers:** Singular resource name + `Controller` (e.g., `ProductController`, `OrderController`)
- **Models:** Singular PascalCase (e.g., `Product`, `Order`, `StockMovement`)
- **Database tables:** Plural snake_case (e.g., `products`, `orders`, `stock_movements`)
- **Routes:** Plural kebab-case (e.g., `/products`, `/stock-movements`)
- **TypeScript files:** kebab-case (e.g., `product-card.tsx`, `order-table.tsx`)
- **React components:** PascalCase (e.g., `ProductCard`, `OrderTable`)
- **TypeScript types:** PascalCase (e.g., `Product`, `OrderStatus`)
- **Utilities:** camelCase (e.g., `flattenCategories`, `transformConfigBySchema`)

### File Organization

- **Pages:** `/resources/js/pages/{Feature}/Index|Create|Edit|Show.tsx`
- **Reusable components:** `/resources/js/components/{domain}/`
- **UI primitives:** `/resources/js/components/ui/`
- **Business logic:** `/app/Services/`
- **Validation:** `/app/Http/Requests/`
- **Authorization:** `/app/Policies/`
- **Types:** `/resources/js/types/{feature}.ts`

### Code Style

**PHP:**
- Use strict types: `declare(strict_types=1);`
- Type hint everything (parameters, return types)
- Use readonly properties in PHP 8.2+
- Follow PSR-12 coding standards
- Use Laravel Pint for formatting: `composer run-script format`

**TypeScript:**
- Enable strict mode in `tsconfig.json`
- Define interfaces for all props
- Use TypeScript over JavaScript
- Format with Prettier: `npm run format`
- Lint with ESLint: `npm run lint`

---

## Creating New Features

### Workflow for Adding a New CRUD Resource

#### 1. Create Migration

```bash
php artisan make:migration create_categories_table
```

```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('slug');
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->unique(['tenant_id', 'slug']);
    $table->index('tenant_id');
});
```

#### 2. Create Model

```bash
php artisan make:model Category
```

```php
class Category extends Model
{
    protected $fillable = [
        'tenant_id', 'name', 'slug', 'description', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
```

#### 3. Create Policy

```bash
php artisan make:policy CategoryPolicy --model=Category
```

```php
class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role->can('view_categories');
    }

    public function create(User $user): bool
    {
        return $user->role->can('manage_categories');
    }

    public function update(User $user, Category $category): bool
    {
        return $user->tenant_id === $category->tenant_id
            && $user->role->can('manage_categories');
    }
}
```

#### 4. Create Form Requests

```bash
php artisan make:request CreateCategoryRequest
php artisan make:request UpdateCategoryRequest
```

```php
class CreateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Category::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
```

#### 5. Create Controller

```bash
php artisan make:controller CategoryController --resource
```

```php
class CategoryController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Category::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Categories/Index', [
            'categories' => Category::forTenant($tenantId)
                ->latest()
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Category::class);

        return Inertia::render('Categories/Create');
    }

    public function store(CreateCategoryRequest $request): RedirectResponse
    {
        $category = Category::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function edit(Category $category): Response
    {
        Gate::authorize('update', $category);

        return Inertia::render('Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        Gate::authorize('update', $category);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        Gate::authorize('delete', $category);

        $category->delete();

        return redirect()->route('categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
```

#### 6. Add Routes

In `routes/web.php`:

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('categories', CategoryController::class);
});
```

#### 7. Create TypeScript Types

Create `resources/js/types/category.ts`:

```typescript
export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CategoryListResponse {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
```

#### 8. Create React Pages

**Index Page** (`resources/js/pages/Categories/Index.tsx`):

```typescript
import AppLayout from '@/layouts/AppLayout';
import { Category } from '@/types/category';
import { Head, Link } from '@inertiajs/react';
import Button from '@/components/ui/button/Button';
import { Plus } from 'lucide-react';

interface Props {
    categories: { data: Category[] };
}

export default function Index({ categories }: Props) {
    return (
        <AppLayout>
            <Head title="Categories" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <Link href="/categories/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Category
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4">
                    {categories.data.map(category => (
                        <div key={category.id} className="rounded-lg border p-4">
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
```

**Create Page** (`resources/js/pages/Categories/Create.tsx`):

```typescript
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head } from '@inertiajs/react';

export default function Create() {
    return (
        <AppLayout>
            <Head title="Create Category" />

            <div className="mx-auto max-w-2xl">
                <h1 className="mb-6 text-2xl font-bold">Create Category</h1>

                <Form
                    action={CategoryController.store.url()}
                    method="post"
                >
                    {({ errors, processing }) => (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    name="name"
                                    error={!!errors.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <TextArea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    error={!!errors.description}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Category'}
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
```

#### 9. Run Wayfinder

Wayfinder runs automatically with Vite:

```bash
npm run dev
```

This generates the TypeScript controller actions in `/resources/js/actions/`.

#### 10. Write Tests

Create `tests/Feature/CategoryTest.php`:

```php
<?php

use App\Models\Category;
use App\Models\User;

test('users can view categories', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('categories.index'))
        ->assertOk();
});

test('users can create categories', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('categories.store'), [
            'name' => 'Test Category',
            'description' => 'Test description',
            'is_active' => true,
        ])
        ->assertRedirect(route('categories.index'));

    expect(Category::where('name', 'Test Category')->exists())->toBeTrue();
});
```

---

## Common Utilities

### cn() - Tailwind Class Merging

Merge Tailwind classes with proper precedence:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
    'rounded-lg p-4',
    isActive && 'bg-blue-500',
    className
)}>
```

### flattenCategories() - Nested Categories

Flatten hierarchical categories for select dropdowns:

```typescript
import { flattenCategories } from '@/lib/utils';

const options = flattenCategories(categories);

<Select name="category_id">
    {options.map(option => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ))}
</Select>
```

### transformConfigBySchema() - Dynamic Fields

Transform form data based on JSON schema:

```typescript
import { transformConfigBySchema } from '@/lib/utils';

<Form
    transform={(data) => transformConfigBySchema(data, schemaProperties)}
>
```

---

## Development Workflow

### Starting Development

```bash
# Start all services (server, queue, vite)
composer dev

# Or start with SSR
composer dev:ssr

# Or start individually
php artisan serve          # Server at http://localhost:8000
php artisan queue:listen   # Queue worker
npm run dev                # Vite dev server
```

### Running Tests

```bash
composer test
# or
php artisan test
```

### Code Formatting

```bash
# PHP (Laravel Pint)
./vendor/bin/pint

# TypeScript/React (Prettier + ESLint)
npm run format
npm run lint
```

### Type Checking

```bash
npm run types
```

### Database Operations

```bash
# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Fresh migration with seeding
php artisan migrate:fresh --seed

# Create seeder
php artisan make:seeder CategorySeeder
```

### Clearing Caches

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## Important Reminders for AI Assistants

### Security & Multi-Tenancy

1. **ALWAYS scope queries by tenant_id** - This is critical for data isolation
2. **NEVER skip authorization** - Use `Gate::authorize()` before every action
3. **Validate all input** - Use FormRequest classes, not manual validation
4. **Use parameterized queries** - Eloquent handles this, but be careful with raw SQL

### Type Safety

1. **Define TypeScript types** for all Laravel responses
2. **Use Wayfinder-generated controllers** for type-safe routing
3. **Enable strict TypeScript** mode
4. **Cast PHP enums** in models for type safety

### Performance

1. **Eager load relationships** to prevent N+1 queries
2. **Use pagination** for large datasets
3. **Cache expensive queries** and invalidate on mutations
4. **Use database transactions** for multi-model operations

### Code Quality

1. **Keep controllers thin** - Business logic goes in services
2. **Write tests** for all features using Pest
3. **Follow naming conventions** consistently
4. **Use Inertia's Form component** for all forms
5. **Extract reusable components** into `/components/ui/`

### TailAdmin Basis

This is a starter kit built on the **TailAdmin dashboard template**, which provides:
- Pre-built UI components in `/resources/js/components/ui/`
- Dashboard layouts with sidebar and header
- Chart components using ApexCharts
- Table components with sorting and pagination
- Form components with validation styling
- Theme switching (light/dark mode)

When creating new features, **reuse existing UI components** from TailAdmin rather than building from scratch.

---

## Questions & Support

For questions about:
- **Laravel:** Check [Laravel documentation](https://laravel.com/docs)
- **Inertia.js:** Check [Inertia.js documentation](https://inertiajs.com)
- **Wayfinder:** Check [Wayfinder documentation](https://laravel.com/docs/wayfinder)
- **Pest:** Check [Pest documentation](https://pestphp.com)
- **React:** Check [React documentation](https://react.dev)
- **Tailwind CSS:** Check [Tailwind documentation](https://tailwindcss.com)

---

**Last Updated:** 2025-11-14
**Version:** 1.0.1
