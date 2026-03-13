<?php

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use App\Services\Storefront\StorefrontRenderService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createStorefrontStack(array $themeConfig = [], array $configOverrides = []): array
{
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create([
        'template_id' => $template->id,
        'theme_config' => array_merge([
            'palette' => [
                'presets' => [
                    ['name' => 'Default', 'primary' => '#e94560', 'secondary' => '#64748b', 'accent' => '#f59e0b', 'background' => '#ffffff', 'foreground' => '#0f172a'],
                    ['name' => 'Ocean', 'primary' => '#0ea5e9', 'secondary' => '#475569', 'accent' => '#14b8a6', 'background' => '#ffffff', 'foreground' => '#1e293b'],
                ],
                'allow_custom' => false,
            ],
            'typography' => [
                'options' => [
                    ['name' => 'Default', 'heading_font' => 'DM Sans', 'body_font' => 'DM Sans', 'heading_weight' => '700', 'body_weight' => '400'],
                    ['name' => 'Elegant', 'heading_font' => 'Playfair Display', 'body_font' => 'Lora', 'heading_weight' => '700', 'body_weight' => '400'],
                ],
                'base_size' => 16,
                'line_height' => 1.6,
            ],
            'components' => ['button_style' => 'rounded'],
            'feel' => ['shadow_depth' => 'subtle', 'border_radius' => '8px', 'section_spacing' => '64px'],
            'animation' => ['entrance_style' => 'fade_up', 'hover_style' => 'elevate'],
            'header' => ['variant' => 'standard', 'position' => 'sticky'],
            'footer' => ['variant' => 'multi_column'],
            'hero' => ['default_variant' => 'centered_overlay'],
            'product_card' => ['variant' => 'default'],
            'decorations' => ['background_pattern' => 'none'],
        ], $themeConfig),
    ]);
    $config = StorefrontConfig::factory()->published()->create(array_merge([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ], $configOverrides));

    return compact('tenant', 'shop', 'template', 'theme', 'config');
}

it('resolves theme config by merging defaults with overrides', function () {
    ['config' => $config] = createStorefrontStack([], [
        'color_preset' => 'Ocean',
        'component_overrides' => ['button_style' => 'pill'],
    ]);

    $service = app(StorefrontRenderService::class);
    $resolved = $service->resolveThemeConfig($config);

    expect($resolved['colors']['primary'])->toBe('#0ea5e9')
        ->and($resolved['components']['button_style'])->toBe('pill')
        ->and($resolved['feel']['shadow_depth'])->toBe('subtle');
});

it('falls back to first preset when no color preset is selected', function () {
    ['config' => $config] = createStorefrontStack();

    $service = app(StorefrontRenderService::class);
    $resolved = $service->resolveThemeConfig($config);

    expect($resolved['colors']['primary'])->toBe('#e94560');
});

it('applies color overrides on top of preset', function () {
    ['config' => $config] = createStorefrontStack([], [
        'color_preset' => 'Default',
        'color_overrides' => ['primary' => '#ff0000'],
    ]);

    $service = app(StorefrontRenderService::class);
    $resolved = $service->resolveThemeConfig($config);

    expect($resolved['colors']['primary'])->toBe('#ff0000')
        ->and($resolved['colors']['background'])->toBe('#ffffff');
});

it('resolves typography preset by name', function () {
    ['config' => $config] = createStorefrontStack([], [
        'typography_preset' => 'Elegant',
    ]);

    $service = app(StorefrontRenderService::class);
    $resolved = $service->resolveThemeConfig($config);

    expect($resolved['typography']['heading_font'])->toBe('Playfair Display')
        ->and($resolved['typography']['body_font'])->toBe('Lora');
});

it('builds CSS variable string from resolved theme', function () {
    $service = app(StorefrontRenderService::class);
    $resolved = [
        'colors' => ['primary' => '#e94560', 'background' => '#ffffff', 'foreground' => '#1a1a2e'],
        'typography' => ['heading_font' => 'DM Sans', 'body_font' => 'DM Sans', 'base_size' => 16, 'line_height' => 1.6],
        'feel' => ['border_radius' => '8px', 'section_spacing' => '64px'],
    ];

    $css = $service->buildThemeStyles($resolved);

    expect($css)->toContain('--color-primary: #e94560')
        ->and($css)->toContain('--color-background: #ffffff')
        ->and($css)->toContain('--font-heading: "DM Sans"')
        ->and($css)->toContain('--font-body: "DM Sans"')
        ->and($css)->toContain('--radius: 8px')
        ->and($css)->toContain('--section-spacing: 64px');
});

