# E-Commerce Implementation Plan

**Date:** 2025-11-15
**Based on:** E-COMMERCE_AUDIT.md + Architectural Decisions
**Status:** Ready to Implement

---

## 🎯 Architectural Decisions

### ✅ Confirmed Requirements

1. **Customer Authentication:** Separate `customers` table with dedicated auth guard
2. **Order Type:** Add `order_type` enum to distinguish customer/purchase_order/internal orders
3. **Payment Method:** Cash on delivery for MVP
4. **Storefront Access:** Each shop has own storefront, high-level tenant users can toggle
5. **Checkout Flow:** Single-page checkout
6. **Wholesale Storefront:** Wholesale shops can enable storefront and sell select items at retail prices
7. **Currency:** Per-shop currency configuration
8. **Routes/Forms:** All routes use Wayfinder, all forms use Inertia `<Form>` component

---

## 📋 Phase 0: Architecture Updates (Week 0)

**Priority:** CRITICAL - Must complete before frontend work
**Duration:** 2-3 days

### 1. Customer Authentication System

#### Database Migration: `create_customers_authentication_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop placeholder customers table
        Schema::dropIfExists('customers');

        // Create proper customers table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->boolean('marketing_opt_in')->default(false);
            $table->rememberToken();
            $table->timestamps();

            $table->index(['tenant_id', 'email']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
```

#### Update Customer Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Customer extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'is_active',
        'marketing_opt_in',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'marketing_opt_in' => 'boolean',
        'password' => 'hashed',
    ];

    // Relationships
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class, 'customer_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}
```

#### Configure Customer Auth Guard

**config/auth.php:**

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    // Add customer guard
    'customer' => [
        'driver' => 'session',
        'provider' => 'customers',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\User::class,
    ],

    // Add customer provider
    'customers' => [
        'driver' => 'eloquent',
        'model' => App\Models\Customer::class,
    ],
],

'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => 'password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],

    // Add customer password resets
    'customers' => [
        'provider' => 'customers',
        'table' => 'password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

---

### 2. Order Type System

#### Migration: `add_order_type_to_orders_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['customer', 'purchase_order', 'internal'])
                ->default('customer')
                ->after('order_number');

            $table->index(['shop_id', 'order_type']);
            $table->index(['tenant_id', 'order_type']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('order_type');
        });
    }
};
```

#### Create OrderType Enum

```php
<?php

namespace App\Enums;

enum OrderType: string
{
    case CUSTOMER = 'customer';           // B2C e-commerce orders
    case PURCHASE_ORDER = 'purchase_order'; // B2B supplier orders
    case INTERNAL = 'internal';            // Internal shop transfers

    public function label(): string
    {
        return match($this) {
            self::CUSTOMER => 'Customer Order',
            self::PURCHASE_ORDER => 'Purchase Order',
            self::INTERNAL => 'Internal Transfer',
        };
    }

    public function icon(): string
    {
        return match($this) {
            self::CUSTOMER => 'shopping-cart',
            self::PURCHASE_ORDER => 'truck',
            self::INTERNAL => 'repeat',
        };
    }
}
```

#### Update Order Model

```php
use App\Enums\OrderType;

class Order extends Model
{
    protected $casts = [
        'order_type' => OrderType::class,
        // ... existing casts
    ];

    // Scopes
    public function scopeCustomerOrders($query)
    {
        return $query->where('order_type', OrderType::CUSTOMER);
    }

    public function scopePurchaseOrders($query)
    {
        return $query->where('order_type', OrderType::PURCHASE_ORDER);
    }

    public function scopeInternalOrders($query)
    {
        return $query->where('order_type', OrderType::INTERNAL);
    }
}
```

---

### 3. Currency Configuration System

#### Migration: `add_currency_to_shops_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->string('currency', 3)->default('NGN')->after('inventory_model');
            $table->string('currency_symbol', 10)->default('₦')->after('currency');
            $table->tinyInteger('currency_decimals')->default(2)->after('currency_symbol');

            $table->index('currency');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['currency', 'currency_symbol', 'currency_decimals']);
        });
    }
};
```

#### Create CurrencyHelper

```php
<?php

