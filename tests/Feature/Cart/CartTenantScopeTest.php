<?php

declare(strict_types=1);

use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use App\Services\CartService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('prevents adding a variant from a different tenant into a cart', function () {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();

    $shopA = Shop::factory()->create(['tenant_id' => $tenantA->id]);
    $shopB = Shop::factory()->create(['tenant_id' => $tenantB->id]);

    $productB = Product::factory()->create([
        'tenant_id' => $tenantB->id,
        'shop_id' => $shopB->id,
    ]);
    $variantB = ProductVariant::factory()->create(['product_id' => $productB->id]);

    $cart = Cart::query()->forceCreate([
        'tenant_id' => $tenantA->id,
        'shop_id' => $shopA->id,
    ]);

    expect(fn () => app(CartService::class)->addItem($cart, $variantB->id, 1))
        ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
});

it('allows adding a variant from the correct tenant and shop', function () {
    $shop = Shop::factory()->create();
    $product = Product::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'track_stock' => false,
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'is_available_online' => true,
    ]);

    $cart = Cart::query()->forceCreate([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
    ]);

    $item = app(CartService::class)->addItem($cart, $variant->id, 1);

    expect($item->product_variant_id)->toBe($variant->id);
});