it('builds complete page payload for composable page', function () {
    ['shop' => $shop, 'config' => $config] = createStorefrontStack();
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'title' => 'Welcome Home',
        'sections' => [
            ['type' => 'hero_banner', 'config' => ['variant' => 'centered_overlay', 'heading' => 'Welcome']],
        ],
        'seo_title' => 'My Shop - Home',
        'seo_description' => 'Welcome to my shop',
    ]);

    $service = app(StorefrontRenderService::class);
    $pageData = $service->buildPage($shop, StorefrontPageType::HOME);

    expect($pageData)
        ->toHaveKeys(['shop', 'template', 'theme', 'themeStyles', 'sections', 'seo', 'cart', 'navigation', 'customer', 'csrfToken'])
        ->and($pageData['shop']['name'])->toBe($shop->name)
        ->and($pageData['template'])->toHaveKeys(['slug', 'animation_tier', 'structural_config'])
        ->and($pageData['themeStyles'])->toBeString()
        ->and($pageData['sections'])->toBeArray()
        ->and($pageData['cart'])->toHaveKeys(['item_count', 'subtotal', 'total'])
        ->and($pageData['seo']['title'])->toBe('My Shop - Home')
        ->and($pageData['customer'])->toBeNull()
        ->and($pageData)->toHaveKey('csrfToken');
});

it('builds fixed page payload', function () {
    ['shop' => $shop] = createStorefrontStack();

    $service = app(StorefrontRenderService::class);
    $pageData = $service->buildFixedPage($shop, 'login');

    expect($pageData)
        ->toHaveKeys(['shop', 'template', 'theme', 'themeStyles', 'fixedPage', 'fixedPageData', 'cart', 'navigation', 'customer', 'csrfToken'])
        ->and($pageData['fixedPage'])->toBe('login')
        ->and($pageData['fixedPageData'])->toHaveKey('shop_name')
        ->and($pageData['template'])->toHaveKeys(['slug', 'animation_tier', 'structural_config'])
        ->and($pageData['cart'])->toHaveKeys(['item_count', 'subtotal', 'total'])
        ->and($pageData['seo'])->toBeArray();
});

it('builds SEO meta from page data', function () {
    ['shop' => $shop, 'config' => $config] = createStorefrontStack([], [
        'seo_defaults' => ['title_suffix' => ' | My Store', 'description' => 'Default description'],
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'title' => 'Home',
        'seo_title' => 'Custom Home Title',
        'seo_description' => null,
    ]);

    $service = app(StorefrontRenderService::class);
    $pageData = $service->buildPage($shop, StorefrontPageType::HOME);

    expect($pageData['seo']['title'])->toBe('Custom Home Title')
        ->and($pageData['seo']['description'])->toBe('Default description');
});

it('preserves section metadata through resolveSections', function () {
    ['shop' => $shop, 'config' => $config] = createStorefrontStack();
    StorefrontPage::factory()->create([
        'tenant_id' => $shop->tenant_id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'title' => 'Home',
        'sections' => [
            [
                'id' => 'section-abc-123',
                'type' => 'hero_banner',
                'variant' => 'split_image',
                'is_visible' => true,
                'scroll_animation' => 'fade_up',
                'config' => ['heading' => 'Welcome'],
            ],
            [
                'type' => 'rich_text',
                'config' => ['body' => 'Hello world'],
            ],
        ],
    ]);

    $service = app(StorefrontRenderService::class);
    $pageData = $service->buildPage($shop, StorefrontPageType::HOME);

    $sections = $pageData['sections'];

    expect($sections)->toHaveCount(2)
        ->and($sections[0]['id'])->toBe('section-abc-123')
        ->and($sections[0]['variant'])->toBe('split_image')
        ->and($sections[0]['is_visible'])->toBeTrue()
        ->and($sections[0]['scroll_animation'])->toBe('fade_up')
        ->and($sections[1]['id'])->toBeString()
        ->and($sections[1]['variant'])->toBe('default')
        ->and($sections[1]['is_visible'])->toBeTrue()
        ->and($sections[1]['scroll_animation'])->toBe('none');
});

it('returns 404 page data when page does not exist', function () {
    ['shop' => $shop] = createStorefrontStack();

    $service = app(StorefrontRenderService::class);
    $service->buildPage($shop, StorefrontPageType::ABOUT);
})->throws(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
