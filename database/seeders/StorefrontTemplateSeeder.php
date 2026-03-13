<?php

namespace Database\Seeders;

use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontTemplateCategory;
use App\Enums\StorefrontThemeCategory;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use Illuminate\Database\Seeder;

class StorefrontTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $template = StorefrontTemplate::query()->updateOrCreate(
            ['slug' => 'classic-commerce'],
            [
                'name' => 'Classic Commerce',
                'description' => 'A versatile e-commerce template suited for Nigerian SMBs — clean layouts, fast load times, and mobile-first design.',
                'category' => StorefrontTemplateCategory::COMMERCE,
                'animation_tier' => StorefrontAnimationTier::SUBTLE,
                'navigation_pattern' => 'standard',
                'scroll_behavior' => 'standard',
                'is_premium' => false,
                'is_active' => true,
                'sort_order' => 1,
                'structural_config' => [
                    'max_sections_per_page' => 20,
                    'header_style' => 'standard',
                    'footer_style' => 'multi_column',
                    'sidebar_support' => false,
                    'max_menu_depth' => 2,
                ],
                'supported_sections' => [
                    'hero_banner', 'featured_products', 'product_grid', 'category_grid',
                    'rich_text', 'image_with_text', 'testimonials', 'announcement_bar',
                    'newsletter_signup', 'banner', 'spacer', 'gallery', 'video', 'faq',
                    'contact_form', 'logo_cloud', 'countdown', 'collection_list',
                    'recently_viewed', 'map',
                ],
                'supported_pages' => ['home', 'products', 'product_detail', 'cart', 'checkout', 'about', 'contact', 'custom'],
            ]
        );

        $this->seedThemes($template);
    }

    private function seedThemes(StorefrontTemplate $template): void
    {
        $themes = [
            $this->lagosExpressTheme(),
            $this->sunshineMarketTheme(),
            $this->abujaFreshTheme(),
            $this->crystalClearTheme(),
            $this->naijaVibrantTheme(),
            $this->metroProfessionalTheme(),
        ];

        foreach ($themes as $index => $theme) {
            StorefrontTheme::query()->updateOrCreate(
                ['slug' => $theme['slug']],
                array_merge($theme, [
                    'template_id' => $template->id,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'is_premium' => false,
                ])
            );
        }
    }

    private function lagosExpressTheme(): array
    {
        return [
            'name' => 'Lagos Express',
            'slug' => 'lagos-express',
            'description' => 'Bold, energetic design inspired by Lagos street markets — vibrant greens and warm golds.',
            'category' => StorefrontThemeCategory::GENERAL,
            'ideal_for' => 'General retail, electronics, fashion',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Lagos Green', 'primary' => '#059669', 'secondary' => '#064E3B', 'accent' => '#F59E0B', 'background' => '#FFFFFF', 'surface' => '#F9FAFB', 'text' => '#111827', 'text_muted' => '#6B7280'],
                        ['name' => 'Eko Gold', 'primary' => '#D97706', 'secondary' => '#92400E', 'accent' => '#059669', 'background' => '#FFFBEB', 'surface' => '#FEF3C7', 'text' => '#111827', 'text_muted' => '#6B7280'],
                        ['name' => 'Island Blue', 'primary' => '#2563EB', 'secondary' => '#1E40AF', 'accent' => '#F59E0B', 'background' => '#FFFFFF', 'surface' => '#EFF6FF', 'text' => '#111827', 'text_muted' => '#6B7280'],
                        ['name' => 'Night Market', 'primary' => '#10B981', 'secondary' => '#065F46', 'accent' => '#FBBF24', 'background' => '#111827', 'surface' => '#1F2937', 'text' => '#F9FAFB', 'text_muted' => '#9CA3AF'],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Inter',
                    'body_font' => 'Inter',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.6,
                    'options' => [
                        ['name' => 'Modern', 'heading_font' => 'Inter', 'body_font' => 'Inter'],
                        ['name' => 'Classic', 'heading_font' => 'Playfair Display', 'body_font' => 'Source Sans Pro'],
                        ['name' => 'Clean', 'heading_font' => 'DM Sans', 'body_font' => 'DM Sans'],
                    ],
                ],
                'components' => [
                    'button_style' => 'rounded',
                    'card_style' => 'shadow',
                    'input_style' => 'outlined',
                    'image_aspect_ratio' => '4:3',
                ],
                'feel' => [
                    'border_radius' => '0.5rem',
                    'section_spacing' => '4rem',
                    'shadow_depth' => 'medium',
                ],
                'animation' => [
                    'entrance' => 'fade-up',
                    'duration' => 600,
                    'stagger' => 100,
                ],
                'header' => [
                    'sticky' => true,
                    'transparent_on_hero' => false,
                    'show_search' => true,
                    'show_cart' => true,
                    'show_account' => true,
                ],
                'footer' => [
                    'style' => 'multi_column',
                    'show_social' => true,
                    'show_newsletter' => true,
                    'show_payment_icons' => true,
                ],
                'hero' => [
                    'default_height' => '70vh',
                    'overlay_opacity' => 0.4,
                ],
                'product_card' => [
                    'show_quick_add' => true,
                    'show_rating' => false,
                    'image_hover' => 'zoom',
                ],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'centered_overlay', 'config' => ['heading' => 'Welcome to Our Store', 'subheading' => 'Discover amazing products', 'cta_text' => 'Shop Now', 'cta_link' => '/products']],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => ['heading' => 'Featured Products', 'product_source' => 'featured', 'limit' => 8, 'columns' => 4]],
                ['type' => 'category_grid', 'variant' => 'image_overlay', 'config' => ['heading' => 'Shop by Category', 'columns' => 3]],
                ['type' => 'testimonials', 'variant' => 'cards', 'config' => ['heading' => 'What Our Customers Say']],
                ['type' => 'newsletter_signup', 'variant' => 'inline', 'config' => ['heading' => 'Stay Updated', 'subheading' => 'Subscribe for deals and new arrivals']],
                ['type' => 'spacer', 'variant' => 'default', 'config' => ['height' => '2rem']],
            ],
        ];
    }

    private function sunshineMarketTheme(): array
    {
        return [
            'name' => 'Sunshine Market',
            'slug' => 'sunshine-market',
            'description' => 'Warm, inviting design for grocery and food stores — earthy tones with fresh accents.',
            'category' => StorefrontThemeCategory::GROCERY,
            'ideal_for' => 'Grocery stores, food markets, organic shops',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Fresh Harvest', 'primary' => '#EA580C', 'secondary' => '#9A3412', 'accent' => '#16A34A', 'background' => '#FFFBEB', 'surface' => '#FEF3C7', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                        ['name' => 'Garden Green', 'primary' => '#16A34A', 'secondary' => '#166534', 'accent' => '#EA580C', 'background' => '#F0FDF4', 'surface' => '#DCFCE7', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'DM Sans',
                    'body_font' => 'DM Sans',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.6,
                    'options' => [
                        ['name' => 'Friendly', 'heading_font' => 'DM Sans', 'body_font' => 'DM Sans'],
                        ['name' => 'Traditional', 'heading_font' => 'Merriweather', 'body_font' => 'Open Sans'],
                    ],
                ],
                'components' => ['button_style' => 'rounded-full', 'card_style' => 'bordered', 'input_style' => 'outlined', 'image_aspect_ratio' => '1:1'],
                'feel' => ['border_radius' => '1rem', 'section_spacing' => '3rem', 'shadow_depth' => 'light'],
                'animation' => ['entrance' => 'fade-up', 'duration' => 500, 'stagger' => 80],
                'header' => ['sticky' => true, 'transparent_on_hero' => false, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'footer' => ['style' => 'multi_column', 'show_social' => true, 'show_newsletter' => true, 'show_payment_icons' => true],
                'hero' => ['default_height' => '60vh', 'overlay_opacity' => 0.3],
                'product_card' => ['show_quick_add' => true, 'show_rating' => false, 'image_hover' => 'zoom'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'split_image', 'config' => ['heading' => 'Fresh From the Market', 'subheading' => 'Quality produce delivered to your door', 'cta_text' => 'Shop Fresh', 'cta_link' => '/products']],
                ['type' => 'category_grid', 'variant' => 'image_above', 'config' => ['heading' => 'Browse Categories', 'columns' => 4]],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => ['heading' => 'Today\'s Picks', 'product_source' => 'featured', 'limit' => 8, 'columns' => 4]],
                ['type' => 'newsletter_signup', 'variant' => 'card', 'config' => ['heading' => 'Get Weekly Deals', 'subheading' => 'Fresh savings delivered to your inbox']],
            ],
        ];
    }

    private function abujaFreshTheme(): array
    {
        return [
            'name' => 'Abuja Fresh',
            'slug' => 'abuja-fresh',
            'description' => 'Clean, modern design with a premium feel — perfect for health, beauty, and wellness brands.',
            'category' => StorefrontThemeCategory::HEALTH,
            'ideal_for' => 'Health stores, pharmacies, beauty shops',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Clinical Clean', 'primary' => '#0EA5E9', 'secondary' => '#0369A1', 'accent' => '#14B8A6', 'background' => '#FFFFFF', 'surface' => '#F0F9FF', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Wellness Green', 'primary' => '#14B8A6', 'secondary' => '#0F766E', 'accent' => '#0EA5E9', 'background' => '#F0FDFA', 'surface' => '#CCFBF1', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Plus Jakarta Sans',
                    'body_font' => 'Plus Jakarta Sans',
                    'heading_weight' => '600',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.7,
                    'options' => [
                        ['name' => 'Modern', 'heading_font' => 'Plus Jakarta Sans', 'body_font' => 'Plus Jakarta Sans'],
                    ],
                ],
                'components' => ['button_style' => 'rounded', 'card_style' => 'shadow', 'input_style' => 'outlined', 'image_aspect_ratio' => '4:3'],
                'feel' => ['border_radius' => '0.75rem', 'section_spacing' => '4rem', 'shadow_depth' => 'light'],
                'animation' => ['entrance' => 'fade-up', 'duration' => 500, 'stagger' => 80],
                'header' => ['sticky' => true, 'transparent_on_hero' => false, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'footer' => ['style' => 'centered', 'show_social' => true, 'show_newsletter' => false, 'show_payment_icons' => true],
                'hero' => ['default_height' => '65vh', 'overlay_opacity' => 0.3],
                'product_card' => ['show_quick_add' => true, 'show_rating' => false, 'image_hover' => 'fade'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'centered_overlay', 'config' => ['heading' => 'Your Health, Our Priority', 'subheading' => 'Trusted products for your wellbeing', 'cta_text' => 'Explore', 'cta_link' => '/products']],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => ['heading' => 'Popular Products', 'product_source' => 'featured', 'limit' => 8, 'columns' => 4]],
                ['type' => 'image_with_text', 'variant' => 'image_left', 'config' => ['heading' => 'Why Choose Us', 'body' => 'Quality assured products with fast delivery.']],
                ['type' => 'testimonials', 'variant' => 'quotes', 'config' => ['heading' => 'Customer Reviews']],
            ],
        ];
    }

    private function crystalClearTheme(): array
    {
        return [
            'name' => 'Crystal Clear',
            'slug' => 'crystal-clear',
            'description' => 'Sleek, tech-forward design — sharp typography and a cool-toned palette for electronics and gadgets.',
            'category' => StorefrontThemeCategory::TECH,
            'ideal_for' => 'Electronics, gadgets, tech accessories',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Tech Blue', 'primary' => '#3B82F6', 'secondary' => '#1E40AF', 'accent' => '#8B5CF6', 'background' => '#FFFFFF', 'surface' => '#F8FAFC', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Dark Mode', 'primary' => '#60A5FA', 'secondary' => '#3B82F6', 'accent' => '#A78BFA', 'background' => '#0F172A', 'surface' => '#1E293B', 'text' => '#F1F5F9', 'text_muted' => '#94A3B8'],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Space Grotesk',
                    'body_font' => 'Inter',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.6,
                    'options' => [
                        ['name' => 'Techy', 'heading_font' => 'Space Grotesk', 'body_font' => 'Inter'],
                        ['name' => 'Minimal', 'heading_font' => 'Inter', 'body_font' => 'Inter'],
                    ],
                ],
                'components' => ['button_style' => 'sharp', 'card_style' => 'shadow', 'input_style' => 'filled', 'image_aspect_ratio' => '16:9'],
                'feel' => ['border_radius' => '0.375rem', 'section_spacing' => '4rem', 'shadow_depth' => 'medium'],
                'animation' => ['entrance' => 'fade-up', 'duration' => 600, 'stagger' => 100],
                'header' => ['sticky' => true, 'transparent_on_hero' => true, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'footer' => ['style' => 'multi_column', 'show_social' => true, 'show_newsletter' => true, 'show_payment_icons' => true],
                'hero' => ['default_height' => '80vh', 'overlay_opacity' => 0.5],
                'product_card' => ['show_quick_add' => true, 'show_rating' => false, 'image_hover' => 'zoom'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'centered_overlay', 'config' => ['heading' => 'Next-Gen Tech', 'subheading' => 'Latest gadgets at the best prices', 'cta_text' => 'Shop Now', 'cta_link' => '/products']],
                ['type' => 'featured_products', 'variant' => 'horizontal_scroll', 'config' => ['heading' => 'Trending Now', 'product_source' => 'featured', 'limit' => 10]],
                ['type' => 'banner', 'variant' => 'default', 'config' => ['heading' => 'Free Delivery on Orders Over ₦50,000', 'background_color' => '#EFF6FF']],
                ['type' => 'product_grid', 'variant' => 'standard_grid', 'config' => ['heading' => 'All Products', 'columns' => 4, 'rows' => 3]],
            ],
        ];
    }

    private function naijaVibrantTheme(): array
    {
        return [
            'name' => 'Naija Vibrant',
            'slug' => 'naija-vibrant',
            'description' => 'Bold, colourful design celebrating Nigerian fashion — rich purples and warm terracotta.',
            'category' => StorefrontThemeCategory::FASHION,
            'ideal_for' => 'Fashion boutiques, accessories, lifestyle brands',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Ankara Pulse', 'primary' => '#7C3AED', 'secondary' => '#5B21B6', 'accent' => '#F59E0B', 'background' => '#FFFFFF', 'surface' => '#FAF5FF', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                        ['name' => 'Terracotta', 'primary' => '#DC2626', 'secondary' => '#991B1B', 'accent' => '#D97706', 'background' => '#FFFBEB', 'surface' => '#FEF2F2', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Playfair Display',
                    'body_font' => 'Source Sans Pro',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.6,
                    'options' => [
                        ['name' => 'Elegant', 'heading_font' => 'Playfair Display', 'body_font' => 'Source Sans Pro'],
                        ['name' => 'Bold', 'heading_font' => 'Montserrat', 'body_font' => 'Montserrat'],
                    ],
                ],
                'components' => ['button_style' => 'sharp', 'card_style' => 'minimal', 'input_style' => 'outlined', 'image_aspect_ratio' => '3:4'],
                'feel' => ['border_radius' => '0', 'section_spacing' => '5rem', 'shadow_depth' => 'none'],
                'animation' => ['entrance' => 'fade-up', 'duration' => 700, 'stagger' => 120],
                'header' => ['sticky' => true, 'transparent_on_hero' => true, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'footer' => ['style' => 'minimal', 'show_social' => true, 'show_newsletter' => true, 'show_payment_icons' => false],
                'hero' => ['default_height' => '90vh', 'overlay_opacity' => 0.35],
                'product_card' => ['show_quick_add' => false, 'show_rating' => false, 'image_hover' => 'fade'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'slideshow', 'config' => ['slides' => [['heading' => 'New Collection', 'subheading' => 'Express your style', 'cta_text' => 'Shop Now', 'cta_link' => '/products']]]],
                ['type' => 'category_grid', 'variant' => 'image_overlay', 'config' => ['heading' => 'Collections', 'columns' => 3]],
                ['type' => 'featured_products', 'variant' => 'spotlight_plus_grid', 'config' => ['heading' => 'Trending', 'product_source' => 'featured', 'limit' => 5]],
                ['type' => 'image_with_text', 'variant' => 'image_right', 'config' => ['heading' => 'Our Story', 'body' => 'Celebrating Nigerian fashion with contemporary flair.']],
                ['type' => 'newsletter_signup', 'variant' => 'inline', 'config' => ['heading' => 'Join the Community', 'subheading' => 'Be the first to know about new drops']],
            ],
        ];
    }

    private function metroProfessionalTheme(): array
    {
        return [
            'name' => 'Metro Professional',
            'slug' => 'metro-professional',
            'description' => 'Corporate, no-nonsense design for wholesale and B2B — neutral palette with strong hierarchy.',
            'category' => StorefrontThemeCategory::GENERAL,
            'ideal_for' => 'Wholesale, B2B, office supplies',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Corporate', 'primary' => '#1D4ED8', 'secondary' => '#1E3A5F', 'accent' => '#F59E0B', 'background' => '#FFFFFF', 'surface' => '#F9FAFB', 'text' => '#111827', 'text_muted' => '#6B7280'],
                        ['name' => 'Slate', 'primary' => '#475569', 'secondary' => '#334155', 'accent' => '#0EA5E9', 'background' => '#FFFFFF', 'surface' => '#F8FAFC', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Inter',
                    'body_font' => 'Inter',
                    'heading_weight' => '600',
                    'body_weight' => '400',
                    'base_size' => 15,
                    'line_height' => 1.5,
                    'options' => [
                        ['name' => 'Professional', 'heading_font' => 'Inter', 'body_font' => 'Inter'],
                    ],
                ],
                'components' => ['button_style' => 'rounded', 'card_style' => 'bordered', 'input_style' => 'outlined', 'image_aspect_ratio' => '4:3'],
                'feel' => ['border_radius' => '0.375rem', 'section_spacing' => '3rem', 'shadow_depth' => 'light'],
                'animation' => ['entrance' => 'fade', 'duration' => 400, 'stagger' => 60],
                'header' => ['sticky' => true, 'transparent_on_hero' => false, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'footer' => ['style' => 'multi_column', 'show_social' => false, 'show_newsletter' => false, 'show_payment_icons' => true],
                'hero' => ['default_height' => '50vh', 'overlay_opacity' => 0.4],
                'product_card' => ['show_quick_add' => true, 'show_rating' => false, 'image_hover' => 'none'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'minimal_text', 'config' => ['heading' => 'Business Supplies', 'subheading' => 'Everything you need at wholesale prices', 'cta_text' => 'Browse Catalog', 'cta_link' => '/products']],
                ['type' => 'category_grid', 'variant' => 'chips', 'config' => ['heading' => 'Categories']],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => ['heading' => 'Popular Products', 'product_source' => 'featured', 'limit' => 12, 'columns' => 4]],
                ['type' => 'spacer', 'variant' => 'default', 'config' => ['height' => '2rem']],
            ],
        ];
    }
}