namespace App\Helpers;

use App\Models\Shop;

class CurrencyHelper
{
    public static function format(float $amount, Shop $shop): string
    {
        $decimals = $shop->currency_decimals ?? 2;
        $formattedAmount = number_format($amount, $decimals);

        return $shop->currency_symbol . $formattedAmount;
    }

    public static function getSupportedCurrencies(): array
    {
        return [
            'NGN' => ['name' => 'Nigerian Naira', 'symbol' => '₦', 'decimals' => 2],
            'USD' => ['name' => 'US Dollar', 'symbol' => '$', 'decimals' => 2],
            'EUR' => ['name' => 'Euro', 'symbol' => '€', 'decimals' => 2],
            'GBP' => ['name' => 'British Pound', 'symbol' => '£', 'decimals' => 2],
            'GHS' => ['name' => 'Ghana Cedi', 'symbol' => '₵', 'decimals' => 2],
            'KES' => ['name' => 'Kenyan Shilling', 'symbol' => 'KSh', 'decimals' => 2],
            'ZAR' => ['name' => 'South African Rand', 'symbol' => 'R', 'decimals' => 2],
        ];
    }
}
```

---

### 4. Wholesale Retail Pricing System

#### Migration: `add_retail_pricing_to_product_variants`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('retail_price', 15, 2)->nullable()->after('price');
            $table->boolean('allow_retail_sales')->default(false)->after('is_available_online');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['retail_price', 'allow_retail_sales']);
        });
    }
};
```

#### Migration: `add_retail_settings_to_shops`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->boolean('allow_retail_sales')->default(false)
                ->after('storefront_enabled')
                ->comment('For wholesale shops: allow retail sales on storefront');
        });
    }

    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn('allow_retail_sales');
        });
    }
};
```

#### Update StorefrontService

```php
public function getProducts(Shop $shop, ...): LengthAwarePaginator
{
    $query = Product::where('shop_id', $shop->id)
        ->where('is_active', true)
        ->with([
            'variants' => function($q) use ($shop) {
                $q->where('is_active', true)
                  ->where('is_available_online', true);

                // If wholesale shop, only show retail-enabled variants
                if ($shop->inventory_model === 'wholesale_only' && $shop->allow_retail_sales) {
                    $q->where('allow_retail_sales', true);
                }
            },
            'category'
        ]);

    // ... rest of method
}
```

#### Add Helper Method to ProductVariant

```php
class ProductVariant extends Model
{
    public function getStorefrontPrice(Shop $shop): float
    {
        // If wholesale shop with retail sales enabled, use retail price
        if ($shop->inventory_model === 'wholesale_only' &&
            $shop->allow_retail_sales &&
            $this->allow_retail_sales &&
            $this->retail_price) {
            return $this->retail_price;
        }

        // Otherwise use standard wholesale/retail price
        return $this->price;
    }
}
```

---

### 5. Storefront Toggle Authorization

#### Create StorefrontPolicy

```php
<?php

namespace App\Policies;

use App\Models\Shop;
use App\Models\User;

class StorefrontPolicy
{
    /**
     * Determine if user can enable/disable storefront.
     */
    public function manageStorefront(User $user, Shop $shop): bool
    {
        // Must be same tenant
        if ($user->tenant_id !== $shop->tenant_id) {
            return false;
        }

        // Only high-level roles can manage storefront
        // Owner (100), General Manager (80), Store Manager (60)
        return $user->role->level() >= 60;
    }

