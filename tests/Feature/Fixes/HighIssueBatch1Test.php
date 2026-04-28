<?php

use App\Enums\PayRunStatus;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Http\Requests\CreateProductFromTemplateRequest;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\Product;
use App\Models\ProductPackagingType;
use App\Models\ProductTemplate;
use App\Models\ProductType;
use App\Models\Shop;
use App\Models\ShopType;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PayRunService;
use App\Services\ProductTemplateService;
use App\Services\StockMovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function batch1Tenant(string $suffix = ''): Tenant
{
    return Tenant::create([
        'name' => 'Batch1 Tenant'.$suffix,
        'slug' => 'batch1-tenant'.str_replace(' ', '', $suffix),
        'owner_email' => 'owner'.str_replace(' ', '', $suffix).'@batch1.test',
        'is_active' => true,
        'max_shops' => 5,
        'max_users' => 20,
        'max_products' => 200,
    ]);
}

function batch1Shop(Tenant $tenant, string $suffix = ''): Shop
{
    $shopType = ShopType::firstOrCreate(
        ['slug' => 'retail'],
        ['label' => 'Retail', 'config_schema' => [], 'is_active' => true]
    );

    return Shop::create([
        'tenant_id' => $tenant->id,
        'shop_type_id' => $shopType->id,
        'name' => 'Batch1 Shop'.$suffix,
        'slug' => 'batch1-shop'.str_replace(' ', '-', strtolower($suffix)).'-'.rand(1000, 9999),
        'is_active' => true,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'config' => [],
    ]);
}

function batch1User(Tenant $tenant, Shop $shop): User
{
    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::OWNER,
        'is_tenant_owner' => true,
        'is_active' => true,
    ]);
    $user->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    return $user;
}

function batch1Template(Tenant $tenant): ProductTemplate
{
    $productType = ProductType::firstOrCreate(
        ['slug' => 'general'],
        [
            'label' => 'General',
            'description' => 'General product type',
            'config_schema' => [],
            'supports_variants' => true,
            'requires_batch_tracking' => false,
            'requires_serial_tracking' => false,
            'is_active' => true,
        ]
    );

    return ProductTemplate::create([
        'tenant_id' => $tenant->id,
        'product_type_id' => $productType->id,
        'created_by_id' => null,
        'name' => 'Bottled Water',
        'slug' => 'bottled-water-'.rand(1000, 9999),
        'description' => 'Test template',
        'is_active' => true,
        'is_system' => false,
        'has_variants' => false,
        'template_structure' => [
            'variants' => [
                [
                    'name' => 'Standard',
                    'packaging_types' => [
                        [
                            'name' => 'bottle',
                            'display_name' => 'Bottle',
                            'units_per_package' => 1,
                            'is_base_unit' => true,
                            'can_break_down' => false,
                        ],
                    ],
                ],
            ],
        ],
    ]);
}

// ---------------------------------------------------------------------------
// Issue 1: generateReferenceNumber missing enum cases
// ---------------------------------------------------------------------------

it('generates a reference number for every StockMovementType case without crashing', function () {
    $service = app(StockMovementService::class);
    $method = new ReflectionMethod($service, 'generateReferenceNumber');
    $method->setAccessible(true);

    foreach (StockMovementType::cases() as $type) {
        $ref = $method->invoke($service, $type);
        expect($ref)->toBeString()->not->toBeEmpty();
    }
});

// ---------------------------------------------------------------------------
// Issue 2: addEmployee creates PayRunItem without tenant_id
// ---------------------------------------------------------------------------

it('addEmployee sets tenant_id on the created PayRunItem', function () {
    $tenant = batch1Tenant();
    $shop = batch1Shop($tenant);
    $user = batch1User($tenant, $shop);

    $period = PayrollPeriod::create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'period_name' => 'Test Period',
        'start_date' => now()->startOfMonth(),
        'end_date' => now()->endOfMonth(),
        'payment_date' => now()->endOfMonth()->addDay(),
        'status' => 'draft',
    ]);

    $payRun = PayRun::create([
        'tenant_id' => $tenant->id,
        'payroll_period_id' => $period->id,
        'name' => 'Test Pay Run',
        'status' => PayRunStatus::DRAFT,
    ]);

    $employee = User::factory()->create([
        'tenant_id' => $tenant->id,
        'role' => UserRole::CASHIER,
        'is_active' => true,
    ]);
    $employee->shops()->attach($shop->id, ['tenant_id' => $tenant->id]);

    // Call without authenticated user to expose the missing explicit tenant_id
    $service = app(PayRunService::class);
    $item = $service->addEmployee($payRun, $employee);

    expect($item->tenant_id)->toBe($tenant->id);
});

