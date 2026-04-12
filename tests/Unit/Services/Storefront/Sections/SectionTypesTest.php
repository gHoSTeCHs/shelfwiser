<?php

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Models\Shop;
use App\Services\Storefront\Sections\AnnouncementBarSection;
use App\Services\Storefront\Sections\BannerSection;
use App\Services\Storefront\Sections\CategoryGridSection;
use App\Services\Storefront\Sections\CollectionListSection;
use App\Services\Storefront\Sections\ContactFormSection;
use App\Services\Storefront\Sections\CountdownSection;
use App\Services\Storefront\Sections\FaqSection;
use App\Services\Storefront\Sections\FeaturedProductsSection;
use App\Services\Storefront\Sections\GallerySection;
use App\Services\Storefront\Sections\HeroBannerSection;
use App\Services\Storefront\Sections\ImageWithTextSection;
use App\Services\Storefront\Sections\LogoCloudSection;
use App\Services\Storefront\Sections\MapSection;
use App\Services\Storefront\Sections\NewsletterSignupSection;
use App\Services\Storefront\Sections\ProductGridSection;
use App\Services\Storefront\Sections\RecentlyViewedSection;
use App\Services\Storefront\Sections\RichTextSection;
use App\Services\Storefront\Sections\SpacerSection;
use App\Services\Storefront\Sections\TestimonialsSection;
use App\Services\Storefront\Sections\VideoSection;

$staticSections = [
    'hero_banner' => [HeroBannerSection::class, SectionCategory::HERO, 1, StorefrontAnimationTier::SUBTLE, ['centered_overlay', 'split_image', 'slideshow', 'minimal_text', 'video_background', 'asymmetric']],
    'rich_text' => [RichTextSection::class, SectionCategory::CONTENT, 0, StorefrontAnimationTier::NONE, []],
    'image_with_text' => [ImageWithTextSection::class, SectionCategory::CONTENT, 0, StorefrontAnimationTier::NONE, ['side_by_side', 'overlap', 'stacked', 'text_wrap']],
    'announcement_bar' => [AnnouncementBarSection::class, SectionCategory::NAVIGATION, 1, StorefrontAnimationTier::NONE, []],
    'banner' => [BannerSection::class, SectionCategory::MEDIA, 0, StorefrontAnimationTier::NONE, []],
    'spacer' => [SpacerSection::class, SectionCategory::LAYOUT, 0, StorefrontAnimationTier::NONE, []],
    'testimonials' => [TestimonialsSection::class, SectionCategory::SOCIAL_PROOF, 2, StorefrontAnimationTier::NONE, ['carousel', 'grid', 'masonry', 'single_spotlight', 'marquee']],
    'newsletter_signup' => [NewsletterSignupSection::class, SectionCategory::COMMERCE, 1, StorefrontAnimationTier::NONE, ['inline', 'stacked', 'split', 'popup_trigger']],
    'gallery' => [GallerySection::class, SectionCategory::MEDIA, 2, StorefrontAnimationTier::NONE, ['grid', 'masonry', 'carousel', 'fullscreen_slider']],
    'video' => [VideoSection::class, SectionCategory::MEDIA, 2, StorefrontAnimationTier::NONE, ['embedded', 'background_loop', 'lightbox']],
    'faq' => [FaqSection::class, SectionCategory::CONTENT, 1, StorefrontAnimationTier::NONE, []],
    'logo_cloud' => [LogoCloudSection::class, SectionCategory::SOCIAL_PROOF, 1, StorefrontAnimationTier::NONE, []],
    'countdown' => [CountdownSection::class, SectionCategory::COMMERCE, 1, StorefrontAnimationTier::NONE, []],
    'recently_viewed' => [RecentlyViewedSection::class, SectionCategory::PRODUCTS, 1, StorefrontAnimationTier::NONE, []],
];

foreach ($staticSections as $type => [$class, $category, $maxPerPage, $animationTier, $variants]) {
    it("implements interface correctly for {$type}", function () use ($class, $type, $category, $maxPerPage, $animationTier, $variants) {
        $section = app($class);

        expect($section)->toBeInstanceOf(StorefrontSectionInterface::class);
        expect($section->type())->toBe($type);
        expect($section->category())->toBe($category);
        expect($section->maxPerPage())->toBe($maxPerPage);
        expect($section->minimumAnimationTier())->toBe($animationTier);
        expect($section->variants())->toBe($variants);
        expect($section->label())->toBeString()->not->toBeEmpty();
        expect($section->description())->toBeString()->not->toBeEmpty();
        expect($section->icon())->toBeString()->not->toBeEmpty();
        expect($section->configSchema())->toBeArray()->not->toBeEmpty();
        expect($section->defaultConfig())->toBeArray();
        expect($section->allowedPageTypes())->toBeArray()->not->toBeEmpty();
    });
}

