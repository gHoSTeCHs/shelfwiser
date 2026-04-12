<?php

use App\Enums\StorefrontPageType;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\StorefrontTemplate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('completes full builder flow: template → theme → sections → publish → render', function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);

    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id, 'storefront_enabled' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    Product::factory()->count(5)->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->firstOrFail();
    $theme = $template->themes()->where('slug', 'lagos-express')->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.theme', $shop), ['theme_id' => $theme->id])
        ->assertOk();

    $shop->refresh();
    expect($shop->storefrontConfig)->not->toBeNull();
    expect($shop->storefrontConfig->theme_id)->toBe($theme->id);

    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.section.add', [$shop, 'home']), [
            'type' => 'hero_banner',
            'variant' => 'centered_overlay',
        ])
        ->assertOk();

    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.publish', $shop))
        ->assertOk();

    $shop->refresh();
    expect($shop->storefrontConfig->is_published)->toBeTrue();

    $this->get("/store/{$shop->slug}")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('renders all composable page types', function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);

    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id, 'storefront_enabled' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->firstOrFail();
    $theme = $template->themes()->where('slug', 'lagos-express')->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.theme', $shop), ['theme_id' => $theme->id])
        ->assertOk();
    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.publish', $shop))
        ->assertOk();

    $this->get("/store/{$shop->slug}")->assertOk();
    $this->get("/store/{$shop->slug}/about")->assertOk();
    $this->get("/store/{$shop->slug}/contact")->assertOk();
});

it('renders all fixed themed pages', function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);

    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id, 'storefront_enabled' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->firstOrFail();
    $theme = $template->themes()->where('slug', 'lagos-express')->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.theme', $shop), ['theme_id' => $theme->id])
        ->assertOk();
    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.publish', $shop))
        ->assertOk();

    $this->get("/store/{$shop->slug}/cart")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');

    $this->get("/store/{$shop->slug}/login")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');

    $this->get("/store/{$shop->slug}/register")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('completes full customer flow: browse → cart → register', function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);

    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id, 'storefront_enabled' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $product = Product::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'is_available_online' => true,
    ]);
    InventoryLocation::query()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_variant_id' => $variant->id,
        'location_type' => Shop::class,
        'location_id' => $shop->id,
        'quantity' => 50,
        'reserved_quantity' => 0,
    ]);

    $template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->firstOrFail();
    $theme = $template->themes()->where('slug', 'lagos-express')->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.theme', $shop), ['theme_id' => $theme->id])
        ->assertOk();
    $this->actingAs($user)
        ->postJson(route('shops.storefront-builder.publish', $shop))
        ->assertOk();

    $this->get("/store/{$shop->slug}")->assertOk();

    $this->postJson("/store/{$shop->slug}/api/cart", [
        'variant_id' => $variant->id,
        'quantity' => 2,
    ])->assertOk();

    $this->get("/store/{$shop->slug}/cart")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');

    $this->get("/store/{$shop->slug}/login")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');

    $this->postJson("/store/{$shop->slug}/api/auth/register", [
        'first_name' => 'Test',
        'last_name' => 'Customer',
        'email' => 'test@customer.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertOk();

    $this->getJson("/store/{$shop->slug}/api/cart/summary")
        ->assertOk()
        ->assertJsonStructure(['item_count', 'subtotal']);
});
