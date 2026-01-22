<?php

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\HeldSale;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::create([
        'name' => 'Test Tenant',
        'slug' => 'test-tenant',
        'owner_email' => 'owner@test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $this->shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        [
            'label' => 'Retail Store',
            'config_schema' => [],
            'is_active' => true,
        ]
    );

    $this->shop = Shop::create([
        'tenant_id' => $this->tenant->id,
        'shop_type_id' => $this->shopType->id,
        'name' => 'Test Shop',
        'slug' => 'test-shop',
        'is_active' => true,
        'currency' => 'KES',
        'currency_symbol' => 'KSh',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
        'is_active' => true,
    ]);

    $this->user->shops()->attach($this->shop->id, ['tenant_id' => $this->tenant->id]);

    $this->productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        [
            'label' => 'General Product',
            'description' => 'Standard product type',
            'config_schema' => [],
            'supports_variants' => true,
            'requires_batch_tracking' => false,
            'requires_serial_tracking' => false,
            'is_active' => true,
        ]
    );

    $this->product = Product::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => $this->productType->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'has_variants' => true,
        'is_active' => true,
        'track_stock' => true,
    ]);

    $this->variant1 = ProductVariant::create([
        'product_id' => $this->product->id,
        'name' => 'Test Product - Variant A',
        'sku' => 'TEST-001',
        'price' => 100.00,
        'is_active' => true,
    ]);

    $this->variant2 = ProductVariant::create([
        'product_id' => $this->product->id,
        'name' => 'Another Product - Variant B',
        'sku' => 'TEST-002',
        'price' => 50.00,
        'is_active' => true,
    ]);

    InventoryLocation::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_variant_id' => $this->variant1->id,
        'location_type' => Shop::class,
        'location_id' => $this->shop->id,
        'quantity' => 100,
        'reserved_quantity' => 0,
    ]);

    InventoryLocation::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_variant_id' => $this->variant2->id,
        'location_type' => Shop::class,
        'location_id' => $this->shop->id,
        'quantity' => 100,
        'reserved_quantity' => 0,
    ]);

    $this->validItems = [
        [
            'variant_id' => $this->variant1->id,
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'quantity' => 2,
            'unit_price' => 100.00,
        ],
        [
            'variant_id' => $this->variant2->id,
            'name' => 'Another Product',
            'sku' => 'TEST-002',
            'quantity' => 1,
            'unit_price' => 50.00,
        ],
    ];
});

test('unauthenticated user cannot access held sales endpoints', function () {
    $this->postJson(route('pos.hold', $this->shop))
        ->assertUnauthorized();

    $this->getJson(route('pos.held-sales', $this->shop))
        ->assertUnauthorized();

    $this->getJson(route('pos.held-sales.count', $this->shop))
        ->assertUnauthorized();
});

test('user can hold a sale with valid items', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => $this->validItems,
            'customer_id' => null,
            'notes' => 'Customer stepped out',
        ]);

    $response->assertSuccessful()
        ->assertJsonStructure([
            'held_sale' => [
                'id',
                'hold_reference',
                'items',
                'notes',
                'created_at',
            ],
            'message',
        ]);

    $this->assertDatabaseHas('held_sales', [
        'shop_id' => $this->shop->id,
        'tenant_id' => $this->tenant->id,
        'notes' => 'Customer stepped out',
        'held_by' => $this->user->id,
    ]);
});

test('cannot hold sale with empty items array', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => [],
            'customer_id' => null,
            'notes' => null,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});

test('cannot hold sale without items', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'customer_id' => null,
            'notes' => null,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});

test('held sale generates sequential reference numbers', function () {
    $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => $this->validItems,
        ]);

    $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => $this->validItems,
        ]);

    $heldSales = HeldSale::forShop($this->shop->id)->orderBy('id')->get();

    expect($heldSales[0]->hold_reference)->toBe('HOLD-001');
    expect($heldSales[1]->hold_reference)->toBe('HOLD-002');
});

test('can hold sale with customer', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@test.com',
        'password' => Hash::make('password'),
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => $this->validItems,
            'customer_id' => $customer->id,
            'notes' => null,
        ]);

    $response->assertSuccessful();

    $this->assertDatabaseHas('held_sales', [
        'shop_id' => $this->shop->id,
        'customer_id' => $customer->id,
    ]);
});