it('hero banner has correct default config keys', function () {
    $section = new HeroBannerSection;

    expect($section->defaultConfig())
        ->toHaveKey('heading', 'Welcome to Our Store')
        ->toHaveKey('cta_text', 'Shop Now')
        ->toHaveKey('height', 'large')
        ->toHaveKey('text_alignment', 'center');
});

it('hero banner resolves no data', function () {
    $section = new HeroBannerSection;
    $shop = new Shop;

    expect($section->resolveData([], $shop))->toBe([]);
});

it('featured products implements interface correctly', function () {
    $section = app(FeaturedProductsSection::class);

    expect($section)->toBeInstanceOf(StorefrontSectionInterface::class);
    expect($section->type())->toBe('featured_products');
    expect($section->category())->toBe(SectionCategory::PRODUCTS);
    expect($section->maxPerPage())->toBe(3);
    expect($section->variants())->toBe(['standard_grid', 'spotlight_plus_grid', 'horizontal_scroll', 'masonry', 'carousel']);
    expect($section->defaultConfig())->toHaveKey('product_source', 'featured');
});

it('product grid implements interface correctly', function () {
    $section = app(ProductGridSection::class);

    expect($section)->toBeInstanceOf(StorefrontSectionInterface::class);
    expect($section->type())->toBe('product_grid');
    expect($section->category())->toBe(SectionCategory::PRODUCTS);
    expect($section->maxPerPage())->toBe(2);
    expect($section->variants())->toBe(['standard_grid', 'sidebar_filters', 'infinite_scroll', 'grid_list_toggle']);
});

it('category grid implements interface correctly', function () {
    $section = app(CategoryGridSection::class);

    expect($section)->toBeInstanceOf(StorefrontSectionInterface::class);
    expect($section->type())->toBe('category_grid');
    expect($section->category())->toBe(SectionCategory::PRODUCTS);
    expect($section->variants())->toBe(['image_overlay', 'image_above', 'icon_grid', 'carousel', 'chips']);
});

it('collection list implements interface correctly', function () {
    $section = app(CollectionListSection::class);

    expect($section)->toBeInstanceOf(StorefrontSectionInterface::class);
    expect($section->type())->toBe('collection_list');
    expect($section->variants())->toBe(['tabs', 'rows', 'accordion']);
});

it('contact form resolves shop contact details', function () {
    $shop = new Shop;
    $shop->phone = '+234-800-111-2222';
    $shop->email = 'shop@example.com';
    $shop->address = '123 Main St';
    $shop->city = 'Lagos';
    $shop->state = 'Lagos';
    $shop->country = 'Nigeria';

    $section = new ContactFormSection;
    $data = $section->resolveData([], $shop);

    expect($data)
        ->phone->toBe('+234-800-111-2222')
        ->email->toBe('shop@example.com')
        ->address->toBe('123 Main St')
        ->city->toBe('Lagos');
});

it('map resolves shop address', function () {
    $shop = new Shop;
    $shop->name = 'Test Shop';
    $shop->address = '456 Avenue Rd';
    $shop->city = 'Abuja';
    $shop->state = 'FCT';
    $shop->country = 'Nigeria';

    $section = new MapSection;
    $data = $section->resolveData([], $shop);

    expect($data)
        ->name->toBe('Test Shop')
        ->address->toBe('456 Avenue Rd')
        ->city->toBe('Abuja');
});

it('config schema default values match default config', function () {
    $sections = [
        new HeroBannerSection,
        new RichTextSection,
        new SpacerSection,
        new AnnouncementBarSection,
        new BannerSection,
        new CountdownSection,
    ];

    foreach ($sections as $section) {
        $defaults = $section->defaultConfig();
        $schema = $section->configSchema();

        foreach ($schema as $key => $field) {
            expect($defaults)->toHaveKey($key);
            expect($defaults[$key])->toBe($field['default']);
        }
    }
});