    /**
     * Determine if user can update storefront settings.
     */
    public function updateSettings(User $user, Shop $shop): bool
    {
        return $this->manageStorefront($user, $shop);
    }
}
```

#### Register Policy

**app/Providers/AuthServiceProvider.php:**

```php
protected $policies = [
    // ... existing policies
    Shop::class => StorefrontPolicy::class,
];
```

---

## 📋 Phase 1: Backend Services (Week 1)

### Task 1.1: CustomerAuthController

**app/Http/Controllers/Storefront/CustomerAuthController.php:**

```php
<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Shop;
use App\Services\CartService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    /**
     * Display customer login form.
     */
    public function showLogin(Shop $shop): Response
    {
        return Inertia::render('Storefront/Auth/Login', [
            'shop' => $shop,
        ]);
    }

    /**
     * Handle customer login.
     */
    public function login(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $customer = Customer::where('email', $request->email)
            ->where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        Auth::guard('customer')->login($customer, $request->boolean('remember'));

        // Merge guest cart into customer cart
        $sessionId = session()->getId();
        $this->cartService->mergeGuestCartIntoCustomerCart($sessionId, $customer->id, $shop->id);

        $request->session()->regenerate();

        return redirect()->intended(route('storefront.index', $shop->slug));
    }

    /**
     * Display customer registration form.
     */
    public function showRegister(Shop $shop): Response
    {
        return Inertia::render('Storefront/Auth/Register', [
            'shop' => $shop,
        ]);
    }

    /**
     * Handle customer registration.
     */
    public function register(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:customers'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'marketing_opt_in' => ['boolean'],
        ]);

        $customer = Customer::create([
            'tenant_id' => $shop->tenant_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'marketing_opt_in' => $request->boolean('marketing_opt_in'),
        ]);

        event(new Registered($customer));

        Auth::guard('customer')->login($customer);

        // Merge guest cart
        $sessionId = session()->getId();
        $this->cartService->mergeGuestCartIntoCustomerCart($sessionId, $customer->id, $shop->id);

        return redirect()->route('storefront.index', $shop->slug);
    }

    /**
     * Handle customer logout.
     */
    public function logout(Request $request, Shop $shop): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('storefront.index', $shop->slug);
    }
}
```

---

### Task 1.2: CheckoutService

**app/Services/CheckoutService.php:**

```php
<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected StockMovementService $stockMovementService
    ) {}

    /**
     * Create order from cart.
     */
    public function createOrderFromCart(
        Cart $cart,
        Customer $customer,
        array $shippingAddress,
        array $billingAddress,
        string $paymentMethod = 'cash_on_delivery',
        ?string $customerNotes = null
    ): Order {
        return DB::transaction(function () use (
            $cart,
            $customer,
            $shippingAddress,
            $billingAddress,
            $paymentMethod,
            $customerNotes
        ) {
            $cartSummary = $this->cartService->getCartSummary($cart);

            // Validate cart has items
            if (empty($cartSummary['items'])) {
                throw new \Exception('Cannot checkout with empty cart');
            }

            // Validate stock availability one more time
            foreach ($cartSummary['items'] as $item) {
                if ($item->productVariant->available_stock < $item->quantity) {
                    throw new \Exception(
                        "Insufficient stock for {$item->productVariant->product->name}. " .
                        "Only {$item->productVariant->available_stock} available."
                    );
                }
            }

            // Create order
            $order = Order::create([
                'tenant_id' => $cart->shop->tenant_id,
                'shop_id' => $cart->shop_id,
                'customer_id' => $customer->id,
                'order_number' => $this->generateOrderNumber(),
                'order_type' => OrderType::CUSTOMER,
                'status' => OrderStatus::PENDING,
                'payment_status' => PaymentStatus::UNPAID,
                'payment_method' => $paymentMethod,
                'subtotal' => $cartSummary['subtotal'],
                'tax_amount' => $cartSummary['tax'],
                'shipping_cost' => $cartSummary['shipping_fee'],
                'total_amount' => $cartSummary['total'],
                'shipping_address' => json_encode($shippingAddress),
                'billing_address' => json_encode($billingAddress),
                'customer_notes' => $customerNotes,
                'created_by' => $customer->id,
            ]);

            // Create order items and reserve stock
            foreach ($cartSummary['items'] as $cartItem) {
                // Create order item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $cartItem->product_variant_id,
                    'product_packaging_type_id' => $cartItem->product_packaging_type_id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->price,
                    'total_amount' => $cartItem->price * $cartItem->quantity,
                ]);

                // Reserve stock via StockMovementService
                $this->stockMovementService->recordMovement(
                    $cartItem->productVariant,
                    -$cartItem->quantity, // Negative for outbound
                    \App\Enums\StockMovementType::SALE,
                    "E-commerce order {$order->order_number}",
                    $customer->id,
                    null, // from_location (will be determined by service)
                    null, // to_location
                    null, // packaging_type_id
                    0,    // package_quantity
                    $order->id
                );
            }

            // Clear cart
            $cart->items()->delete();
            $cart->delete();

            return $order->fresh(['items.productVariant.product', 'items.packagingType']);
        });
    }

    /**
     * Generate unique order number.
     */
    protected function generateOrderNumber(): string
    {
        return 'ORD-' . strtoupper(uniqid());
    }
}
```

---

### Task 1.3: CheckoutController

**app/Http/Controllers/Storefront/CheckoutController.php:**

```php
<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService
    ) {}

    /**
     * Display checkout page.
     */
    public function index(Shop $shop): Response|RedirectResponse
    {
        $customer = auth('customer')->user();

        if (!$customer) {
            return redirect()
                ->route('customer.login', $shop->slug)
                ->with('info', 'Please login to continue with checkout');
        }

        $cart = $this->cartService->getCart($shop, $customer->id);
        $cartSummary = $this->cartService->getCartSummary($cart);

        // Redirect if cart is empty
        if ($cartSummary['item_count'] === 0) {
            return redirect()
                ->route('storefront.cart', $shop->slug)
                ->with('error', 'Your cart is empty');
        }

        // Get customer's saved addresses
        $addresses = $customer->addresses()->get();

        return Inertia::render('Storefront/Checkout', [
            'shop' => $shop,
            'cart' => $cart->load(['items.productVariant.product', 'items.packagingType']),
            'cartSummary' => $cartSummary,
            'addresses' => $addresses,
            'customer' => $customer,
        ]);
    }

    /**
     * Process checkout and create order.
     */
    public function process(Request $request, Shop $shop): RedirectResponse
    {
        $customer = auth('customer')->user();

        if (!$customer) {
            return redirect()->route('customer.login', $shop->slug);
        }

        $validated = $request->validate([
            'shipping_address' => ['required', 'array'],
            'shipping_address.first_name' => ['required', 'string', 'max:255'],
            'shipping_address.last_name' => ['required', 'string', 'max:255'],
            'shipping_address.phone' => ['required', 'string', 'max:50'],
            'shipping_address.address_line_1' => ['required', 'string', 'max:255'],
            'shipping_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required', 'string', 'max:100'],
            'shipping_address.state' => ['required', 'string', 'max:100'],
            'shipping_address.postal_code' => ['nullable', 'string', 'max:20'],
            'shipping_address.country' => ['required', 'string', 'max:100'],

            'billing_same_as_shipping' => ['required', 'boolean'],
            'billing_address' => ['required_if:billing_same_as_shipping,false', 'array'],

            'payment_method' => ['required', 'string', 'in:cash_on_delivery'],
            'customer_notes' => ['nullable', 'string', 'max:500'],
            'save_addresses' => ['boolean'],
        ]);

        try {
            $cart = $this->cartService->getCart($shop, $customer->id);

            // Determine billing address
            $billingAddress = $validated['billing_same_as_shipping']
                ? $validated['shipping_address']
                : $validated['billing_address'];

            // Create order
            $order = $this->checkoutService->createOrderFromCart(
                $cart,
                $customer,
                $validated['shipping_address'],
                $billingAddress,
                $validated['payment_method'],
                $validated['customer_notes'] ?? null
            );

            // Save addresses if requested
            if ($validated['save_addresses'] ?? false) {
                $this->saveCustomerAddress($customer, $validated['shipping_address'], 'shipping');

                if (!$validated['billing_same_as_shipping']) {
                    $this->saveCustomerAddress($customer, $billingAddress, 'billing');
                }
            }

            // Send order confirmation email (TODO)
            // Mail::to($customer->email)->send(new OrderConfirmation($order));

            return redirect()
                ->route('storefront.checkout.success', [$shop->slug, $order])
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            return back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display order confirmation page.
     */
    public function success(Shop $shop, $orderId): Response
    {
        $customer = auth('customer')->user();

        $order = Order::where('id', $orderId)
            ->where('customer_id', $customer->id)
            ->with(['items.productVariant.product', 'items.packagingType'])
            ->firstOrFail();

        return Inertia::render('Storefront/CheckoutSuccess', [
            'shop' => $shop,
            'order' => $order,
        ]);
    }

    /**
     * Save customer address.
     */
    protected function saveCustomerAddress($customer, array $addressData, string $type): void
    {
        $customer->addresses()->create([
            ...$addressData,
            'type' => $type,
            'is_default' => $customer->addresses()->where('type', $type)->count() === 0,
        ]);
    }
}
```

---

## 📋 Phase 2: Customer Portal (Week 2)

### Task 2.1: CustomerPortalController

**app/Http/Controllers/Storefront/CustomerPortalController.php:**

```php
<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Enums\OrderType;
use App\Models\Shop;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends Controller
{
    /**
     * Display customer dashboard.
     */
    public function dashboard(Shop $shop): Response
    {
        $customer = auth('customer')->user();

        $stats = [
            'total_orders' => $customer->orders()
                ->where('order_type', OrderType::CUSTOMER)
                ->count(),
            'pending_orders' => $customer->orders()
                ->where('order_type', OrderType::CUSTOMER)
                ->where('status', 'pending')
                ->count(),
            'total_spent' => $customer->orders()
                ->where('order_type', OrderType::CUSTOMER)
                ->where('payment_status', 'paid')
                ->sum('total_amount'),
        ];

        $recentOrders = $customer->orders()
            ->where('order_type', OrderType::CUSTOMER)
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Storefront/Account/Dashboard', [
            'shop' => $shop,
            'customer' => $customer,
            'stats' => $stats,
            'recentOrders' => $recentOrders,
        ]);
    }

    /**
     * Display order history.
     */
    public function orders(Request $request, Shop $shop): Response
    {
        $customer = auth('customer')->user();

        $orders = $customer->orders()
            ->where('order_type', OrderType::CUSTOMER)
            ->with(['items.productVariant.product'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Storefront/Account/Orders', [
            'shop' => $shop,
            'orders' => $orders,
        ]);
    }

    /**
     * Display single order details.
     */
    public function orderDetail(Shop $shop, $orderId): Response
    {
        $customer = auth('customer')->user();

        $order = $customer->orders()
            ->where('id', $orderId)
            ->where('order_type', OrderType::CUSTOMER)
            ->with(['items.productVariant.product', 'items.packagingType'])
            ->firstOrFail();

        return Inertia::render('Storefront/Account/OrderDetail', [
            'shop' => $shop,
            'order' => $order,
        ]);
    }

    /**
     * Display profile management page.
     */
    public function profile(Shop $shop): Response
    {
        $customer = auth('customer')->user();
        $addresses = $customer->addresses;

        return Inertia::render('Storefront/Account/Profile', [
            'shop' => $shop,
            'customer' => $customer,
            'addresses' => $addresses,
        ]);
    }

    /**
     * Update customer profile.
     */
    public function updateProfile(Request $request, Shop $shop)
    {
        $customer = auth('customer')->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'marketing_opt_in' => ['boolean'],
        ]);

        $customer->update($validated);

        return back()->with('success', 'Profile updated successfully');
    }
}
```

---

### Task 2.2: Update Routes

**routes/storefront.php:**

```php
<?php

