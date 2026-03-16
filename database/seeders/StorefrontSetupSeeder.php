<?php

namespace Database\Seeders;

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTheme;
use Illuminate\Database\Seeder;

class StorefrontSetupSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(StorefrontTemplateSeeder::class);

        $themes = StorefrontTheme::query()->where('is_active', true)->get();

        if ($themes->isEmpty()) {
            $this->command->error('No themes found. StorefrontTemplateSeeder must run first.');

            return;
        }

        $shops = Shop::query()->limit(4)->get();

        if ($shops->isEmpty()) {
            $this->command->error('No shops found. Run ShopSeeder first.');

            return;
        }

        foreach ($shops as $index => $shop) {
            $theme = $themes[$index % $themes->count()];

            $shop->update(['storefront_enabled' => true]);

            $config = StorefrontConfig::query()->updateOrCreate(
                ['shop_id' => $shop->id],
                [
                    'tenant_id' => $shop->tenant_id,
                    'theme_id' => $theme->id,
                    'is_published' => true,
                    'published_at' => now(),
                    'global_announcement' => 'Free delivery on orders over ₦10,000!',
                    'seo_defaults' => [
                        'title' => $shop->name.' — Online Store',
                        'description' => "Shop online at {$shop->name}. Quality products delivered to your door.",
                    ],
                ]
            );

            $this->createPages($config, $shop);

            $this->command->info("Storefront enabled for '{$shop->name}' with theme '{$theme->name}'.");
        }
    }

    private function createPages(StorefrontConfig $config, Shop $shop): void
    {
        $pages = [
            [
                'page_type' => StorefrontPageType::HOME,
                'slug' => 'home',
                'title' => 'Home',
                'sort_order' => 1,
                'sections' => [
                    [
                        'id' => 'hero-1',
                        'type' => 'hero_banner',
                        'variant' => 'default',
                        'is_visible' => true,
                        'config' => [
                            'heading' => "Welcome to {$shop->name}",
                            'subheading' => 'Quality products at great prices',
                            'cta_text' => 'Shop Now',
                            'cta_link' => "/store/{$shop->slug}/products",
                            'overlay_opacity' => 0.4,
                        ],
                    ],
                    [
                        'id' => 'featured-1',
                        'type' => 'featured_products',
                        'variant' => 'standard_grid',
                        'is_visible' => true,
                        'config' => [
                            'heading' => 'Featured Products',
                            'product_source' => 'newest',
                            'max_items' => 8,
                            'columns' => 4,
                            'show_price' => true,
                            'show_add_to_cart' => true,
                        ],
                    ],
                    [
                        'id' => 'category-1',
                        'type' => 'category_grid',
                        'variant' => 'image_above',
                        'is_visible' => true,
                        'config' => [
                            'heading' => 'Shop by Category',
                            'columns' => 4,
                            'max_items' => 8,
                        ],
                    ],
                    [
                        'id' => 'newsletter-1',
                        'type' => 'newsletter_signup',
                        'variant' => 'default',
                        'is_visible' => true,
                        'config' => [
                            'heading' => 'Stay Updated',
                            'description' => 'Subscribe for exclusive offers and new arrivals.',
                            'button_text' => 'Subscribe',
                        ],
                    ],
                ],
            ],
            [
                'page_type' => StorefrontPageType::PRODUCTS,
                'slug' => 'products',
                'title' => 'Products',
                'sort_order' => 2,
                'sections' => [
                    [
                        'id' => 'product-grid-1',
                        'type' => 'product_grid',
                        'variant' => 'standard_grid',
                        'is_visible' => true,
                        'config' => [
                            'heading' => 'All Products',
                            'show_filters' => true,
                            'show_search' => true,
                            'columns' => 4,
                            'products_per_page' => 16,
                        ],
                    ],
                ],
            ],
            [
                'page_type' => StorefrontPageType::ABOUT,
                'slug' => 'about',
                'title' => 'About Us',
                'sort_order' => 3,
                'sections' => [],
            ],
            [
                'page_type' => StorefrontPageType::CONTACT,
                'slug' => 'contact',
                'title' => 'Contact',
                'sort_order' => 4,
                'sections' => [],
            ],
        ];

        foreach ($pages as $pageData) {
            StorefrontPage::query()->updateOrCreate(
                [
                    'shop_id' => $shop->id,
                    'page_type' => $pageData['page_type'],
                ],
                [
                    'tenant_id' => $shop->tenant_id,
                    'storefront_config_id' => $config->id,
                    'slug' => $pageData['slug'],
                    'title' => $pageData['title'],
                    'sections' => $pageData['sections'],
                    'is_published' => true,
                    'sort_order' => $pageData['sort_order'],
                ]
            );
        }
    }
}
