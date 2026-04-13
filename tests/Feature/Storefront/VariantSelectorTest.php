<?php

use App\Enums\OptionVisualType;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use App\Services\Storefront\StorefrontRenderService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create([
        'tenant_id' => $this->tenant->id,
        'storefront_enabled' => true,
    ]);

    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    StorefrontConfig::factory()->published()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $theme->id,
    ]);

    $this->service = app(StorefrontRenderService::class);
});

it('serializes structured options for a variant product in the product detail page data', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'is_active' => true,
        'has_variants' => true,
    ]);

    $sizeOption = ProductOption::query()->create([
        'product_id' => $product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);
    $small = $sizeOption->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);
    $large = $sizeOption->values()->create(['label' => 'Large', 'value' => 'large', 'position' => 2]);

    $colorOption = ProductOption::query()->create([
        'product_id' => $product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'color',
        'display_name' => 'Color',
        'position' => 2,
        'visual_type' => OptionVisualType::ColorSwatch,
    ]);
    $red = $colorOption->values()->create([
        'label' => 'Red',
        'value' => 'red',
        'position' => 1,
        'visual_data' => ['hex' => '#FF0000'],
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'name' => 'Small / Red',
        'price' => 5000,
        'is_active' => true,
    ]);
    $variant->optionValues()->attach([$small->id, $red->id]);

    $pageData = $this->service->buildFixedPage($this->shop, 'product-detail', ['slug' => $product->slug], null, 'fake-token');

    $options = $pageData['fixedPageData']['product']['options'];

    expect($options)->toHaveCount(2);
    expect($options[0]['visual_type'])->toBe(OptionVisualType::ButtonGroup->value);
    expect($options[0]['values'][0]['label'])->toBe('Small');
    expect($options[1]['visual_type'])->toBe(OptionVisualType::ColorSwatch->value);
    expect($options[1]['values'][0]['visual_data']['hex'])->toBe('#FF0000');
});

it('includes option_value_ids on each serialized variant', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'is_active' => true,
        'has_variants' => true,
    ]);

    $option = ProductOption::query()->create([
        'product_id' => $product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::ButtonGroup,
    ]);
    $small = $option->values()->create(['label' => 'Small', 'value' => 'small', 'position' => 1]);
    $large = $option->values()->create(['label' => 'Large', 'value' => 'large', 'position' => 2]);

    $variantSmall = ProductVariant::factory()->create(['product_id' => $product->id, 'name' => 'Small', 'is_active' => true]);
    $variantSmall->optionValues()->attach([$small->id]);

    $variantLarge = ProductVariant::factory()->create(['product_id' => $product->id, 'name' => 'Large', 'is_active' => true]);
    $variantLarge->optionValues()->attach([$large->id]);

    $pageData = $this->service->buildFixedPage($this->shop, 'product-detail', ['slug' => $product->slug], null, 'fake-token');

    $variants = $pageData['fixedPageData']['product']['variants'];

    expect($variants)->toHaveCount(2);
    expect($variants[0]['option_value_ids'])->toContain($small->id);
    expect($variants[1]['option_value_ids'])->toContain($large->id);
});

it('falls back gracefully when product has no options', function () {
    $product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'is_active' => true,
        'has_variants' => true,
    ]);

    ProductVariant::factory()->create([
        'product_id' => $product->id,
        'name' => 'Red / Large',
        'attributes' => ['color' => 'Red', 'size' => 'Large'],
        'is_active' => true,
    ]);

    $pageData = $this->service->buildFixedPage($this->shop, 'product-detail', ['slug' => $product->slug], null, 'fake-token');

    expect($pageData['fixedPageData']['product']['options'])->toBeEmpty();
    expect($pageData['fixedPageData']['product']['variants'][0]['name'])->toBe('Red / Large');
});
