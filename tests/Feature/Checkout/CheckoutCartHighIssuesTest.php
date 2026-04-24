<?php

declare(strict_types=1);

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Services\CartService;
use App\Services\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

// ── Shared helpers ───────────────────────────────────────────────────────────

function makeCheckoutScaffold(int $stock = 10, int $reservedQty = 0, float $price = 1000.0): array
{
    $shopType = ShopType::query()->firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );

    $tenant = Tenant::query()->create([
        'name' => fake()->company(),
        'slug' => fake()->unique()->slug(),
        'owner_email' => fake()->unique()->safeEmail(),
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $shop = Shop::query()->create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => 'Test Shop',
        'slug' => fake()->unique()->slug(),
        'is_active' => true,
        'storefront_enabled' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
        'vat_enabled' => false,
        'vat_rate' => 0,
    ]);

    $customer = Customer::query()->create([
        'tenant_id' => $tenant->id,
        'first_name' => 'Test',
        'last_name' => 'Customer',
        'email' => fake()->unique()->safeEmail(),
        'password' => Hash::make('password'),
        'is_active' => true,
    ]);

    $productType = ProductType::query()->firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'config_schema' => [], 'is_active' => true]
    );

    $product = Product::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Test Product',
        'slug' => fake()->unique()->slug(),
        'is_active' => true,
        'track_stock' => true,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => fake()->unique()->regexify('[A-Z]{3}-[0-9]{4}'),
        'price' => $price,
        'is_active' => true,
        'is_available_online' => true,
    ]);

    $location = InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => $stock,
        'reserved_quantity' => $reservedQty,
    ]);

    $cart = Cart::query()->forceCreate([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => $customer->id,
    ]);

    return compact('tenant', 'shop', 'customer', 'variant', 'location', 'cart');
}

// ── Issue 5: reserved_quantity release skipped when reserved < ordered ────────

it('createOrderFromCart clamps reserved_quantity to zero when reserved is less than ordered quantity', function () {
    // reserved_quantity=3, cart item quantity=5 — the conditional guard skips deduction
    [
        'shop' => $shop,
        'customer' => $customer,
        'variant' => $variant,
        'location' => $location,
        'cart' => $cart,
    ] = makeCheckoutScaffold(stock: 10, reservedQty: 3);

    CartItem::query()->create([
        'cart_id' => $cart->id,
        'tenant_id' => $cart->tenant_id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 5,
        'price' => $variant->price,
    ]);

    app(CheckoutService::class)->createOrderFromCart(
        $cart,
        $customer,
        ['line1' => '1 Test St'],
        ['line1' => '1 Test St'],
        'cash_on_delivery'
    );

    expect($location->fresh()->reserved_quantity)->toBe(0);
});

// ── Issue 6: updateQuantity stock check and write not atomic ─────────────────

it('updateQuantity acquires a row lock before validating and writing the new quantity', function () {
    [
        'shop' => $shop,
        'variant' => $variant,
        'cart' => $cart,
    ] = makeCheckoutScaffold(stock: 10);

    $item = CartItem::query()->create([
        'cart_id' => $cart->id,
        'tenant_id' => $cart->tenant_id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 1,
        'price' => $variant->price,
    ]);

    $item->load('cart', 'productVariant.product');

    DB::enableQueryLog();
    app(CartService::class)->updateQuantity($item, 3);
    $sqls = collect(DB::getQueryLog())->pluck('query');
    DB::disableQueryLog();

    expect($sqls->some(fn ($q) => str_contains(strtolower($q), 'for update')))->toBeTrue();
});

// ── Issue 7: generateOrderNumber uses self::where() instead of self::query() ─

it('generateOrderNumber returns a correctly formatted sequential order number', function () {
    ['tenant' => $tenant] = makeCheckoutScaffold();

    $number = Order::generateOrderNumber($tenant->id);

    expect($number)->toMatch('/^ORD-\d{8}-\d{4}$/');
});

// ── Issue 8: mergeGuestCartIntoCustomerCart calls getCart() inside transaction ─

it('mergeGuestCartIntoCustomerCart returns a valid customer cart when there is no guest cart', function () {
    [
        'shop' => $shop,
        'customer' => $customer,
    ] = makeCheckoutScaffold();

    $result = app(CartService::class)->mergeGuestCartIntoCustomerCart(
        'nonexistent-session-id',
        $customer->id,
        $shop->id
    );

    expect($result)->toBeInstanceOf(\App\Models\Cart::class)
        ->and($result->customer_id)->toBe($customer->id)
        ->and($result->shop_id)->toBe($shop->id);
});

it('mergeGuestCartIntoCustomerCart creates the customer cart before opening the transaction', function () {
    ['shop' => $shop, 'customer' => $customer, 'cart' => $existingCart] = makeCheckoutScaffold();

    // Delete the scaffold cart so getCart() must INSERT a new one (no existing DB row).
    $existingCart->forceDelete();

    $transactionLevelAtCartCreation = null;

    DB::listen(function ($query) use (&$transactionLevelAtCartCreation) {
        if (str_contains($query->sql, 'insert into `carts`')) {
            $transactionLevelAtCartCreation = DB::transactionLevel();
        }
    });

    app(CartService::class)->mergeGuestCartIntoCustomerCart(
        'nonexistent-session-id',
        $customer->id,
        $shop->id
    );

    // RefreshDatabase holds the outer transaction at level 1.
    // Before fix: getCart() runs inside DB::transaction() → INSERT fires at level 2.
    // After fix:  getCart() runs before DB::transaction() → INSERT fires at level 1.
    expect($transactionLevelAtCartCreation)->toBe(1);
});

// ── Issue 9: cancelByCustomer passes enum instance rather than ->value ────────

it('cancelByCustomer stores the status as the canonical string value in the database', function () {
    // The fix also corrects the reference_number suffix on the RETURN stock movement
    // so that it doesn't collide with the SALE movement from order creation.
    [
        'shop' => $shop,
        'customer' => $customer,
        'variant' => $variant,
        'cart' => $cart,
    ] = makeCheckoutScaffold(stock: 10);

    CartItem::query()->create([
        'cart_id' => $cart->id,
        'tenant_id' => $cart->tenant_id,
        'product_variant_id' => $variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $variant->id,
        'quantity' => 1,
        'price' => $variant->price,
    ]);

    $order = app(CheckoutService::class)->createOrderFromCart(
        $cart, $customer,
        ['line1' => '1 Test St'], ['line1' => '1 Test St'],
        'cash_on_delivery'
    );

    app(CheckoutService::class)->cancelByCustomer($order->id, $customer, $shop, 'Changed my mind');

    expect(DB::table('orders')->where('id', $order->id)->value('status'))->toBe('cancelled');
});
