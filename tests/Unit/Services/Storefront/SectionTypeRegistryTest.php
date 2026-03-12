<?php

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\StorefrontTemplate;
use App\Services\Storefront\SectionTypeRegistry;

it('registers and retrieves section types', function () {
    $registry = new SectionTypeRegistry;
    $section = mock(StorefrontSectionInterface::class);
    $section->shouldReceive('type')->andReturn('hero_banner');
    $section->shouldReceive('category')->andReturn(SectionCategory::HERO);
    $section->shouldReceive('allowedPageTypes')->andReturn([]);
    $section->shouldReceive('minimumAnimationTier')->andReturn(StorefrontAnimationTier::SUBTLE);

    $registry->register($section);

    expect($registry->get('hero_banner'))->toBe($section);
    expect($registry->get('nonexistent'))->toBeNull();
    expect($registry->all())->toHaveCount(1);
});

it('filters sections by category', function () {
    $registry = new SectionTypeRegistry;

    $hero = mock(StorefrontSectionInterface::class);
    $hero->shouldReceive('type')->andReturn('hero_banner');
    $hero->shouldReceive('category')->andReturn(SectionCategory::HERO);

    $products = mock(StorefrontSectionInterface::class);
    $products->shouldReceive('type')->andReturn('featured_products');
    $products->shouldReceive('category')->andReturn(SectionCategory::PRODUCTS);

    $registry->register($hero);
    $registry->register($products);

    $byCategory = $registry->byCategory();
    expect($byCategory)->toHaveKey('hero');
    expect($byCategory['hero'])->toHaveCount(1);
    expect($byCategory['products'])->toHaveCount(1);
});

it('filters sections by page type', function () {
    $registry = new SectionTypeRegistry;

    $hero = mock(StorefrontSectionInterface::class);
    $hero->shouldReceive('type')->andReturn('hero_banner');
    $hero->shouldReceive('allowedPageTypes')->andReturn([StorefrontPageType::HOME, StorefrontPageType::ABOUT]);

    $grid = mock(StorefrontSectionInterface::class);
    $grid->shouldReceive('type')->andReturn('product_grid');
    $grid->shouldReceive('allowedPageTypes')->andReturn([StorefrontPageType::PRODUCTS]);

    $registry->register($hero);
    $registry->register($grid);

    $forHome = $registry->forPageType(StorefrontPageType::HOME);
    expect($forHome)->toHaveCount(1);
    expect($forHome[0]->type())->toBe('hero_banner');
});

it('filters sections by template supported sections', function () {
    $registry = new SectionTypeRegistry;

    $hero = mock(StorefrontSectionInterface::class);
    $hero->shouldReceive('type')->andReturn('hero_banner');

    $faq = mock(StorefrontSectionInterface::class);
    $faq->shouldReceive('type')->andReturn('faq');

    $registry->register($hero);
    $registry->register($faq);

    $template = new StorefrontTemplate;
    $template->supported_sections = ['hero_banner'];

    $filtered = $registry->forTemplate($template);
    expect($filtered)->toHaveCount(1);
    expect($filtered[0]->type())->toBe('hero_banner');
});

it('returns all sections when template has no supported_sections', function () {
    $registry = new SectionTypeRegistry;

    $hero = mock(StorefrontSectionInterface::class);
    $hero->shouldReceive('type')->andReturn('hero_banner');

    $faq = mock(StorefrontSectionInterface::class);
    $faq->shouldReceive('type')->andReturn('faq');

    $registry->register($hero);
    $registry->register($faq);

    $template = new StorefrontTemplate;
    $template->supported_sections = [];

    $filtered = $registry->forTemplate($template);
    expect($filtered)->toHaveCount(2);
});

it('resolves data via the registry', function () {
    $registry = new SectionTypeRegistry;

    $section = mock(StorefrontSectionInterface::class);
    $section->shouldReceive('type')->andReturn('hero_banner');
    $section->shouldReceive('resolveData')->once()->andReturn(['resolved' => true]);

    $registry->register($section);

    $shop = new \App\Models\Shop;
    $result = $registry->resolveData('hero_banner', ['heading' => 'Test'], $shop);
    expect($result)->toBe(['resolved' => true]);
});

it('returns empty array when resolving data for unknown type', function () {
    $registry = new SectionTypeRegistry;
    $shop = new \App\Models\Shop;

    $result = $registry->resolveData('nonexistent', [], $shop);
    expect($result)->toBe([]);
});

it('builds manifest for template', function () {
    $registry = new SectionTypeRegistry;

    $section = mock(StorefrontSectionInterface::class);
    $section->shouldReceive('type')->andReturn('hero_banner');
    $section->shouldReceive('label')->andReturn('Hero Banner');
    $section->shouldReceive('description')->andReturn('A hero banner section');
    $section->shouldReceive('category')->andReturn(SectionCategory::HERO);
    $section->shouldReceive('icon')->andReturn('photo');
    $section->shouldReceive('variants')->andReturn(['centered_overlay', 'split_image']);
    $section->shouldReceive('configSchema')->andReturn(['heading' => ['type' => 'text']]);
    $section->shouldReceive('defaultConfig')->andReturn(['heading' => 'Welcome']);
    $section->shouldReceive('maxPerPage')->andReturn(1);
    $section->shouldReceive('minimumAnimationTier')->andReturn(StorefrontAnimationTier::SUBTLE);

    $registry->register($section);

    $template = new StorefrontTemplate;
    $template->supported_sections = ['hero_banner'];

    $manifest = $registry->getBuilderManifest($template);
    expect($manifest)->toHaveKey('hero_banner');
    expect($manifest['hero_banner'])
        ->type->toBe('hero_banner')
        ->label->toBe('Hero Banner')
        ->category->toBe('hero')
        ->variants->toBe(['centered_overlay', 'split_image'])
        ->max_per_page->toBe(1)
        ->min_animation_tier->toBe('subtle');
});