test('can list held sales for a shop', function () {
    HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-002',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('pos.held-sales', $this->shop));

    $response->assertSuccessful()
        ->assertJsonCount(2, 'held_sales');
});

test('can get held sales count', function () {
    HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-002',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('pos.held-sales.count', $this->shop));

    $response->assertSuccessful()
        ->assertJson(['count' => 2]);
});

test('retrieved sales are excluded from active held sales list', function () {
    HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
        'retrieved_at' => now(),
        'retrieved_by' => $this->user->id,
    ]);

    HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-002',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('pos.held-sales', $this->shop));

    $response->assertSuccessful()
        ->assertJsonCount(1, 'held_sales');
});

test('can retrieve a held sale', function () {
    $heldSale = HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('pos.held-sales.retrieve', [$this->shop, $heldSale]));

    $response->assertSuccessful()
        ->assertJsonStructure([
            'held_sale' => [
                'id',
                'items',
            ],
            'message',
        ]);

    $this->assertDatabaseHas('held_sales', [
        'id' => $heldSale->id,
        'retrieved_by' => $this->user->id,
    ]);

    expect(HeldSale::find($heldSale->id)->retrieved_at)->not->toBeNull();
});

test('cannot retrieve already retrieved held sale', function () {
    $heldSale = HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
        'retrieved_at' => now(),
        'retrieved_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('pos.held-sales.retrieve', [$this->shop, $heldSale]));

    $response->assertStatus(400)
        ->assertJson(['error' => 'This held sale has already been retrieved.']);
});

test('can delete a held sale', function () {
    $heldSale = HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->deleteJson(route('pos.held-sales.delete', [$this->shop, $heldSale]));

    $response->assertSuccessful()
        ->assertJsonStructure(['message']);

    $this->assertSoftDeleted('held_sales', [
        'id' => $heldSale->id,
    ]);
});

test('cannot access held sales from another shop', function () {
    $otherShop = Shop::create([
        'tenant_id' => $this->tenant->id,
        'shop_type_id' => $this->shopType->id,
        'name' => 'Other Shop',
        'slug' => 'other-shop',
        'is_active' => true,
        'currency' => 'KES',
        'currency_symbol' => 'KSh',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $heldSale = HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $otherShop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('pos.held-sales.retrieve', [$this->shop, $heldSale]));

    $response->assertForbidden();
});

test('user from different tenant cannot access shop held sales', function () {
    $otherTenant = Tenant::create([
        'name' => 'Other Tenant',
        'slug' => 'other-tenant',
        'owner_email' => 'other@test.com',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 10,
        'max_products' => 100,
    ]);

    $otherUser = User::factory()->create([
        'tenant_id' => $otherTenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
        'is_active' => true,
    ]);

    $response = $this->actingAs($otherUser)
        ->getJson(route('pos.held-sales', $this->shop));

    $response->assertForbidden();
});

test('held sale sets correct expiration time', function () {
    $beforeCreation = now();

    $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => $this->validItems,
        ]);

    $heldSale = HeldSale::first();

    expect($heldSale->expires_at)->not->toBeNull();
    expect($heldSale->expires_at->greaterThan($beforeCreation))->toBeTrue();
    expect($heldSale->expires_at->lessThanOrEqualTo($beforeCreation->copy()->addHours(25)))->toBeTrue();
    expect($heldSale->expires_at->greaterThanOrEqualTo($beforeCreation->copy()->addHours(23)))->toBeTrue();
});

test('held sale preserves all item data', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('pos.hold', $this->shop), [
            'items' => $this->validItems,
        ]);

    $heldSale = HeldSale::first();

    expect($heldSale->items)->toHaveCount(2);
    expect($heldSale->items[0]['variant_id'])->toBe($this->variant1->id);
    expect($heldSale->items[0]['name'])->toBe('Test Product');
    expect($heldSale->items[0]['quantity'])->toBe(2);
    expect($heldSale->items[0]['unit_price'])->toEqual(100.00);
});

test('held sale calculates total amount correctly', function () {
    $heldSale = HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    expect($heldSale->getTotalAmount())->toBe(250.00);
});

test('held sale counts items correctly', function () {
    $heldSale = HeldSale::create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'hold_reference' => 'HOLD-001',
        'items' => $this->validItems,
        'held_by' => $this->user->id,
    ]);

    expect($heldSale->getItemCount())->toBe(2);
});