// ---------------------------------------------------------------------------
// Issue 3: CreateProductFromTemplateRequest SKU uniqueness not tenant-scoped
// ---------------------------------------------------------------------------

it('CreateProductFromTemplateRequest accepts a SKU already used by a different tenant', function () {
    $tenantA = batch1Tenant(' A');
    $shopA = batch1Shop($tenantA, ' A');
    $userA = batch1User($tenantA, $shopA);

    $tenantB = batch1Tenant(' B');
    $shopB = batch1Shop($tenantB, ' B');
    $userB = batch1User($tenantB, $shopB);

    // Create a variant for tenant A with this SKU
    $productTypeId = ProductType::firstOrCreate(
        ['slug' => 'general'],
        ['label' => 'General', 'description' => '', 'config_schema' => [], 'supports_variants' => true, 'requires_batch_tracking' => false, 'requires_serial_tracking' => false, 'is_active' => true]
    )->id;

    $product = Product::create([
        'tenant_id' => $tenantA->id,
        'shop_id' => $shopA->id,
        'product_type_id' => $productTypeId,
        'name' => 'Coke',
        'slug' => 'coke-a',
        'has_variants' => false,
        'is_active' => true,
        'track_stock' => true,
    ]);

    \App\Models\ProductVariant::create([
        'product_id' => $product->id,
        'name' => 'Default',
        'sku' => 'SHARED-SKU-001',
        'price' => 100,
    ]);

    // Tenant B submitting the same SKU should pass validation
    $request = new CreateProductFromTemplateRequest;
    $request->setUserResolver(fn () => $userB);

    $validator = Validator::make(
        [
            'variants' => [
                ['sku' => 'SHARED-SKU-001', 'price' => 100],
            ],
        ],
        $request->rules()
    );

    // Should pass for tenant B because the SKU belongs to tenant A
    expect($validator->passes())->toBeTrue();
});

// ---------------------------------------------------------------------------
// Issue 4: createProductFromTemplate writes ProductPackagingType without tenant_id
// ---------------------------------------------------------------------------

it('createProductFromTemplate sets tenant_id on every ProductPackagingType created even without an authenticated user', function () {
    $tenant = batch1Tenant(' pkg');
    $shop = batch1Shop($tenant, ' pkg');

    $template = batch1Template($tenant);

    // No actingAs — simulates queue/CLI context where BelongsToTenant auto-fill does NOT fire
    $service = app(ProductTemplateService::class);
    $product = $service->createProductFromTemplate($template, $shop, [
        'variants' => [['price' => 500]],
    ]);

    $packagingTypes = ProductPackagingType::query()
        ->whereIn('product_variant_id', $product->variants->pluck('id'))
        ->get();

    expect($packagingTypes)->not->toBeEmpty();
    foreach ($packagingTypes as $pkg) {
        expect($pkg->tenant_id)->toBe($tenant->id);
    }
});

// ---------------------------------------------------------------------------
// Issue 5: createProductFromTemplate slug collision for same template + same shop
// ---------------------------------------------------------------------------

it('createProductFromTemplate generates unique slugs when the same template is used twice for the same shop', function () {
    $tenant = batch1Tenant(' slug');
    $shop = batch1Shop($tenant, ' slug');
    $user = batch1User($tenant, $shop);

    $this->actingAs($user);

    $template = batch1Template($tenant);

    $service = app(ProductTemplateService::class);

    $product1 = $service->createProductFromTemplate($template, $shop, [
        'variants' => [['price' => 500]],
    ]);

    $product2 = $service->createProductFromTemplate($template, $shop, [
        'variants' => [['price' => 600]],
    ]);

    expect($product1->slug)->not->toBe($product2->slug);
    expect(Product::query()->where('tenant_id', $tenant->id)->count())->toBe(2);
});
