<?php

namespace App\Providers;

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
use App\Services\Storefront\SectionTypeRegistry;
use Illuminate\Support\ServiceProvider;

class StorefrontServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SectionTypeRegistry::class);
    }

    public function boot(): void
    {
        $registry = $this->app->make(SectionTypeRegistry::class);

        $sections = [
            HeroBannerSection::class,
            FeaturedProductsSection::class,
            ProductGridSection::class,
            CategoryGridSection::class,
            RichTextSection::class,
            ImageWithTextSection::class,
            TestimonialsSection::class,
            AnnouncementBarSection::class,
            NewsletterSignupSection::class,
            BannerSection::class,
            SpacerSection::class,
            GallerySection::class,
            VideoSection::class,
            FaqSection::class,
            ContactFormSection::class,
            LogoCloudSection::class,
            CountdownSection::class,
            CollectionListSection::class,
            RecentlyViewedSection::class,
            MapSection::class,
        ];

        foreach ($sections as $sectionClass) {
            $registry->register($this->app->make($sectionClass));
        }
    }
}