use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\CustomerAuthController;
use App\Http\Controllers\Storefront\CustomerPortalController;
use App\Http\Controllers\Storefront\StorefrontController;
use Illuminate\Support\Facades\Route;

Route::prefix('store/{shop:slug}')->name('storefront.')->group(function () {
    // Public routes
    Route::get('/', [StorefrontController::class, 'index'])->name('index');
    Route::get('/products', [StorefrontController::class, 'products'])->name('products');
    Route::get('/products/{product:slug}', [StorefrontController::class, 'show'])->name('product');

    // Cart (guest + authenticated)
    Route::get('/cart', [CartController::class, 'index'])->name('cart');
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{item}', [CartController::class, 'destroy'])->name('cart.destroy');

    // Customer authentication
    Route::middleware('guest:customer')->group(function () {
        Route::get('/login', [CustomerAuthController::class, 'showLogin'])->name('login');
        Route::post('/login', [CustomerAuthController::class, 'login']);
        Route::get('/register', [CustomerAuthController::class, 'showRegister'])->name('register');
        Route::post('/register', [CustomerAuthController::class, 'register']);
    });

    Route::middleware('auth:customer')->group(function () {
        Route::post('/logout', [CustomerAuthController::class, 'logout'])->name('logout');

        // Checkout
        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');
        Route::get('/checkout/success/{order}', [CheckoutController::class, 'success'])->name('checkout.success');

        // Customer portal
        Route::prefix('account')->name('account.')->group(function () {
            Route::get('/', [CustomerPortalController::class, 'dashboard'])->name('dashboard');
            Route::get('/orders', [CustomerPortalController::class, 'orders'])->name('orders');
            Route::get('/orders/{order}', [CustomerPortalController::class, 'orderDetail'])->name('orders.show');
            Route::get('/profile', [CustomerPortalController::class, 'profile'])->name('profile');
            Route::patch('/profile', [CustomerPortalController::class, 'updateProfile'])->name('profile.update');
        });
    });
});
```

---

## 📋 Phase 3: Frontend Pages (Week 3-4)

All frontend pages MUST use:
- Wayfinder controller imports
- Inertia `<Form>` component
- Existing UI components from `@/components/ui/`
- Existing form components from `@/components/form/`

### File Structure

```
resources/js/
├── layouts/
│   └── StorefrontLayout.tsx                 ← NEW
│
├── pages/
│   └── Storefront/
│       ├── Home.tsx                         ← NEW
│       ├── Products.tsx                     ← NEW
│       ├── ProductDetail.tsx                ← NEW
│       ├── Cart.tsx                         ← NEW
│       ├── Checkout.tsx                     ← NEW
│       ├── CheckoutSuccess.tsx              ← NEW
│       ├── Auth/
│       │   ├── Login.tsx                    ← NEW
│       │   └── Register.tsx                 ← NEW
│       └── Account/
│           ├── Dashboard.tsx                ← NEW
│           ├── Orders.tsx                   ← NEW
│           ├── OrderDetail.tsx              ← NEW
│           └── Profile.tsx                  ← NEW
│
└── components/
    └── storefront/
        ├── ProductCard.tsx                  ← NEW
        ├── AddToCartButton.tsx              ← NEW
        ├── QuantitySelector.tsx             ← NEW
        ├── PriceDisplay.tsx                 ← NEW
        ├── ProductFilter.tsx                ← NEW
        ├── Breadcrumbs.tsx                  ← NEW
        ├── AddressForm.tsx                  ← NEW
        └── OrderSummary.tsx                 ← NEW
