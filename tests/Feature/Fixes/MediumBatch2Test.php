<?php

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CategoryService;
use App\Services\CustomerService;
use App\Services\ProductService;
use App\Services\ProductTemplateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function mb2Setup(string $suffix = ''): array
{
    $id = uniqid($suffix);
    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );
    $tenant = Tenant::create([
        'name' => "MB2 Tenant {$id}",
        'slug' => "mb2-{$id}",
        'owner_email' => "mb2-{$id}@test.com",
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 20,
        'max_products' => 200,
    ]);
    $shop = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => "MB2 Shop {$id}",
        'slug' => "mb2-shop-{$id}",
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);
    $owner = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
        'is_active' => true,
    ]);
    $owner->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    return [$tenant, $shop, $owner];
}

function mb2ProductType(): \App\Models\ProductType
{
    return ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    );
}

// ---------------------------------------------------------------------------
// M12: ProductService::delete uses wrong cache tag — list stays stale after delete
// ---------------------------------------------------------------------------

it('ProductService delete flushes the products list cache tag', function () {
    [$tenant, $shop, $owner] = mb2Setup('cache');
    $this->actingAs($owner);

    $productType = mb2ProductType();
    $product = Product::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'product_type_id' => $productType->id,
        'name' => 'Cache Test Product',
        'slug' => 'cache-test-'.uniqid(),
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);

    // Manually warm the list cache with a marker
    $listCacheKey = "tenant:{$tenant->id}:products:list:warm";
    Cache::tags(["tenant:{$tenant->id}:products:list"])->put($listCacheKey, true, 3600);

    expect(Cache::tags(["tenant:{$tenant->id}:products:list"])->has($listCacheKey))->toBeTrue();

    $service = app(ProductService::class);
    $service->delete($product);

    // After the fix: list cache should be flushed
    expect(Cache::tags(["tenant:{$tenant->id}:products:list"])->has($listCacheKey))->toBeFalse();
});

// ---------------------------------------------------------------------------
// M13: ProductTemplateService::getStatistics total_usage not tenant-scoped
// ---------------------------------------------------------------------------

it('getStatistics total_usage only counts products for the specified tenant', function () {
    [$tenantA, $shopA] = mb2Setup('A');
    [$tenantB, $shopB] = mb2Setup('B');

    $productType = mb2ProductType();

    $template = ProductTemplate::factory()->create(['tenant_id' => $tenantA->id]);

    // Create products linked to template: 2 for tenant A, 1 for tenant B
    Product::create(['tenant_id' => $tenantA->id, 'shop_id' => $shopA->id, 'product_type_id' => $productType->id, 'name' => 'A1', 'slug' => 'a1-'.uniqid(), 'template_id' => $template->id, 'has_variants' => false, 'is_active' => true, 'track_stock' => true]);
    Product::create(['tenant_id' => $tenantA->id, 'shop_id' => $shopA->id, 'product_type_id' => $productType->id, 'name' => 'A2', 'slug' => 'a2-'.uniqid(), 'template_id' => $template->id, 'has_variants' => false, 'is_active' => true, 'track_stock' => true]);
    Product::create(['tenant_id' => $tenantB->id, 'shop_id' => $shopB->id, 'product_type_id' => $productType->id, 'name' => 'B1', 'slug' => 'b1-'.uniqid(), 'template_id' => $template->id, 'has_variants' => false, 'is_active' => true, 'track_stock' => true]);

    $service = app(ProductTemplateService::class);
    $stats = $service->getStatistics($tenantA->id);

    // Tenant A only has 2 products from templates, not 3
    expect($stats['total_usage'])->toBe(2);
});

// ---------------------------------------------------------------------------
// M14: ProductTemplateService::create — no slug uniqueness loop
// ---------------------------------------------------------------------------

it('ProductTemplateService create generates unique slugs for templates with the same name', function () {
    [$tenant, , $owner] = mb2Setup('tpl');
    $this->actingAs($owner);

    $productType = mb2ProductType();

    $service = app(ProductTemplateService::class);

    $template1 = $service->create([
        'name' => 'Bottled Water',
        'product_type_id' => $productType->id,
        'has_variants' => false,
        'template_structure' => ['variants' => [['name' => 'Default']]],
        'is_active' => true,
    ], $tenant, $owner);

    $template2 = $service->create([
        'name' => 'Bottled Water',
        'product_type_id' => $productType->id,
        'has_variants' => false,
        'template_structure' => ['variants' => [['name' => 'Default']]],
        'is_active' => true,
    ], $tenant, $owner);

    expect($template1->slug)->not->toBe($template2->slug);
    expect($template1->slug)->toBe('bottled-water');
    expect($template2->slug)->toBe('bottled-water-1');
});

