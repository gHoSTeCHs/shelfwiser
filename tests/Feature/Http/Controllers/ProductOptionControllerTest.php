<?php

use App\Enums\OptionVisualType;
use App\Enums\UserRole;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'has_variants' => true,
    ]);
    $this->owner = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'role' => UserRole::OWNER,
    ]);
    $this->cashier = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'role' => UserRole::CASHIER,
    ]);
});

it('creates a product option with values', function () {
    $response = $this->actingAs($this->owner)
        ->postJson(route('product-options.store', $this->product), [
            'name' => 'size',
            'display_name' => 'Size',
            'position' => 1,
            'visual_type' => OptionVisualType::Dropdown->value,
            'values' => [
                ['label' => 'Small', 'value' => 'small', 'position' => 1],
                ['label' => 'Large', 'value' => 'large', 'position' => 2],
            ],
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('option.name', 'size')
        ->assertJsonPath('option.display_name', 'Size')
        ->assertJsonCount(2, 'option.values');

    $this->assertDatabaseHas('product_options', [
        'product_id' => $this->product->id,
        'name' => 'size',
    ]);
    $this->assertDatabaseCount('product_option_values', 2);
});

it('rejects option creation with invalid visual_type', function () {
    $this->actingAs($this->owner)
        ->postJson(route('product-options.store', $this->product), [
            'name' => 'size',
            'position' => 1,
            'visual_type' => 'invalid_type',
            'values' => [
                ['label' => 'Small', 'value' => 'small', 'position' => 1],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['visual_type']);
});

it('forbids option creation for cashier', function () {
    $this->actingAs($this->cashier)
        ->postJson(route('product-options.store', $this->product), [
            'name' => 'size',
            'position' => 1,
            'visual_type' => OptionVisualType::Dropdown->value,
            'values' => [
                ['label' => 'Small', 'value' => 'small', 'position' => 1],
            ],
        ])
        ->assertForbidden();
});

it('updates an existing option', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);

    $this->actingAs($this->owner)
        ->putJson(route('product-options.update', [$this->product, $option]), [
            'display_name' => 'Clothing Size',
        ])
        ->assertOk()
        ->assertJsonPath('option.display_name', 'Clothing Size');

    $this->assertDatabaseHas('product_options', [
        'id' => $option->id,
        'display_name' => 'Clothing Size',
    ]);
});

it('replaces values when updating option with values array', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $option->values()->create(['label' => 'Old', 'value' => 'old', 'position' => 1]);

    $this->actingAs($this->owner)
        ->putJson(route('product-options.update', [$this->product, $option]), [
            'values' => [
                ['label' => 'New One', 'value' => 'new-one', 'position' => 1],
                ['label' => 'New Two', 'value' => 'new-two', 'position' => 2],
            ],
        ])
        ->assertOk()
        ->assertJsonCount(2, 'option.values');

    $this->assertDatabaseMissing('product_option_values', ['label' => 'Old']);
});

it('soft-deletes an option', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);

    $this->actingAs($this->owner)
        ->deleteJson(route('product-options.destroy', [$this->product, $option]))
        ->assertOk()
        ->assertJsonPath('message', 'Option deleted successfully.');

    $this->assertSoftDeleted('product_options', ['id' => $option->id]);
});

it('adds a value to an existing option', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('product-options.values.store', [$this->product, $option]), [
            'label' => 'XL',
            'value' => 'xl',
            'position' => 3,
        ])
        ->assertStatus(201)
        ->assertJsonPath('value.label', 'XL');

    $this->assertDatabaseHas('product_option_values', [
        'product_option_id' => $option->id,
        'label' => 'XL',
    ]);
});

it('generates variant matrix and adds new combinations', function () {
    $sizeOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $small = $sizeOption->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);
    $large = $sizeOption->values()->create(['label' => 'Large', 'value' => 'large', 'position' => 2]);

    $response = $this->actingAs($this->owner)
        ->postJson(route('products.variants.matrix', $this->product), [
            'option_axes' => [[$small->id, $large->id]],
            'defaults' => ['price' => 1500],
        ]);

    $response->assertOk()
        ->assertJsonPath('added', 2)
        ->assertJsonPath('skipped', 0);

    expect($this->product->variants()->count())->toBe(2);
});

it('matrix generation skips existing variant combinations', function () {
    $sizeOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $small = $sizeOption->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);
    $large = $sizeOption->values()->create(['label' => 'Large', 'value' => 'large', 'position' => 2]);

    $existing = ProductVariant::factory()->create(['product_id' => $this->product->id]);
    $existing->optionValues()->attach([$small->id]);

    $response = $this->actingAs($this->owner)
        ->postJson(route('products.variants.matrix', $this->product), [
            'option_axes' => [[$small->id, $large->id]],
            'defaults' => ['price' => 1500],
        ]);

    $response->assertOk()
        ->assertJsonPath('added', 1)
        ->assertJsonPath('skipped', 1);
});

