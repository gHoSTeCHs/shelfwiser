<?php

use App\Enums\OrderStatus;
use App\Enums\StorefrontPageType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function setupStorefront(array $shopOverrides = []): array
{
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(array_merge([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ], $shopOverrides));
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    $config = StorefrontConfig::factory()->published()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    return compact('tenant', 'shop', 'template', 'theme', 'config');
}

function setupPage(StorefrontConfig $config, StorefrontPageType $pageType, array $overrides = []): StorefrontPage
{
    return StorefrontPage::query()->create(array_merge([
        'tenant_id' => $config->tenant_id,
        'shop_id' => $config->shop_id,
        'storefront_config_id' => $config->id,
        'page_type' => $pageType,
        'slug' => $pageType->value,
        'title' => ucfirst(str_replace('_', ' ', $pageType->value)),
        'sections' => [],
        'is_published' => true,
        'sort_order' => 0,
    ], $overrides));
}

function setupOrder(Tenant $tenant, Shop $shop, Customer $customer, array $overrides = []): Order
{
    return Order::query()->forceCreate(array_merge([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'customer_id' => $customer->id,
        'order_number' => 'ORD-'.fake()->unique()->numerify('###'),
        'status' => OrderStatus::PENDING,
        'subtotal' => 1000,
        'tax_amount' => 0,
        'total_amount' => 1000,
    ], $overrides));
}

it('returns 404 when storefront config does not exist', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);

    $this->get("/store/{$shop->slug}")
        ->assertNotFound();
});

it('returns 404 for non-existent shop slug', function () {
    $this->get('/store/non-existent-shop-slug')
        ->assertNotFound();
});

it('returns 404 when page is not published', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::HOME, ['is_published' => false]);

    $this->get("/store/{$shop->slug}")
        ->assertNotFound();
});

it('serves about page with 200', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::ABOUT);

    $this->get("/store/{$shop->slug}/about")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('serves contact page with 200', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::CONTACT);

    $this->get("/store/{$shop->slug}/contact")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('serves custom page by slug', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::CUSTOM, ['slug' => 'faq-page', 'title' => 'FAQ']);

    $this->get("/store/{$shop->slug}/p/faq-page")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('serves services fixed page', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/services")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('returns 404 for missing service detail', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/services/non-existent-slug")
        ->assertNotFound();
});

it('serves register page for unauthenticated customer', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/register")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('redirects authenticated customer away from login page', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/login")
        ->assertRedirect();
});

it('redirects authenticated customer away from register page', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/register")
        ->assertRedirect();
});

it('redirects unauthenticated user from checkout', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/checkout")
        ->assertRedirect();
});

it('redirects unauthenticated user from account dashboard', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/account")
        ->assertRedirect();
});

it('redirects unauthenticated user from account orders', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/account/orders")
        ->assertRedirect();
});

it('redirects unauthenticated user from account profile', function () {
    ['shop' => $shop] = setupStorefront();

    $this->get("/store/{$shop->slug}/account/profile")
        ->assertRedirect();
});

it('serves checkout page for authenticated customer', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/checkout")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('serves account dashboard for authenticated customer', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('serves account orders for authenticated customer', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account/orders")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('serves account profile for authenticated customer', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account/profile")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('allows customer to view their own order detail', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($tenant, $shop, $customer);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account/orders/{$order->id}")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('denies customer access to another customers order', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $otherCustomer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($tenant, $shop, $otherCustomer);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account/orders/{$order->id}")
        ->assertForbidden();
});

it('denies access to order from a different shop', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $otherShop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($tenant, $otherShop, $customer);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account/orders/{$order->id}")
        ->assertForbidden();
});

it('denies access to order from a different tenant', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $otherTenant = Tenant::factory()->create();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($otherTenant, $shop, $customer);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/account/orders/{$order->id}")
        ->assertNotFound();
});