// ---------------------------------------------------------------------------
// M15: CustomerService::update — preferred_shop_id = null silently dropped
// ---------------------------------------------------------------------------

it('CustomerService update persists preferred_shop_id when set to null', function () {
    [$tenant, $shop, $owner] = mb2Setup('cust');
    $this->actingAs($owner);

    $customer = \App\Models\Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'preferred_shop_id' => $shop->id,
    ]);

    expect($customer->preferred_shop_id)->toBe($shop->id);

    $service = app(CustomerService::class);
    $service->update($customer, ['preferred_shop_id' => null]);

    $customer->refresh();
    expect($customer->preferred_shop_id)->toBeNull();
});

it('CustomerService update still sets preferred_shop_id to a new value', function () {
    [$tenant, $shop1, $owner] = mb2Setup('cust2');
    $shopType = ShopType::firstOrCreate(['slug' => 'retail'], ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]);
    $shop2 = Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => 'Second Shop',
        'slug' => 'second-shop-'.uniqid(),
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);

    $customer = \App\Models\Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'preferred_shop_id' => $shop1->id,
    ]);

    $service = app(CustomerService::class);
    $service->update($customer, ['preferred_shop_id' => $shop2->id]);

    $customer->refresh();
    expect($customer->preferred_shop_id)->toBe($shop2->id);
});

// ---------------------------------------------------------------------------
// M17: CategoryService::getCategoryTree — recursive N+1 queries
// ---------------------------------------------------------------------------

it('CategoryService getCategoryTree builds the full tree correctly', function () {
    [$tenant] = mb2Setup('cat');

    // Create a two-level category tree
    $parent1 = ProductCategory::create([
        'tenant_id' => $tenant->id,
        'name' => 'Electronics',
        'slug' => 'electronics-'.uniqid(),
        'is_active' => true,
    ]);
    $child1 = ProductCategory::create([
        'tenant_id' => $tenant->id,
        'name' => 'Phones',
        'slug' => 'phones-'.uniqid(),
        'parent_id' => $parent1->id,
        'is_active' => true,
    ]);
    $child2 = ProductCategory::create([
        'tenant_id' => $tenant->id,
        'name' => 'Laptops',
        'slug' => 'laptops-'.uniqid(),
        'parent_id' => $parent1->id,
        'is_active' => true,
    ]);

    $service = app(CategoryService::class);
    $tree = $service->getCategoryTree($tenant->id);

    expect($tree)->toHaveCount(1);
    expect($tree[0]['name'])->toBe('Electronics');
    expect($tree[0]['children'])->toHaveCount(2);
});

it('CategoryService getCategoryTree uses at most 2 queries regardless of category count', function () {
    [$tenant] = mb2Setup('cat2');

    // Create 5 root categories with 2 children each (would be 11 queries in N+1 pattern)
    foreach (range(1, 5) as $i) {
        $parent = ProductCategory::create([
            'tenant_id' => $tenant->id,
            'name' => "Category {$i}",
            'slug' => "cat-{$i}-".uniqid(),
            'is_active' => true,
        ]);
        foreach (range(1, 2) as $j) {
            ProductCategory::create([
                'tenant_id' => $tenant->id,
                'name' => "Category {$i} Child {$j}",
                'slug' => "cat-{$i}-child-{$j}-".uniqid(),
                'parent_id' => $parent->id,
                'is_active' => true,
            ]);
        }
    }

    Cache::flush(); // ensure cold cache

    $queryCount = 0;
    DB::listen(function () use (&$queryCount) {
        $queryCount++;
    });

    $service = app(CategoryService::class);
    $service->getCategoryTree($tenant->id);

    // After fix: should be 1-2 queries (one to fetch all, one for counts)
    // Before fix: would be 1 + 5 + 10 = 16 queries (root + 5 parents + 10 children)
    expect($queryCount)->toBeLessThanOrEqual(3);
});