```

### Frontend Implementation Guide

**Key Pattern - Always use Wayfinder:**

```tsx
// ❌ DON'T DO THIS
import { router } from '@inertiajs/react';
router.visit('/store/' + shop.slug + '/cart');

// ✅ DO THIS
import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
router.visit(CartController.index.url({ shop: shop.slug }));
```

**Key Pattern - Always use <Form>:**

```tsx
// ❌ DON'T DO THIS
const handleSubmit = (e) => {
    e.preventDefault();
    router.post('/store/' + shop.slug + '/cart', data);
};

// ✅ DO THIS
import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import { Form } from '@inertiajs/react';

<Form
    action={CartController.store.url({ shop: shop.slug })}
    method="post"
>
    {({ errors, processing }) => (
        // form fields
    )}
</Form>
```

---

## 📋 Phase 4: Admin Tools (Week 5)

### Task 4.1: Storefront Settings Page

Create admin page for managing storefront settings.

**Location:** `resources/js/pages/Shops/StorefrontSettings.tsx`

**Features:**
- Enable/disable storefront toggle
- Currency selection
- Retail sales toggle (for wholesale shops)
- Shipping fee configuration
- Free shipping threshold
- Theme color picker
- Logo upload
- Banner image upload
- Meta title/description
- Social links

---

## 📋 Phase 5: Testing (Week 6)

### Required Tests

**Feature Tests:**
```
tests/Feature/Storefront/
├── CartTest.php
├── CheckoutTest.php
├── CustomerAuthTest.php
├── CustomerPortalTest.php
└── ProductBrowsingTest.php
```

**Example Test:**

```php
<?php