it('allows customer to view checkout success for their order', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($tenant, $shop, $customer, ['status' => OrderStatus::CONFIRMED]);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/checkout/success/{$order->id}")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('denies checkout success for another customers order', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $otherCustomer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($tenant, $shop, $otherCustomer);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/checkout/success/{$order->id}")
        ->assertForbidden();
});

it('allows customer to view checkout pending for their order', function () {
    ['tenant' => $tenant, 'shop' => $shop] = setupStorefront();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $order = setupOrder($tenant, $shop, $customer);

    $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}/checkout/pending/{$order->id}")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});

it('returns page data with correct structure for composable pages', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::HOME);

    $response = $this->get("/store/{$shop->slug}");
    $response->assertOk();

    $pageData = $response->viewData('pageData');
    expect($pageData)->toHaveKeys([
        'shop', 'template', 'theme', 'themeStyles', 'themeStyleVars',
        'sections', 'seo', 'cart', 'navigation', 'customer', 'csrfToken',
    ]);
    expect($pageData['shop'])->toHaveKeys(['id', 'name', 'slug', 'currency', 'currency_symbol']);
    expect($pageData['seo'])->toHaveKeys(['title', 'description', 'image']);
});

it('returns page data with correct structure for fixed pages', function () {
    ['shop' => $shop] = setupStorefront();

    $response = $this->get("/store/{$shop->slug}/cart");
    $response->assertOk();

    $pageData = $response->viewData('pageData');
    expect($pageData)->toHaveKeys([
        'shop', 'template', 'theme', 'themeStyles', 'themeStyleVars',
        'fixedPage', 'fixedPageData', 'seo', 'cart', 'navigation', 'customer', 'csrfToken',
    ]);
    expect($pageData['fixedPage'])->toBe('cart');
});

it('includes only published pages in navigation', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::HOME, ['title' => 'Home', 'sort_order' => 1]);
    setupPage($config, StorefrontPageType::PRODUCTS, ['title' => 'Products', 'sort_order' => 2]);
    setupPage($config, StorefrontPageType::ABOUT, ['title' => 'About', 'is_published' => false, 'sort_order' => 3]);

    $response = $this->get("/store/{$shop->slug}");
    $response->assertOk();

    $navigation = $response->viewData('pageData')['navigation'];
    $labels = array_column($navigation['items'], 'label');

    expect($labels)->toContain('Home')
        ->toContain('Products')
        ->not->toContain('About');
});

it('returns null customer when not authenticated', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::HOME);

    $pageData = $this->get("/store/{$shop->slug}")->viewData('pageData');

    expect($pageData['customer'])->toBeNull();
});

it('returns customer data when authenticated', function () {
    ['tenant' => $tenant, 'shop' => $shop, 'config' => $config] = setupStorefront();
    $customer = Customer::factory()->create([
        'tenant_id' => $tenant->id,
        'first_name' => 'Ada',
        'last_name' => 'Obi',
        'email' => 'ada@example.com',
    ]);
    setupPage($config, StorefrontPageType::HOME);

    $pageData = $this->actingAs($customer, 'customer')
        ->get("/store/{$shop->slug}")
        ->viewData('pageData');

    expect($pageData['customer'])->not->toBeNull()
        ->and($pageData['customer']['email'])->toBe('ada@example.com');
});

it('navigation respects sort order', function () {
    ['shop' => $shop, 'config' => $config] = setupStorefront();
    setupPage($config, StorefrontPageType::CONTACT, ['title' => 'Contact', 'sort_order' => 3]);
    setupPage($config, StorefrontPageType::HOME, ['title' => 'Home', 'sort_order' => 1]);
    setupPage($config, StorefrontPageType::PRODUCTS, ['title' => 'Products', 'sort_order' => 2]);

    $response = $this->get("/store/{$shop->slug}");
    $navigation = $response->viewData('pageData')['navigation'];
    $labels = array_column($navigation['items'], 'label');

    expect($labels)->toBe(['Home', 'Products', 'Contact']);
});
