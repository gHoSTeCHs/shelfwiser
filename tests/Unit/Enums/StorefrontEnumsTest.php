<?php

use App\Enums\StorefrontTemplateCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Enums\StorefrontThemeCategory;
use App\Enums\SectionCategory;

it('has all template categories', function () {
    expect(StorefrontTemplateCategory::cases())->toHaveCount(11);
    expect(StorefrontTemplateCategory::COMMERCE->value)->toBe('commerce');
    expect(StorefrontTemplateCategory::COMMERCE->label())->toBe('Commerce');
    expect(StorefrontTemplateCategory::forSelect())->toBeArray()->toHaveCount(11);
});

it('has all animation tiers', function () {
    expect(StorefrontAnimationTier::cases())->toHaveCount(4);
    expect(StorefrontAnimationTier::NONE->value)->toBe('none');
    expect(StorefrontAnimationTier::CINEMATIC->value)->toBe('cinematic');
    expect(StorefrontAnimationTier::forSelect())->toBeArray()->toHaveCount(4);
});

it('has all page types', function () {
    expect(StorefrontPageType::cases())->toHaveCount(8);
    expect(StorefrontPageType::HOME->value)->toBe('home');
    expect(StorefrontPageType::PRODUCT_DETAIL->value)->toBe('product_detail');
    expect(StorefrontPageType::forSelect())->toBeArray()->toHaveCount(8);
});

it('has all theme categories', function () {
    expect(StorefrontThemeCategory::cases())->toHaveCount(6);
    expect(StorefrontThemeCategory::GENERAL->value)->toBe('general');
    expect(StorefrontThemeCategory::FASHION->label())->toBe('Fashion & Luxury');
    expect(StorefrontThemeCategory::forSelect())->toBeArray()->toHaveCount(6);
});

it('has all section categories', function () {
    expect(SectionCategory::cases())->toHaveCount(8);
    expect(SectionCategory::HERO->value)->toBe('hero');
    expect(SectionCategory::PRODUCTS->value)->toBe('products');
    expect(SectionCategory::forSelect())->toBeArray()->toHaveCount(8);
});
