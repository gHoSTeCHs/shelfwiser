<?php

namespace Database\Seeders;

use App\Enums\StorefrontPageType;
use App\Models\Image;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTheme;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

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

        $this->seedProductImages();
        $this->seedCategoryImages();

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
                    'dark_mode_enabled' => true,
                    'dark_mode_strategy' => 'system',
                    'global_announcement' => ['text' => 'Free delivery on orders over ₦10,000!', 'enabled' => true],
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
                'sections' => $this->homeSections($shop),
            ],
            [
                'page_type' => StorefrontPageType::PRODUCTS,
                'slug' => 'products',
                'title' => 'Products',
                'sort_order' => 2,
                'sections' => [
                    [
                        'id' => 'sec_'.Str::random(12),
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
                'sections' => $this->aboutSections($shop),
            ],
            [
                'page_type' => StorefrontPageType::CONTACT,
                'slug' => 'contact',
                'title' => 'Contact',
                'sort_order' => 4,
                'sections' => $this->contactSections($shop),
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

    private function homeSections(Shop $shop): array
    {
        return [
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'hero_banner',
                'variant' => 'centered_overlay',
                'is_visible' => true,
                'config' => [
                    'heading' => "Welcome to {$shop->name}",
                    'subheading' => 'Quality products at great prices',
                    'cta_text' => 'Shop Now',
                    'cta_link' => "/store/{$shop->slug}/products",
                    'secondary_cta_text' => 'About Us',
                    'secondary_cta_link' => "/store/{$shop->slug}/about",
                    'image' => self::HERO_IMAGES[array_rand(self::HERO_IMAGES)],
                    'overlay_opacity' => 0.45,
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'featured_products',
                'variant' => 'standard_grid',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Featured Products',
                    'subheading' => 'Hand-picked for you',
                    'product_source' => 'newest',
                    'max_items' => 8,
                    'columns' => 4,
                    'show_price' => true,
                    'show_add_to_cart' => true,
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'category_grid',
                'variant' => 'image_above',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Shop by Category',
                    'subheading' => 'Browse our collections',
                    'columns' => 4,
                    'max_items' => 8,
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'image_with_text',
                'variant' => 'side_by_side',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Our Story',
                    'text' => "We started {$shop->name} with a simple belief: Nigerian shoppers deserve better. Better quality, better prices, better service. Every product in our store is hand-picked and quality-checked before it reaches you.",
                    'image' => self::STORY_IMAGES[array_rand(self::STORY_IMAGES)],
                    'cta_text' => 'Learn More',
                    'cta_link' => "/store/{$shop->slug}/about",
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'testimonials',
                'variant' => 'grid',
                'is_visible' => true,
                'config' => [
                    'heading' => 'What Our Customers Say',
                    'testimonials' => self::TESTIMONIALS,
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'newsletter_signup',
                'variant' => 'inline',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Stay Updated',
                    'subheading' => 'Get exclusive deals and new arrivals in your inbox.',
                    'placeholder' => 'Enter your email',
                    'button_text' => 'Subscribe',
                ],
            ],
        ];
    }

    private function aboutSections(Shop $shop): array
    {
        return [
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'hero_banner',
                'variant' => 'minimal_text',
                'is_visible' => true,
                'config' => [
                    'heading' => "About {$shop->name}",
                    'subheading' => 'Our mission is to bring quality products to every Nigerian home',
                    'image' => self::ABOUT_HERO_IMAGES[array_rand(self::ABOUT_HERO_IMAGES)],
                    'overlay_opacity' => 0.5,
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'image_with_text',
                'variant' => 'side_by_side',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Who We Are',
                    'text' => "Founded with a passion for quality and service, {$shop->name} has grown from a small local shop to a trusted name in Nigerian retail. We believe every customer deserves an exceptional shopping experience — from browsing to unboxing.",
                    'image' => 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80',
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'image_with_text',
                'variant' => 'overlap',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Our Promise',
                    'text' => 'Every product we sell is quality-checked, fairly priced, and backed by our customer satisfaction guarantee. If you are not happy, we will make it right. No exceptions.',
                    'image' => 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop&q=80',
                    'image_position' => 'right',
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'testimonials',
                'variant' => 'single_spotlight',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Trusted by Thousands',
                    'testimonials' => self::TESTIMONIALS,
                ],
            ],
        ];
    }

    private function contactSections(Shop $shop): array
    {
        return [
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'hero_banner',
                'variant' => 'minimal_text',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Get In Touch',
                    'subheading' => "We'd love to hear from you. Reach out anytime.",
                ],
            ],
            [
                'id' => 'sec_'.Str::random(12),
                'type' => 'contact_form',
                'variant' => 'side_by_side',
                'is_visible' => true,
                'config' => [
                    'heading' => 'Send Us a Message',
                    'subheading' => 'Our team typically responds within 24 hours.',
                    'success_message' => "Thanks for reaching out! We'll get back to you soon.",
                ],
            ],
        ];
    }

    private function seedProductImages(): void
    {
        $products = Product::query()->with('images')->get();
        $updated = 0;

        foreach ($products as $product) {
            $url = $this->matchProductImage($product->name);

            if ($product->images->isNotEmpty()) {
                foreach ($product->images as $image) {
                    if ($image->path !== $url) {
                        $image->update(['path' => $url]);
                        $updated++;
                    }
                }
            } else {
                Image::query()->create([
                    'tenant_id' => $product->tenant_id,
                    'imageable_type' => Product::class,
                    'imageable_id' => $product->id,
                    'filename' => $product->slug.'.jpg',
                    'path' => $url,
                    'disk' => 'public',
                    'mime_type' => 'image/jpeg',
                    'size' => 0,
                    'width' => 600,
                    'height' => 800,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
                $updated++;
            }
        }

        $this->command->info("Seeded {$updated} product images.");
    }

    private function seedCategoryImages(): void
    {
        $categories = ProductCategory::query()->whereNotNull('tenant_id')->with('images')->get();
        $updated = 0;

        foreach ($categories as $category) {
            $url = $this->matchCategoryImage($category->name);

            if ($category->images->isNotEmpty()) {
                foreach ($category->images as $image) {
                    if ($image->path !== $url) {
                        $image->update(['path' => $url]);
                        $updated++;
                    }
                }
            } else {
                Image::query()->create([
                    'tenant_id' => $category->tenant_id,
                    'imageable_type' => ProductCategory::class,
                    'imageable_id' => $category->id,
                    'filename' => $category->slug.'.jpg',
                    'path' => $url,
                    'disk' => 'public',
                    'mime_type' => 'image/jpeg',
                    'size' => 0,
                    'width' => 800,
                    'height' => 600,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
                $updated++;
            }
        }

        $this->command->info("Seeded {$updated} category images.");
    }

    private function matchProductImage(string $name): string
    {
        $lower = strtolower($name);

        foreach (self::PRODUCT_IMAGES as $keyword => $url) {
            if (str_contains($lower, $keyword)) {
                return $url;
            }
        }

        return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop&q=80';
    }

    private function matchCategoryImage(string $name): string
    {
        $lower = strtolower($name);

        foreach (self::CATEGORY_IMAGES as $keyword => $url) {
            if (str_contains($lower, $keyword)) {
                return $url;
            }
        }

        return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&q=80';
    }

    private const HERO_IMAGES = [
        'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&h=900&fit=crop&q=80',
    ];

    private const ABOUT_HERO_IMAGES = [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1600&h=900&fit=crop&q=80',
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&h=900&fit=crop&q=80',
    ];

    private const STORY_IMAGES = [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop&q=80',
    ];

    private const TESTIMONIALS = [
        [
            'name' => 'Adebayo Okonkwo',
            'role' => 'Repeat customer',
            'text' => 'The quality of products here is consistently outstanding. Fast delivery to Lagos mainland and the packaging is always pristine.',
            'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face&q=80',
            'rating' => 5,
        ],
        [
            'name' => 'Ngozi Eze',
            'role' => 'Fashion enthusiast',
            'text' => 'Finally a Nigerian store that understands curation. Every piece I\'ve bought has been exactly as described. The ankara fabrics are top quality.',
            'avatar' => 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face&q=80',
            'rating' => 5,
        ],
        [
            'name' => 'Chidi Nwankwo',
            'role' => 'First-time buyer',
            'text' => 'Was skeptical at first, but the customer service won me over. They tracked my order all the way to Abuja. Will definitely shop again.',
            'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face&q=80',
            'rating' => 4,
        ],
    ];

    private const PRODUCT_IMAGES = [
        'samsung' => 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=800&fit=crop&q=80',
        'iphone' => 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=800&fit=crop&q=80',
        'laptop' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=800&fit=crop&q=80',
        'charger' => 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=800&fit=crop&q=80',
        'mouse' => 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=800&fit=crop&q=80',
        'earbuds' => 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=800&fit=crop&q=80',
        'headphone' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=800&fit=crop&q=80',
        'speaker' => 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=800&fit=crop&q=80',
        'fan' => 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&h=800&fit=crop&q=80',
        'sneaker' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop&q=80',
        'nike' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop&q=80',
        'shirt' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&q=80',
        'dress' => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&q=80',
        'jeans' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop&q=80',
        'fabric' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80',
        'ankara' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80',
        'lotion' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=800&fit=crop&q=80',
        'serum' => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&fit=crop&q=80',
        'cream' => 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=800&fit=crop&q=80',
        'sanitizer' => 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&h=800&fit=crop&q=80',
        'soap' => 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=600&h=800&fit=crop&q=80',
        'paracetamol' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=800&fit=crop&q=80',
        'vitamin' => 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&h=800&fit=crop&q=80',
        'tablet' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=800&fit=crop&q=80',
        'rice' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=800&fit=crop&q=80',
        'bread' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=800&fit=crop&q=80',
        'egg' => 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&h=800&fit=crop&q=80',
        'noodle' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=800&fit=crop&q=80',
        'indomie' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=800&fit=crop&q=80',
        'coca' => 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&h=800&fit=crop&q=80',
        'juice' => 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&h=800&fit=crop&q=80',
        'chocolate' => 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&h=800&fit=crop&q=80',
        'cooking oil' => 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=800&fit=crop&q=80',
        'detergent' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=800&fit=crop&q=80',
        'toilet' => 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&h=800&fit=crop&q=80',
        'chair' => 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=800&fit=crop&q=80',
        'basket' => 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=800&fit=crop&q=80',
    ];

    private const CATEGORY_IMAGES = [
        'electronics' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80',
        'fashion' => 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80',
        'clothing' => 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80',
        'beauty' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&q=80',
        'skincare' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&q=80',
        'home' => 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=600&fit=crop&q=80',
        'kitchen' => 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&q=80',
        'food' => 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop&q=80',
        'beverage' => 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop&q=80',
        'grocery' => 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop&q=80',
        'health' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
        'wellness' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
        'personal' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop&q=80',
        'snack' => 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop&q=80',
        'confection' => 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop&q=80',
    ];
}
