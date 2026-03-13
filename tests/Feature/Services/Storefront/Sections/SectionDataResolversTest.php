<?php

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Shop;
use App\Models\Tenant;
use App\Services\Storefront\Sections\CategoryGridSection;
use App\Services\Storefront\Sections\FeaturedProductsSection;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('featured products resolves featured products from database', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    Product::factory()->count(3)->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $section = app(FeaturedProductsSection::class);
    $data = $section->resolveData(['product_source' => 'featured', 'max_items' => 8], $shop);

    expect($data)->toHaveKey('products')
        ->and($data['products'])->toHaveCount(3);
});

it('featured products resolves newest products from database', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    Product::factory()->count(2)->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
    ]);

    $section = app(FeaturedProductsSection::class);
    $data = $section->resolveData(['product_source' => 'newest', 'max_items' => 4], $shop);

    expect($data)->toHaveKey('products')
        ->and($data['products'])->toHaveCount(2);
});

it('featured products respects max_items limit', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    Product::factory()->count(5)->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $section = app(FeaturedProductsSection::class);
    $data = $section->resolveData(['product_source' => 'featured', 'max_items' => 3], $shop);

    expect($data)->toHaveKey('products')
        ->and($data['products'])->toHaveCount(3);
});

it('category grid resolves auto categories from database', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    ProductCategory::factory()->count(3)->create(['tenant_id' => $tenant->id]);

    $section = app(CategoryGridSection::class);
    $data = $section->resolveData(['category_source' => 'auto', 'max_items' => 6], $shop);

    expect($data)->toHaveCount(3);
});
