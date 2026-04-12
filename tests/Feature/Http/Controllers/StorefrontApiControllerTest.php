<?php

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->withStorefront()->create([
        'tenant_id' => $this->tenant->id,
        'storefront_enabled' => true,
    ]);
    $this->product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'track_stock' => false,
    ]);
    $this->variant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'is_available_online' => true,
    ]);
});

it('adds product to cart as guest', function () {
    $this->postJson("/store/{$this->shop->slug}/api/cart", [
        'variant_id' => $this->variant->id,
        'quantity' => 2,
    ])->assertOk()
        ->assertJsonStructure(['item', 'message']);
});

it('adds product to cart as authenticated customer', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/cart", [
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ])->assertOk()
        ->assertJsonStructure(['item', 'message']);
});

it('rejects adding non-existent variant to cart', function () {
    $this->postJson("/store/{$this->shop->slug}/api/cart", [
        'variant_id' => 99999,
        'quantity' => 1,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['variant_id']);
});

it('rejects adding cross-tenant variant to cart', function () {
    $otherTenant = Tenant::factory()->create();
    $otherShop = Shop::factory()->withStorefront()->create([
        'tenant_id' => $otherTenant->id,
        'storefront_enabled' => true,
    ]);
    $otherProduct = Product::factory()->create([
        'tenant_id' => $otherTenant->id,
        'shop_id' => $otherShop->id,
    ]);
    $otherVariant = ProductVariant::factory()->create([
        'product_id' => $otherProduct->id,
        'is_available_online' => true,
    ]);

    $this->postJson("/store/{$this->shop->slug}/api/cart", [
        'variant_id' => $otherVariant->id,
        'quantity' => 1,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['variant_id']);
});

it('updates cart item quantity', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $addResponse = $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/cart", [
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

    $itemId = $addResponse->json('item.id');

    $this->actingAs($customer, 'customer')
        ->patchJson("/store/{$this->shop->slug}/api/cart/{$itemId}", [
            'quantity' => 3,
        ])->assertOk()
        ->assertJson(['message' => 'Cart updated']);
});

it('rejects updating another carts item', function () {
    $otherCustomer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $otherCart = Cart::query()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $otherCustomer->id,
        'expires_at' => now()->addDays(30),
    ]);

    $otherItem = CartItem::query()->create([
        'cart_id' => $otherCart->id,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $this->variant->id,
        'sellable_type' => ProductVariant::class,
        'sellable_id' => $this->variant->id,
        'quantity' => 1,
        'price' => 1000,
    ]);

    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->patchJson("/store/{$this->shop->slug}/api/cart/{$otherItem->id}", [
            'quantity' => 5,
        ])->assertNotFound();
});

it('removes cart item', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $addResponse = $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/cart", [
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ]);

    $itemId = $addResponse->json('item.id');

    $this->actingAs($customer, 'customer')
        ->deleteJson("/store/{$this->shop->slug}/api/cart/{$itemId}")
        ->assertOk()
        ->assertJson(['message' => 'Item removed']);
});

it('returns cart summary', function () {
    $this->postJson("/store/{$this->shop->slug}/api/cart", [
        'variant_id' => $this->variant->id,
        'quantity' => 2,
    ]);

    $this->getJson("/store/{$this->shop->slug}/api/cart/summary")
        ->assertOk()
        ->assertJsonStructure(['subtotal', 'shipping_fee', 'tax', 'total', 'item_count']);
});

it('registers a new customer', function () {
    $this->postJson("/store/{$this->shop->slug}/api/auth/register", [
        'first_name' => 'Adebayo',
        'last_name' => 'Okonkwo',
        'email' => 'adebayo@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ])->assertOk()
        ->assertJsonStructure(['customer' => ['id', 'first_name', 'last_name', 'email'], 'message']);

    $this->assertDatabaseHas('customers', [
        'email' => 'adebayo@example.com',
        'tenant_id' => $this->tenant->id,
    ]);
});

it('logs in with valid credentials', function () {
    Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $this->postJson("/store/{$this->shop->slug}/api/auth/login", [
        'email' => 'test@example.com',
        'password' => 'password123',
    ])->assertOk()
        ->assertJsonStructure(['customer' => ['id', 'first_name', 'email'], 'message']);
});

it('rejects login with invalid credentials', function () {
    Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $this->postJson("/store/{$this->shop->slug}/api/auth/login", [
        'email' => 'test@example.com',
        'password' => 'wrongpassword',
    ])->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'The provided credentials do not match our records.');
});

it('rate limits login attempts', function () {
    for ($i = 0; $i < 6; $i++) {
        $response = $this->postJson("/store/{$this->shop->slug}/api/auth/login", [
            'email' => 'fake@example.com',
            'password' => 'wrong',
        ]);
    }

    $response->assertTooManyRequests();
});

it('logs out authenticated customer', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/auth/logout")
        ->assertOk()
        ->assertJson(['message' => 'Logged out']);
});