it('prevents cross-tenant access to option creation', function () {
    $otherTenant = Tenant::factory()->create();
    $otherUser = User::factory()->create([
        'tenant_id' => $otherTenant->id,
        'role' => UserRole::OWNER,
    ]);

    $this->actingAs($otherUser)
        ->postJson(route('product-options.store', $this->product), [
            'name' => 'size',
            'position' => 1,
            'visual_type' => OptionVisualType::Dropdown->value,
            'values' => [
                ['label' => 'Small', 'value' => 'small', 'position' => 1],
            ],
        ])
        ->assertNotFound();
});

it('rejects adding a new option axis when product already has variants', function () {
    ProductVariant::factory()->create(['product_id' => $this->product->id]);

    $this->actingAs($this->owner)
        ->postJson(route('product-options.store', $this->product), [
            'name' => 'color',
            'position' => 1,
            'visual_type' => OptionVisualType::ColorSwatch->value,
            'values' => [
                ['label' => 'Red', 'value' => 'red', 'position' => 1],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('enforces ProductType max_options limit', function () {
    $productType = ProductType::factory()->create([
        'tenant_id' => null,
        'option_templates' => [
            'max_options' => 2,
            'suggested_options' => [],
        ],
    ]);

    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'product_type_id' => $productType->id,
        'has_variants' => false,
    ]);

    ProductOption::query()->create([
        'product_id' => $product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);

    ProductOption::query()->create([
        'product_id' => $product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'color',
        'position' => 2,
        'visual_type' => OptionVisualType::ColorSwatch,
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('product-options.store', $product), [
            'name' => 'material',
            'position' => 3,
            'visual_type' => OptionVisualType::Dropdown->value,
            'values' => [
                ['label' => 'Cotton', 'value' => 'cotton', 'position' => 1],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('renames option value label while preserving value slug', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);
    $value = $option->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);

    $this->actingAs($this->owner)
        ->putJson(route('product-options.update', [$this->product, $option]), [
            'values' => [
                ['label' => 'Small (US 2-4)', 'value' => 'small', 'position' => 1],
            ],
        ])
        ->assertOk();

    $this->assertDatabaseHas('product_option_values', [
        'product_option_id' => $option->id,
        'label' => 'Small (US 2-4)',
        'value' => 'small',
    ]);
});

it('rejects duplicate value slugs within the same option', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('product-options.store', $this->product), [
            'name' => 'color',
            'position' => 2,
            'visual_type' => OptionVisualType::ColorSwatch->value,
            'values' => [
                ['label' => 'Red', 'value' => 'red', 'position' => 1],
                ['label' => 'Red Again', 'value' => 'red', 'position' => 2],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['values.0.value']);
});

it('deletes option value with no ordered variants and soft-deletes those variants', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);
    $value = $option->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);

    $variant = ProductVariant::factory()->create(['product_id' => $this->product->id]);
    $variant->optionValues()->attach([$value->id]);

    $this->actingAs($this->owner)
        ->deleteJson(route('product-options.values.destroy', [$this->product, $option, $value]))
        ->assertOk()
        ->assertJsonPath('message', 'Option value deleted successfully.');

    $this->assertSoftDeleted('product_option_values', ['id' => $value->id]);
    $this->assertSoftDeleted('product_variants', ['id' => $variant->id]);
});

it('rejects deleting option value when linked variants have orders', function () {
    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);
    $value = $option->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);

    $variant = ProductVariant::factory()->create(['product_id' => $this->product->id]);
    $variant->optionValues()->attach([$value->id]);

    $orderId = DB::table('orders')->insertGetId([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'order_number' => 'ORD-OPVAL-'.uniqid(),
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'subtotal' => 1000,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'shipping_cost' => 0,
        'total_amount' => 1000,
        'created_by' => $this->owner->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('order_items')->insert([
        'order_id' => $orderId,
        'tenant_id' => $this->tenant->id,
        'product_variant_id' => $variant->id,
        'quantity' => 1,
        'unit_price' => 1000,
        'discount_amount' => 0,
        'tax_amount' => 0,
        'total_amount' => 1000,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($this->owner)
        ->deleteJson(route('product-options.values.destroy', [$this->product, $option, $value]))
        ->assertStatus(422)
        ->assertJsonPath('message', fn ($msg) => str_contains($msg, 'Cannot delete'));

    $this->assertDatabaseHas('product_option_values', ['id' => $value->id, 'deleted_at' => null]);
    $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'deleted_at' => null]);
});