use App\Models\Customer;
use App\Models\Shop;
use App\Models\ProductVariant;

it('allows customer to add item to cart', function () {
    $shop = Shop::factory()->create(['storefront_enabled' => true]);
    $variant = ProductVariant::factory()->create([
        'shop_id' => $shop->id,
        'is_available_online' => true,
        'price' => 1000,
        'available_stock' => 10,
    ]);

    $response = $this->post(route('storefront.cart.store', $shop->slug), [
        'variant_id' => $variant->id,
        'quantity' => 2,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cart_items', [
        'product_variant_id' => $variant->id,
        'quantity' => 2,
        'price' => 1000,
    ]);
});

it('allows customer to checkout with cash on delivery', function () {
    $shop = Shop::factory()->create(['storefront_enabled' => true]);
    $customer = Customer::factory()->create(['tenant_id' => $shop->tenant_id]);

    // Add items to cart
    $cart = app(CartService::class)->getCart($shop, $customer->id);
    $variant = ProductVariant::factory()->create([
        'shop_id' => $shop->id,
        'price' => 5000,
        'available_stock' => 10,
    ]);

    app(CartService::class)->addItem($cart, $variant->id, 2);

    $this->actingAs($customer, 'customer');

    $response = $this->post(route('storefront.checkout.process', $shop->slug), [
        'shipping_address' => [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '08012345678',
            'address_line_1' => '123 Main St',
            'city' => 'Lagos',
            'state' => 'Lagos',
            'country' => 'Nigeria',
        ],
        'billing_same_as_shipping' => true,
        'payment_method' => 'cash_on_delivery',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('orders', [
        'customer_id' => $customer->id,
        'order_type' => 'customer',
        'payment_method' => 'cash_on_delivery',
        'total_amount' => 10000, // 2 x 5000
    ]);
});
```

---

## 📊 Summary Checklist

### Week 0: Architecture (MUST DO FIRST)
- [ ] Create customer authentication table migration
- [ ] Update Customer model
- [ ] Configure customer auth guard
- [ ] Add order_type to orders table
- [ ] Create OrderType enum
- [ ] Add currency fields to shops table
- [ ] Add retail pricing to product_variants table
- [ ] Add retail sales toggle to shops table
- [ ] Create StorefrontPolicy
- [ ] Run migrations: `php artisan migrate`

### Week 1: Backend Services
- [ ] Create CustomerAuthController
- [ ] Create CheckoutService
- [ ] Create CheckoutController
- [ ] Create CustomerPortalController
- [ ] Update routes/storefront.php
- [ ] Update CartService to use customer guard
- [ ] Update StorefrontService for wholesale retail pricing
- [ ] Test all backend endpoints with Postman/Insomnia

### Week 2-3: Frontend Implementation
- [ ] Create StorefrontLayout
- [ ] Create all Storefront pages (12 pages)
- [ ] Create all storefront components (8 components)
- [ ] Implement currency formatting throughout
- [ ] Test entire customer journey (browse → cart → checkout → order)
- [ ] Mobile responsive design

### Week 4: Admin & Polish
- [ ] Create storefront settings admin page
- [ ] Implement storefront toggle authorization
- [ ] Add currency selector
- [ ] Create cart cleanup command
- [ ] Schedule cart cleanup daily

### Week 5: Testing
- [ ] Write feature tests (cart, checkout, auth, portal)
- [ ] Write browser tests for critical flows
- [ ] Test wholesale retail pricing
- [ ] Test multi-currency
- [ ] Test order type separation
- [ ] Performance testing

---

## 🚀 Ready to Start?

Once you confirm, I'll start implementing in this order:

1. **Week 0 Migrations** (Architecture updates)
2. **Week 1 Backend** (Services & Controllers)
3. **Week 2-3 Frontend** (Pages & Components)
4. **Week 4 Admin** (Settings & Tools)
5. **Week 5 Testing** (Comprehensive tests)

Let me know when you're ready to begin!