it('sends password reset link', function () {
    Notification::fake();

    Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
        'email' => 'forgot@example.com',
    ]);

    $this->postJson("/store/{$this->shop->slug}/api/auth/forgot-password", [
        'email' => 'forgot@example.com',
    ])->assertOk()
        ->assertJson(['message' => 'If an account exists, a reset link has been sent.']);
});

it('processes checkout with valid data', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
        'is_active' => true,
    ]);

    InventoryLocation::query()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_variant_id' => $this->variant->id,
        'location_type' => Shop::class,
        'location_id' => $this->shop->id,
        'quantity' => 50,
        'reserved_quantity' => 0,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/cart", [
            'variant_id' => $this->variant->id,
            'quantity' => 1,
        ])->assertOk();

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/checkout", [
            'shipping_address' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'phone' => '08012345678',
                'address_line_1' => '123 Test Street',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'postal_code' => '100001',
                'country' => 'NG',
            ],
            'billing_same_as_shipping' => true,
            'payment_method' => 'cash_on_delivery',
        ])->assertOk()
        ->assertJsonStructure(['order' => ['id', 'order_number'], 'redirect_url', 'message']);
});

it('rejects checkout when not authenticated', function () {
    $this->postJson("/store/{$this->shop->slug}/api/checkout", [
        'shipping_address' => [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '08012345678',
            'address_line_1' => '123 Test Street',
            'city' => 'Lagos',
            'state' => 'Lagos',
        ],
        'billing_same_as_shipping' => true,
        'payment_method' => 'cash_on_delivery',
    ])->assertUnauthorized();
});

it('rejects checkout with empty cart', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/checkout", [
            'shipping_address' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'phone' => '08012345678',
                'address_line_1' => '123 Test Street',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'postal_code' => '100001',
                'country' => 'NG',
            ],
            'billing_same_as_shipping' => true,
            'payment_method' => 'cash_on_delivery',
        ])->assertUnprocessable()
        ->assertJson(['message' => 'Your cart is empty.']);
});

it('updates customer profile', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->patchJson("/store/{$this->shop->slug}/api/account/profile", [
            'first_name' => 'Updated',
            'last_name' => 'Name',
        ])->assertOk()
        ->assertJson(['message' => 'Profile updated']);

    $this->assertDatabaseHas('customers', [
        'id' => $customer->id,
        'first_name' => 'Updated',
        'last_name' => 'Name',
    ]);
});

it('cancels a cancellable order', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $order = Order::query()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $customer->id,
        'order_number' => 'ORD-TEST-001',
        'order_type' => OrderType::CUSTOMER,
        'status' => OrderStatus::PENDING,
        'payment_status' => PaymentStatus::UNPAID,
        'payment_method' => 'cash_on_delivery',
        'subtotal' => 1000,
        'total_amount' => 1000,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/account/orders/{$order->id}/cancel", [
            'cancellation_reason' => 'Changed my mind',
        ])->assertOk()
        ->assertJson(['message' => 'Order cancelled']);

    $this->assertDatabaseHas('orders', [
        'id' => $order->id,
        'status' => OrderStatus::CANCELLED->value,
    ]);
});

it('rejects cancelling a non-cancellable order', function () {
    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $order = Order::query()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $customer->id,
        'order_number' => 'ORD-TEST-002',
        'order_type' => OrderType::CUSTOMER,
        'status' => OrderStatus::DELIVERED,
        'payment_status' => PaymentStatus::PAID,
        'payment_method' => 'cash_on_delivery',
        'subtotal' => 1000,
        'total_amount' => 1000,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/account/orders/{$order->id}/cancel")
        ->assertUnprocessable()
        ->assertJson(['message' => 'This order cannot be cancelled.']);
});

it('rejects cancelling another customers order', function () {
    $otherCustomer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $order = Order::query()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'customer_id' => $otherCustomer->id,
        'order_number' => 'ORD-TEST-003',
        'order_type' => OrderType::CUSTOMER,
        'status' => OrderStatus::PENDING,
        'payment_status' => PaymentStatus::UNPAID,
        'payment_method' => 'cash_on_delivery',
        'subtotal' => 1000,
        'total_amount' => 1000,
    ]);

    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'preferred_shop_id' => $this->shop->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->postJson("/store/{$this->shop->slug}/api/account/orders/{$order->id}/cancel")
        ->assertNotFound();
});
