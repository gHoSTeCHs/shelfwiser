<?php

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Tenant;
use App\Services\Storefront\StorefrontBuilderService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create([
        'tenant_id' => $this->tenant->id,
        'storefront_enabled' => true,
    ]);
    $this->template = StorefrontTemplate::factory()->create([
        'supported_pages' => ['home', 'products', 'about', 'contact'],
    ]);
    $this->theme = StorefrontTheme::factory()->create([
        'template_id' => $this->template->id,
        'default_sections' => [
            ['type' => 'hero_banner', 'variant' => 'default', 'config' => ['heading' => 'Welcome']],
            ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => ['max_items' => 8]],
        ],
    ]);
    $this->service = app(StorefrontBuilderService::class);
});

it('initializes storefront with config and default pages', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);

    expect($config)->toBeInstanceOf(StorefrontConfig::class);
    expect($config->shop_id)->toBe($this->shop->id);
    expect($config->tenant_id)->toBe($this->tenant->id);
    expect($config->theme_id)->toBe($this->theme->id);
    expect($config->is_published)->toBeFalse();

    $pages = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->get();

    expect($pages)->toHaveCount(4);

    $homePage = $pages->firstWhere('page_type', StorefrontPageType::HOME);
    expect($homePage)->not->toBeNull();
    expect($homePage->sections)->toHaveCount(2);
    expect($homePage->sections[0]['type'])->toBe('hero_banner');
});

it('does not duplicate config on re-initialization and preserves existing sections', function () {
    $config1 = $this->service->initializeStorefront($this->shop, $this->theme);

    $homePage = StorefrontPage::query()
        ->where('storefront_config_id', $config1->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();
    $this->service->addSectionToPage($homePage, 'spacer', 'default');
    $sectionsBeforeReinit = $homePage->fresh()->sections;

    $config2 = $this->service->initializeStorefront($this->shop, $this->theme);

    expect($config1->id)->toBe($config2->id);
    expect(StorefrontConfig::query()->where('shop_id', $this->shop->id)->count())->toBe(1);

    $homePageAfter = StorefrontPage::query()
        ->where('storefront_config_id', $config2->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();
    expect($homePageAfter->sections)->toBe($sectionsBeforeReinit);
});

it('adds section to page at end', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $page = $this->service->addSectionToPage($page, 'newsletter_signup', 'default');

    expect($page->sections)->toHaveCount(3);
    expect($page->sections[2]['type'])->toBe('newsletter_signup');
    expect($page->sections[2]['id'])->toStartWith('sec_');
    expect($page->sections[2]['is_visible'])->toBeTrue();
});

it('adds section to page at specific position', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $page = $this->service->addSectionToPage($page, 'spacer', 'default', 1);

    expect($page->sections)->toHaveCount(3);
    expect($page->sections[1]['type'])->toBe('spacer');
});

it('updates section config by id', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $sectionId = $page->sections[0]['id'];

    $page = $this->service->updateSectionConfig($page, $sectionId, ['heading' => 'Updated Heading']);

    expect($page->sections[0]['config']['heading'])->toBe('Updated Heading');
});

it('throws when updating non-existent section', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $this->service->updateSectionConfig($page, 'sec_nonexistent', ['heading' => 'Test']);
})->throws(\InvalidArgumentException::class);

it('removes section from page', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $sectionId = $page->sections[0]['id'];

    $page = $this->service->removeSectionFromPage($page, $sectionId);

    expect($page->sections)->toHaveCount(1);
    expect($page->sections[0]['type'])->toBe('featured_products');
});

it('throws when removing non-existent section', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $this->service->removeSectionFromPage($page, 'sec_nonexistent');
})->throws(\InvalidArgumentException::class);

it('reorders sections by id array', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $id0 = $page->sections[0]['id'];
    $id1 = $page->sections[1]['id'];

    $page = $this->service->reorderSections($page, [$id1, $id0]);

    expect($page->sections[0]['id'])->toBe($id1);
    expect($page->sections[1]['id'])->toBe($id0);
});

it('throws on reorder with mismatched ids', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $this->service->reorderSections($page, ['sec_fake1', 'sec_fake2']);
})->throws(\InvalidArgumentException::class);

it('toggles section visibility', function () {
    $config = $this->service->initializeStorefront($this->shop, $this->theme);
    $page = StorefrontPage::query()
        ->where('storefront_config_id', $config->id)
        ->where('page_type', StorefrontPageType::HOME)
        ->first();

    $sectionId = $page->sections[0]['id'];

    $page = $this->service->toggleSectionVisibility($page, $sectionId);
    expect($page->sections[0]['is_visible'])->toBeFalse();

    $page = $this->service->toggleSectionVisibility($page, $sectionId);
    expect($page->sections[0]['is_visible'])->toBeTrue();
});

it('publishes storefront config', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
        'is_published' => false,
    ]);

    $config = $this->service->publish($config);

    expect($config->is_published)->toBeTrue();
    expect($config->published_at)->not->toBeNull();
});

it('unpublishes storefront config', function () {
    $config = StorefrontConfig::factory()->published()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);

    $config = $this->service->unpublish($config);

    expect($config->is_published)->toBeFalse();
    expect($config->published_at)->toBeNull();
});

it('resets config overrides to theme defaults', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
        'color_overrides' => ['primary' => '#ff0000'],
        'typography_overrides' => ['heading_font' => 'Arial'],
        'feel_overrides' => ['border_radius' => '10px'],
    ]);

    $config = $this->service->resetToThemeDefaults($config);

    expect($config->color_overrides)->toBeNull();
    expect($config->typography_overrides)->toBeNull();
    expect($config->feel_overrides)->toBeNull();
});
