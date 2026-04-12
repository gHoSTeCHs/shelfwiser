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
                'description' => 'A versatile e-commerce template built for Nigerian SMBs — clean layouts, fast load times, and mobile-first design.',
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
            'description' => 'Energetic, urban design inspired by the hustle of Lagos — bold greens, warm golds, and the confidence of Computer Village.',
            'category' => StorefrontThemeCategory::GENERAL,
            'ideal_for' => 'General retail, electronics, phone accessories, multi-category shops',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Eko Green', 'primary' => '#047857', 'secondary' => '#064E3B', 'accent' => '#D97706', 'background' => '#FFFFFF', 'surface' => '#F0FDF4', 'text' => '#0C1713', 'text_muted' => '#4B5563'],
                        ['name' => 'Third Mainland', 'primary' => '#0369A1', 'secondary' => '#0C4A6E', 'accent' => '#EA580C', 'background' => '#FFFFFF', 'surface' => '#F0F9FF', 'text' => '#0F172A', 'text_muted' => '#475569'],
                        ['name' => 'Lekki Gold', 'primary' => '#B45309', 'secondary' => '#78350F', 'accent' => '#047857', 'background' => '#FFFBEB', 'surface' => '#FEF3C7', 'text' => '#1C1917', 'text_muted' => '#57534E'],
                        ['name' => 'Oshodi Night', 'primary' => '#10B981', 'secondary' => '#059669', 'accent' => '#F59E0B', 'background' => '#0F172A', 'surface' => '#1E293B', 'text' => '#F1F5F9', 'text_muted' => '#94A3B8'],
                    ],
                ],
                'colors_dark' => [
                    'primary' => '#ff6b81', 'primary-foreground' => '#ffffff', 'accent' => '#fbbf24',
                    'background' => '#0c0c14', 'foreground' => '#f5f5f7', 'card-bg' => '#161621',
                    'surface' => '#111119', 'border' => '#2a2a3a', 'text' => '#d1d1d9',
                    'text-muted' => '#8888a0', 'muted-foreground' => '#8888a0',
                    'footer-bg' => '#060609', 'footer-text' => '#d1d1d9',
                ],
                'palette_dark' => [
                    'presets' => [
                        [
                            'name' => 'Lagos Express Dark',
                            'primary' => '#ff6b81', 'primary-foreground' => '#ffffff', 'accent' => '#fbbf24',
                            'background' => '#0c0c14', 'foreground' => '#f5f5f7', 'card-bg' => '#161621',
                            'surface' => '#111119', 'border' => '#2a2a3a', 'text' => '#d1d1d9',
                            'text-muted' => '#8888a0', 'muted-foreground' => '#8888a0',
                            'footer-bg' => '#060609', 'footer-text' => '#d1d1d9',
                        ],
                        [
                            'name' => 'Lagos Express Warm',
                            'primary' => '#ff6b81', 'primary-foreground' => '#ffffff', 'accent' => '#fbbf24',
                            'background' => '#1c1917', 'foreground' => '#fafaf9', 'card-bg' => '#292524',
                            'surface' => '#1c1917', 'border' => '#44403c', 'text' => '#d6d3d1',
                            'text-muted' => '#a8a29e', 'muted-foreground' => '#a8a29e',
                            'footer-bg' => '#0c0a09', 'footer-text' => '#d6d3d1',
                        ],
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
                        ['name' => 'Sharp & Modern', 'heading_font' => 'DM Sans', 'body_font' => 'DM Sans'],
                        ['name' => 'Bold Statement', 'heading_font' => 'Sora', 'body_font' => 'Nunito Sans'],
                        ['name' => 'Warm Professional', 'heading_font' => 'Lexend', 'body_font' => 'Source Sans 3'],
                    ],
                ],
                'components' => [
                    'button_style' => 'rounded',
                    'card_style' => 'shadow',
                    'input_style' => 'outlined',
                    'image_aspect_ratio' => '4:3',
                ],
                'component_options' => [
                    'button_style' => ['rounded', 'sharp', 'pill'],
                    'card_style' => ['shadow', 'bordered', 'flat'],
                    'input_style' => ['outlined', 'filled', 'underlined'],
                ],
                'feel' => [
                    'border_radius' => '0.5rem',
                    'section_spacing' => '4rem',
                    'shadow_depth' => 'medium',
                ],
                'feel_options' => [
                    'border_radius' => ['0', '0.25rem', '0.5rem', '0.75rem', '1rem'],
                    'section_spacing' => ['2rem', '3rem', '4rem', '5rem'],
                    'shadow_depth' => ['none', 'light', 'medium', 'heavy'],
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
                'header_options' => ['variant' => ['standard', 'centered_logo']],
                'footer' => [
                    'style' => 'multi_column',
                    'show_social' => true,
                    'show_newsletter' => true,
                    'show_payment_icons' => true,
                ],
                'footer_options' => ['style' => ['multi_column', 'minimal', 'centered']],
                'hero' => ['default_height' => '70vh', 'overlay_opacity' => 0.4],
                'product_card' => ['show_quick_add' => true, 'show_rating' => true, 'image_hover' => 'zoom'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'centered_overlay', 'config' => [
                    'heading' => 'Original Phones, Original Prices',
                    'subheading' => 'No fake, no refurbished — every product guaranteed authentic. Delivery across Lagos in 24hrs.',
                    'cta_text' => 'Shop Now',
                    'cta_link' => '/products',
                    'height' => 'large',
                    'text_alignment' => 'center',
                ]],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => [
                    'heading' => 'Hot This Week',
                    'subheading' => 'Top picks from our customers',
                    'product_source' => 'newest',
                    'max_items' => 8,
                    'columns' => 4,
                    'show_price' => true,
                    'show_add_to_cart' => true,
                ]],
                ['type' => 'category_grid', 'variant' => 'image_overlay', 'config' => [
                    'heading' => 'Shop by Category',
                    'columns' => 3,
                    'max_items' => 6,
                ]],
                ['type' => 'testimonials', 'variant' => 'carousel', 'config' => [
                    'heading' => 'What Lagos Is Saying',
                    'items' => [
                        ['name' => 'Chinedu O.', 'text' => 'Ordered a Samsung S24 on Monday, got it Tuesday morning in Ikeja. Legit product, sealed box. I go dey come back!', 'rating' => 5, 'location' => 'Ikeja, Lagos', 'avatar_path' => null],
                        ['name' => 'Amaka E.', 'text' => 'Finally, an online store I can trust. The prices are better than what I see at Computer Village and delivery is on point.', 'rating' => 5, 'location' => 'Lekki, Lagos', 'avatar_path' => null],
                        ['name' => 'Babatunde K.', 'text' => 'I have bought three times now. The customer service is excellent — they even called to confirm my order.', 'rating' => 4, 'location' => 'Surulere, Lagos', 'avatar_path' => null],
                    ],
                ]],
                ['type' => 'newsletter_signup', 'variant' => 'inline', 'config' => [
                    'heading' => 'Get Exclusive Deals',
                    'description' => 'Join 5,000+ customers who get first access to flash sales and new arrivals.',
                    'button_text' => 'Subscribe',
                ]],
                ['type' => 'spacer', 'variant' => 'default', 'config' => ['height' => 'medium']],
            ],
        ];
    }

    private function sunshineMarketTheme(): array
    {
        return [
            'name' => 'Sunshine Market',
            'slug' => 'sunshine-market',
            'description' => 'Warm, abundant design for grocery and food stores — earthy terracotta, garden greens, and the spirit of a Nigerian open market.',
            'category' => StorefrontThemeCategory::GROCERY,
            'ideal_for' => 'Grocery stores, food markets, provisions, fresh produce',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Buka Fresh', 'primary' => '#C2410C', 'secondary' => '#7C2D12', 'accent' => '#15803D', 'background' => '#FFFBEB', 'surface' => '#FEF3C7', 'text' => '#1C1917', 'text_muted' => '#57534E'],
                        ['name' => 'Garden Harvest', 'primary' => '#15803D', 'secondary' => '#14532D', 'accent' => '#EA580C', 'background' => '#F0FDF4', 'surface' => '#DCFCE7', 'text' => '#1C1917', 'text_muted' => '#57534E'],
                        ['name' => 'Pepper Soup', 'primary' => '#DC2626', 'secondary' => '#991B1B', 'accent' => '#D97706', 'background' => '#FFFFFF', 'surface' => '#FEF2F2', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                        ['name' => 'Sunday Rice', 'primary' => '#A16207', 'secondary' => '#713F12', 'accent' => '#16A34A', 'background' => '#FEFCE8', 'surface' => '#FEF9C3', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                    ],
                ],
                'colors_dark' => [
                    'primary' => '#fb923c', 'accent' => '#ef4444',
                    'background' => '#141110', 'foreground' => '#fef3c7', 'card-bg' => '#1f1b17',
                    'surface' => '#1a1611', 'border' => '#3d3428', 'text' => '#e8d5b8',
                    'text-muted' => '#a08968', 'muted-foreground' => '#a08968',
                    'footer-bg' => '#0a0908', 'footer-text' => '#e8d5b8',
                ],
                'palette_dark' => [
                    'presets' => [
                        [
                            'name' => 'Sunshine Market Dark',
                            'primary' => '#fb923c', 'primary-foreground' => '#ffffff', 'accent' => '#ef4444',
                            'background' => '#141110', 'foreground' => '#fef3c7', 'card-bg' => '#1f1b17',
                            'surface' => '#1a1611', 'border' => '#3d3428', 'text' => '#e8d5b8',
                            'text-muted' => '#a08968', 'muted-foreground' => '#a08968',
                            'footer-bg' => '#0a0908', 'footer-text' => '#e8d5b8',
                        ],
                        [
                            'name' => 'Sunshine Market Midnight',
                            'primary' => '#f97316', 'primary-foreground' => '#ffffff', 'accent' => '#dc2626',
                            'background' => '#0f0f0f', 'foreground' => '#f5f5f4', 'card-bg' => '#1a1a1a',
                            'surface' => '#141414', 'border' => '#333333', 'text' => '#d4d4d4',
                            'text-muted' => '#8a8a8a', 'muted-foreground' => '#8a8a8a',
                            'footer-bg' => '#0a0a0a', 'footer-text' => '#d4d4d4',
                        ],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Nunito',
                    'body_font' => 'Nunito Sans',
                    'heading_weight' => '800',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.65,
                    'options' => [
                        ['name' => 'Friendly & Round', 'heading_font' => 'Nunito', 'body_font' => 'Nunito Sans'],
                        ['name' => 'Market Classic', 'heading_font' => 'Bitter', 'body_font' => 'Karla'],
                        ['name' => 'Clean & Light', 'heading_font' => 'Outfit', 'body_font' => 'Outfit'],
                    ],
                ],
                'components' => ['button_style' => 'pill', 'card_style' => 'bordered', 'input_style' => 'outlined', 'image_aspect_ratio' => '1:1'],
                'component_options' => [
                    'button_style' => ['pill', 'rounded', 'sharp'],
                    'card_style' => ['bordered', 'shadow', 'flat'],
                ],
                'feel' => ['border_radius' => '1rem', 'section_spacing' => '3rem', 'shadow_depth' => 'light'],
                'feel_options' => [
                    'border_radius' => ['0.5rem', '0.75rem', '1rem', '1.5rem'],
                    'shadow_depth' => ['none', 'light', 'medium'],
                ],
                'animation' => ['entrance' => 'fade-up', 'duration' => 450, 'stagger' => 70],
                'header' => ['sticky' => true, 'transparent_on_hero' => false, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'header_options' => ['variant' => ['standard', 'centered_logo']],
                'footer' => ['style' => 'multi_column', 'show_social' => true, 'show_newsletter' => true, 'show_payment_icons' => true],
                'footer_options' => ['style' => ['multi_column', 'minimal', 'centered']],
                'hero' => ['default_height' => '55vh', 'overlay_opacity' => 0.25],
                'product_card' => ['show_quick_add' => true, 'show_rating' => false, 'image_hover' => 'zoom'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'split_image', 'config' => [
                    'heading' => 'Fresh Foodstuff, Delivered to Your Door',
                    'subheading' => 'Rice, beans, garri, palm oil, fresh vegetables — all at market price. Free delivery above ₦15,000.',
                    'cta_text' => 'Start Shopping',
                    'cta_link' => '/products',
                ]],
                ['type' => 'category_grid', 'variant' => 'image_above', 'config' => [
                    'heading' => 'What Are You Cooking Today?',
                    'columns' => 4,
                    'max_items' => 8,
                ]],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => [
                    'heading' => 'Bestsellers This Week',
                    'subheading' => 'The items our customers buy again and again',
                    'product_source' => 'bestselling',
                    'max_items' => 8,
                    'columns' => 4,
                    'show_price' => true,
                ]],
                ['type' => 'image_with_text', 'variant' => 'side_by_side', 'config' => [
                    'heading' => 'Straight From the Farm',
                    'text' => 'We work directly with farmers across Ogun, Oyo, and Benue states. No middlemen, no wahala — just fresh produce at fair prices delivered to homes across Lagos and Abuja.',
                    'image_position' => 'left',
                ]],
                ['type' => 'newsletter_signup', 'variant' => 'inline', 'config' => [
                    'heading' => 'Weekly Market Specials',
                    'description' => 'Get our Thursday deals — bulk-buy discounts, seasonal produce, and free delivery codes.',
                    'button_text' => 'Join the List',
                ]],
            ],
        ];
    }

    private function abujaFreshTheme(): array
    {
        return [
            'name' => 'Abuja Fresh',
            'slug' => 'abuja-fresh',
            'description' => 'Clean, clinical design for health and wellness — cool blues, mint greens, and the polished feel of an upscale Abuja pharmacy.',
            'category' => StorefrontThemeCategory::HEALTH,
            'ideal_for' => 'Pharmacies, health stores, beauty shops, skincare, wellness',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Wuse Clean', 'primary' => '#0284C7', 'secondary' => '#075985', 'accent' => '#0D9488', 'background' => '#FFFFFF', 'surface' => '#F0F9FF', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Maitama Mint', 'primary' => '#0D9488', 'secondary' => '#115E59', 'accent' => '#0284C7', 'background' => '#F0FDFA', 'surface' => '#CCFBF1', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Gwarimpa Rose', 'primary' => '#BE185D', 'secondary' => '#9D174D', 'accent' => '#0D9488', 'background' => '#FFF1F2', 'surface' => '#FFE4E6', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                        ['name' => 'FCT Trust', 'primary' => '#1D4ED8', 'secondary' => '#1E3A8A', 'accent' => '#059669', 'background' => '#FFFFFF', 'surface' => '#EFF6FF', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                    ],
                ],
                'colors_dark' => [
                    'primary' => '#22c55e', 'accent' => '#10b981',
                    'background' => '#0a120e', 'foreground' => '#ecfdf5', 'card-bg' => '#0f1f17',
                    'surface' => '#0c1a12', 'border' => '#1a3a28', 'text' => '#b8e0cc',
                    'text-muted' => '#6da888', 'muted-foreground' => '#6da888',
                    'footer-bg' => '#060e09', 'footer-text' => '#b8e0cc',
                ],
                'palette_dark' => [
                    'presets' => [
                        [
                            'name' => 'Abuja Fresh Dark',
                            'primary' => '#34d399', 'primary-foreground' => '#ffffff', 'accent' => '#f59e0b',
                            'background' => '#0a120e', 'foreground' => '#ecfdf5', 'card-bg' => '#132a1f',
                            'surface' => '#0f1f17', 'border' => '#1e4035', 'text' => '#a7d8c4',
                            'text-muted' => '#5c9a82', 'muted-foreground' => '#5c9a82',
                            'footer-bg' => '#050a07', 'footer-text' => '#a7d8c4',
                        ],
                        [
                            'name' => 'Abuja Fresh Slate',
                            'primary' => '#34d399', 'primary-foreground' => '#ffffff', 'accent' => '#f59e0b',
                            'background' => '#0f172a', 'foreground' => '#f1f5f9', 'card-bg' => '#1e293b',
                            'surface' => '#1e293b', 'border' => '#334155', 'text' => '#cbd5e1',
                            'text-muted' => '#64748b', 'muted-foreground' => '#64748b',
                            'footer-bg' => '#020617', 'footer-text' => '#cbd5e1',
                        ],
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
                        ['name' => 'Premium Clean', 'heading_font' => 'Plus Jakarta Sans', 'body_font' => 'Plus Jakarta Sans'],
                        ['name' => 'Soft & Caring', 'heading_font' => 'Quicksand', 'body_font' => 'Nunito Sans'],
                        ['name' => 'Clinical Precision', 'heading_font' => 'Manrope', 'body_font' => 'Source Sans 3'],
                    ],
                ],
                'components' => ['button_style' => 'rounded', 'card_style' => 'shadow', 'input_style' => 'outlined', 'image_aspect_ratio' => '1:1'],
                'component_options' => [
                    'button_style' => ['rounded', 'pill', 'sharp'],
                    'card_style' => ['shadow', 'bordered', 'glass'],
                ],
                'feel' => ['border_radius' => '0.75rem', 'section_spacing' => '4rem', 'shadow_depth' => 'light'],
                'feel_options' => [
                    'border_radius' => ['0.25rem', '0.5rem', '0.75rem', '1rem'],
                    'shadow_depth' => ['none', 'light', 'medium'],
                ],
                'animation' => ['entrance' => 'fade-up', 'duration' => 500, 'stagger' => 80],
                'header' => ['sticky' => true, 'transparent_on_hero' => false, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'header_options' => ['variant' => ['standard', 'centered_logo']],
                'footer' => ['style' => 'centered', 'show_social' => true, 'show_newsletter' => false, 'show_payment_icons' => true],
                'footer_options' => ['style' => ['centered', 'multi_column', 'minimal']],
                'hero' => ['default_height' => '60vh', 'overlay_opacity' => 0.2],
                'product_card' => ['show_quick_add' => true, 'show_rating' => true, 'image_hover' => 'fade'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'centered_overlay', 'config' => [
                    'heading' => 'Your Health Comes First',
                    'subheading' => 'NAFDAC-approved medications, wellness products, and skincare essentials. Same-day delivery in Abuja.',
                    'cta_text' => 'Shop Wellness',
                    'cta_link' => '/products',
                ]],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => [
                    'heading' => 'Trusted Essentials',
                    'subheading' => 'Products our pharmacists recommend',
                    'product_source' => 'featured',
                    'max_items' => 8,
                    'columns' => 4,
                    'show_price' => true,
                ]],
                ['type' => 'image_with_text', 'variant' => 'side_by_side', 'config' => [
                    'heading' => 'Licensed & Trusted',
                    'text' => 'We are a PCN-registered pharmacy with over 10 years serving Abuja families. Every product on our shelves passes our quality assurance check. Your wellbeing is not something we compromise on.',
                    'image_position' => 'right',
                ]],
                ['type' => 'category_grid', 'variant' => 'image_above', 'config' => [
                    'heading' => 'Browse by Need',
                    'columns' => 4,
                ]],
                ['type' => 'testimonials', 'variant' => 'grid', 'config' => [
                    'heading' => 'Trusted by Abuja Families',
                    'items' => [
                        ['name' => 'Dr. Amina Y.', 'text' => 'I refer my patients here because I know the products are genuine. The delivery to Gwarimpa is always on time.', 'rating' => 5, 'location' => 'Gwarimpa, Abuja', 'avatar_path' => null],
                        ['name' => 'Obioma C.', 'text' => 'Finally found a place where I can order my blood pressure medication online without worrying about fakes.', 'rating' => 5, 'location' => 'Wuse 2, Abuja', 'avatar_path' => null],
                    ],
                ]],
                ['type' => 'faq', 'variant' => 'default', 'config' => [
                    'heading' => 'Common Questions',
                    'items' => [
                        ['question' => 'Do you require a prescription?', 'answer' => 'Yes, prescription-only medications require a valid prescription from a licensed doctor. You can upload it during checkout or send via WhatsApp.'],
                        ['question' => 'How fast is delivery in Abuja?', 'answer' => 'We deliver within 2-4 hours in Abuja municipality. Same-day delivery for orders placed before 2pm.'],
                        ['question' => 'Are your products NAFDAC approved?', 'answer' => 'Absolutely. Every product in our store carries valid NAFDAC registration numbers. We do not stock or sell unregistered products.'],
                    ],
                ]],
            ],
        ];
    }

    private function crystalClearTheme(): array
    {
        return [
            'name' => 'Crystal Clear',
            'slug' => 'crystal-clear',
            'description' => 'Sharp, futuristic design for tech and electronics — dark modes, electric accents, and the energy of a Lagos tech startup.',
            'category' => StorefrontThemeCategory::TECH,
            'ideal_for' => 'Electronics, gadgets, phone accessories, computer parts, gaming',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Yaba Valley', 'primary' => '#2563EB', 'secondary' => '#1D4ED8', 'accent' => '#7C3AED', 'background' => '#FFFFFF', 'surface' => '#F8FAFC', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'CMS Dark', 'primary' => '#3B82F6', 'secondary' => '#2563EB', 'accent' => '#A78BFA', 'background' => '#0B1120', 'surface' => '#151D2E', 'text' => '#E2E8F0', 'text_muted' => '#94A3B8'],
                        ['name' => 'Ikeja Electric', 'primary' => '#06B6D4', 'secondary' => '#0891B2', 'accent' => '#F59E0B', 'background' => '#0F172A', 'surface' => '#1E293B', 'text' => '#F1F5F9', 'text_muted' => '#94A3B8'],
                        ['name' => 'Slot Clean', 'primary' => '#0F172A', 'secondary' => '#1E293B', 'accent' => '#3B82F6', 'background' => '#FFFFFF', 'surface' => '#F1F5F9', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                    ],
                ],
                'colors_dark' => [
                    'primary' => '#38bdf8', 'accent' => '#0ea5e9',
                    'background' => '#0b1120', 'foreground' => '#e2e8f0', 'card-bg' => '#111a2e',
                    'surface' => '#0e1526', 'border' => '#1e293b', 'text' => '#b0bfd0',
                    'text-muted' => '#64748b', 'muted-foreground' => '#64748b',
                    'footer-bg' => '#060c18', 'footer-text' => '#94a3b8',
                ],
                'palette_dark' => [
                    'presets' => [
                        [
                            'name' => 'Crystal Clear Dark',
                            'primary' => '#60a5fa', 'primary-foreground' => '#ffffff', 'accent' => '#c084fc',
                            'background' => '#0b1120', 'foreground' => '#f0f4ff', 'card-bg' => '#151d30',
                            'surface' => '#111827', 'border' => '#1e3050', 'text' => '#b0c4de',
                            'text-muted' => '#6880a0', 'muted-foreground' => '#6880a0',
                            'footer-bg' => '#060a14', 'footer-text' => '#b0c4de',
                        ],
                        [
                            'name' => 'Crystal Clear Obsidian',
                            'primary' => '#60a5fa', 'primary-foreground' => '#ffffff', 'accent' => '#c084fc',
                            'background' => '#09090b', 'foreground' => '#fafafa', 'card-bg' => '#18181b',
                            'surface' => '#18181b', 'border' => '#27272a', 'text' => '#d4d4d8',
                            'text-muted' => '#71717a', 'muted-foreground' => '#71717a',
                            'footer-bg' => '#030304', 'footer-text' => '#d4d4d8',
                        ],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Outfit',
                    'body_font' => 'Source Sans 3',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.6,
                    'options' => [
                        ['name' => 'Tech Forward', 'heading_font' => 'Outfit', 'body_font' => 'Source Sans 3'],
                        ['name' => 'Geometric', 'heading_font' => 'Space Grotesk', 'body_font' => 'DM Sans'],
                        ['name' => 'Monospaced Edge', 'heading_font' => 'JetBrains Mono', 'body_font' => 'DM Sans'],
                    ],
                ],
                'components' => ['button_style' => 'sharp', 'card_style' => 'bordered', 'input_style' => 'filled', 'image_aspect_ratio' => '16:9'],
                'component_options' => [
                    'button_style' => ['sharp', 'rounded', 'pill'],
                    'card_style' => ['bordered', 'shadow', 'glass'],
                ],
                'feel' => ['border_radius' => '0.375rem', 'section_spacing' => '4rem', 'shadow_depth' => 'medium'],
                'feel_options' => [
                    'border_radius' => ['0', '0.25rem', '0.375rem', '0.5rem'],
                    'shadow_depth' => ['none', 'light', 'medium', 'heavy'],
                ],
                'animation' => ['entrance' => 'fade-up', 'duration' => 600, 'stagger' => 100],
                'header' => ['sticky' => true, 'transparent_on_hero' => true, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'header_options' => ['variant' => ['standard', 'centered_logo']],
                'footer' => ['style' => 'multi_column', 'show_social' => true, 'show_newsletter' => true, 'show_payment_icons' => true],
                'footer_options' => ['style' => ['multi_column', 'minimal', 'centered']],
                'hero' => ['default_height' => '80vh', 'overlay_opacity' => 0.5],
                'product_card' => ['show_quick_add' => true, 'show_rating' => true, 'image_hover' => 'zoom'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'centered_overlay', 'config' => [
                    'heading' => 'Upgrade Your Tech Game',
                    'subheading' => 'Latest smartphones, laptops, and accessories — all with warranty. Pay on delivery available in Lagos.',
                    'cta_text' => 'See What\'s New',
                    'cta_link' => '/products',
                    'height' => 'large',
                ]],
                ['type' => 'featured_products', 'variant' => 'horizontal_scroll', 'config' => [
                    'heading' => 'Just Dropped',
                    'subheading' => 'New arrivals this week',
                    'product_source' => 'newest',
                    'max_items' => 10,
                    'show_price' => true,
                ]],
                ['type' => 'category_grid', 'variant' => 'image_overlay', 'config' => [
                    'heading' => 'Shop by Device',
                    'columns' => 3,
                ]],
                ['type' => 'banner', 'variant' => 'default', 'config' => [
                    'heading' => 'Free Delivery on Orders Over ₦50,000',
                    'alt_text' => 'Free delivery promotion banner',
                ]],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => [
                    'heading' => 'Best Sellers',
                    'product_source' => 'bestselling',
                    'max_items' => 8,
                    'columns' => 4,
                ]],
                ['type' => 'newsletter_signup', 'variant' => 'inline', 'config' => [
                    'heading' => 'Tech Alerts',
                    'description' => 'Be the first to know when the iPhone 16 drops. Price alerts, restock notifications, and exclusive deals.',
                    'button_text' => 'Notify Me',
                ]],
            ],
        ];
    }

    private function naijaVibrantTheme(): array
    {
        return [
            'name' => 'Naija Vibrant',
            'slug' => 'naija-vibrant',
            'description' => 'Bold, editorial design celebrating Nigerian fashion — rich earth tones, dramatic layouts, and the confidence of Ankara on the runway.',
            'category' => StorefrontThemeCategory::FASHION,
            'ideal_for' => 'Fashion boutiques, Ankara collections, accessories, lifestyle brands',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Ankara Earth', 'primary' => '#92400E', 'secondary' => '#78350F', 'accent' => '#B45309', 'background' => '#FFFBEB', 'surface' => '#FEF3C7', 'text' => '#1C1917', 'text_muted' => '#57534E'],
                        ['name' => 'Aso Oke', 'primary' => '#7E22CE', 'secondary' => '#581C87', 'accent' => '#D97706', 'background' => '#FFFFFF', 'surface' => '#FAF5FF', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                        ['name' => 'Coral Island', 'primary' => '#BE123C', 'secondary' => '#9F1239', 'accent' => '#0D9488', 'background' => '#FFF1F2', 'surface' => '#FFE4E6', 'text' => '#1C1917', 'text_muted' => '#78716C'],
                        ['name' => 'Midnight Glam', 'primary' => '#D4A574', 'secondary' => '#A67C52', 'accent' => '#F59E0B', 'background' => '#0C0A09', 'surface' => '#1C1917', 'text' => '#FAFAF9', 'text_muted' => '#A8A29E'],
                    ],
                ],
                'colors_dark' => [
                    'primary' => '#14b8a6', 'secondary' => '#fb7185', 'accent' => '#fb7185',
                    'background' => '#0a1210', 'foreground' => '#f0fdfa', 'card-bg' => '#0f1e1a',
                    'surface' => '#0c1915', 'border' => '#1a3830', 'text' => '#b0d8cc',
                    'text-muted' => '#6aaa96', 'muted-foreground' => '#6aaa96',
                    'footer-bg' => '#060e0b', 'footer-text' => '#b0d8cc',
                ],
                'palette_dark' => [
                    'presets' => [
                        [
                            'name' => 'Naija Vibrant Dark',
                            'primary' => '#a78bfa', 'primary-foreground' => '#ffffff', 'accent' => '#fb923c',
                            'background' => '#0a1210', 'foreground' => '#f5f3ff', 'card-bg' => '#161f1c',
                            'surface' => '#111a17', 'border' => '#2a3a35', 'text' => '#c8d5d0',
                            'text-muted' => '#7a9088', 'muted-foreground' => '#7a9088',
                            'footer-bg' => '#050908', 'footer-text' => '#c8d5d0',
                        ],
                        [
                            'name' => 'Naija Vibrant Neon',
                            'primary' => '#c084fc', 'primary-foreground' => '#ffffff', 'accent' => '#fb923c',
                            'background' => '#0a0a0a', 'foreground' => '#f5f5f5', 'card-bg' => '#171717',
                            'surface' => '#141414', 'border' => '#2e2e2e', 'text' => '#d4d4d4',
                            'text-muted' => '#858585', 'muted-foreground' => '#858585',
                            'footer-bg' => '#050505', 'footer-text' => '#d4d4d4',
                        ],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Cormorant Garamond',
                    'body_font' => 'Libre Franklin',
                    'heading_weight' => '700',
                    'body_weight' => '400',
                    'base_size' => 16,
                    'line_height' => 1.65,
                    'options' => [
                        ['name' => 'Editorial Luxury', 'heading_font' => 'Cormorant Garamond', 'body_font' => 'Libre Franklin'],
                        ['name' => 'Modern Bold', 'heading_font' => 'Bebas Neue', 'body_font' => 'Karla'],
                        ['name' => 'Refined Serif', 'heading_font' => 'Lora', 'body_font' => 'Nunito Sans'],
                    ],
                ],
                'components' => ['button_style' => 'sharp', 'card_style' => 'minimal', 'input_style' => 'underlined', 'image_aspect_ratio' => '3:4'],
                'component_options' => [
                    'button_style' => ['sharp', 'pill', 'rounded'],
                    'card_style' => ['minimal', 'bordered', 'shadow'],
                ],
                'feel' => ['border_radius' => '0', 'section_spacing' => '5rem', 'shadow_depth' => 'none'],
                'feel_options' => [
                    'border_radius' => ['0', '0.25rem', '0.5rem'],
                    'section_spacing' => ['3rem', '4rem', '5rem', '6rem'],
                    'shadow_depth' => ['none', 'light'],
                ],
                'animation' => ['entrance' => 'fade-up', 'duration' => 800, 'stagger' => 150],
                'header' => ['sticky' => true, 'transparent_on_hero' => true, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'header_options' => ['variant' => ['centered_logo', 'standard']],
                'footer' => ['style' => 'minimal', 'show_social' => true, 'show_newsletter' => true, 'show_payment_icons' => false],
                'footer_options' => ['style' => ['minimal', 'centered', 'multi_column']],
                'hero' => ['default_height' => '100vh', 'overlay_opacity' => 0.35],
                'product_card' => ['show_quick_add' => false, 'show_rating' => false, 'image_hover' => 'fade'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'slideshow', 'config' => [
                    'heading' => 'Wear the Culture',
                    'subheading' => 'Handcrafted Ankara, ready-to-wear, and bespoke fashion for the modern Nigerian.',
                    'cta_text' => 'View Collection',
                    'cta_link' => '/products',
                    'slides' => [
                        ['heading' => 'Wear the Culture', 'subheading' => 'Handcrafted Ankara, ready-to-wear, and bespoke fashion for the modern Nigerian.', 'cta_text' => 'View Collection', 'cta_link' => '/products'],
                        ['heading' => 'New Season, New Drip', 'subheading' => 'The Harmattan Collection is here — lightweight fabrics, bold prints.', 'cta_text' => 'Shop Now', 'cta_link' => '/products'],
                    ],
                ]],
                ['type' => 'featured_products', 'variant' => 'spotlight_plus_grid', 'config' => [
                    'heading' => 'The Edit',
                    'subheading' => 'Curated picks from our latest collection',
                    'product_source' => 'featured',
                    'max_items' => 5,
                    'show_price' => true,
                ]],
                ['type' => 'image_with_text', 'variant' => 'side_by_side', 'config' => [
                    'heading' => 'Made in Nigeria, Worn Everywhere',
                    'text' => 'Every piece is designed in Lagos and crafted by local artisans. We believe fashion should celebrate where you\'re from while taking you wherever you\'re going.',
                    'image_position' => 'right',
                ]],
                ['type' => 'category_grid', 'variant' => 'image_overlay', 'config' => [
                    'heading' => 'Shop by Style',
                    'columns' => 3,
                ]],
                ['type' => 'testimonials', 'variant' => 'carousel', 'config' => [
                    'heading' => 'Styled by You',
                    'items' => [
                        ['name' => 'Ngozi A.', 'text' => 'The Ankara blazer I ordered is EVERYTHING. The tailoring is perfect, and I got so many compliments at the wedding.', 'rating' => 5, 'location' => 'Port Harcourt', 'avatar_path' => null],
                        ['name' => 'Funke B.', 'text' => 'I\'ve been looking for quality ready-to-wear Ankara and this is it. The fabric is premium, not the cheap ones you see in the market.', 'rating' => 5, 'location' => 'Victoria Island, Lagos', 'avatar_path' => null],
                    ],
                ]],
                ['type' => 'newsletter_signup', 'variant' => 'inline', 'config' => [
                    'heading' => 'Join the Inner Circle',
                    'description' => 'First access to new drops, styling tips, and members-only discounts.',
                    'button_text' => 'Subscribe',
                ]],
            ],
        ];
    }

    private function metroProfessionalTheme(): array
    {
        return [
            'name' => 'Metro Professional',
            'slug' => 'metro-professional',
            'description' => 'No-nonsense, efficient design for wholesale and B2B — dense product layouts, bulk pricing, and a catalogue-first approach.',
            'category' => StorefrontThemeCategory::GENERAL,
            'ideal_for' => 'Wholesale, B2B, office supplies, industrial, bulk retail',
            'theme_config' => [
                'palette' => [
                    'presets' => [
                        ['name' => 'Trade Centre', 'primary' => '#1D4ED8', 'secondary' => '#1E3A8A', 'accent' => '#D97706', 'background' => '#FFFFFF', 'surface' => '#F8FAFC', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Marina Grey', 'primary' => '#475569', 'secondary' => '#334155', 'accent' => '#0284C7', 'background' => '#FFFFFF', 'surface' => '#F1F5F9', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Apapa Industrial', 'primary' => '#0F766E', 'secondary' => '#115E59', 'accent' => '#B45309', 'background' => '#FFFFFF', 'surface' => '#F0FDFA', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                        ['name' => 'Idumota Market', 'primary' => '#B91C1C', 'secondary' => '#991B1B', 'accent' => '#1D4ED8', 'background' => '#FFFFFF', 'surface' => '#FEF2F2', 'text' => '#0F172A', 'text_muted' => '#64748B'],
                    ],
                ],
                'colors_dark' => [
                    'primary' => '#3b82f6', 'accent' => '#0ea5e9',
                    'background' => '#0c1017', 'foreground' => '#e2e8f0', 'card-bg' => '#121824',
                    'surface' => '#0f141e', 'border' => '#1e293b', 'text' => '#94a3b8',
                    'text-muted' => '#64748b', 'muted-foreground' => '#64748b',
                    'footer-bg' => '#070a10', 'footer-text' => '#94a3b8',
                ],
                'palette_dark' => [
                    'presets' => [
                        [
                            'name' => 'Metro Professional Dark',
                            'primary' => '#93c5fd', 'primary-foreground' => '#1e3a5f', 'accent' => '#fbbf24',
                            'background' => '#0c1017', 'foreground' => '#eef2f7', 'card-bg' => '#141c28',
                            'surface' => '#111820', 'border' => '#243040', 'text' => '#b0bec5',
                            'text-muted' => '#607890', 'muted-foreground' => '#607890',
                            'footer-bg' => '#060810', 'footer-text' => '#b0bec5',
                        ],
                        [
                            'name' => 'Metro Professional Carbon',
                            'primary' => '#93c5fd', 'primary-foreground' => '#1e3a5f', 'accent' => '#fbbf24',
                            'background' => '#111111', 'foreground' => '#eeeeee', 'card-bg' => '#1a1a1a',
                            'surface' => '#161616', 'border' => '#2a2a2a', 'text' => '#cccccc',
                            'text-muted' => '#777777', 'muted-foreground' => '#777777',
                            'footer-bg' => '#0a0a0a', 'footer-text' => '#cccccc',
                        ],
                    ],
                ],
                'typography' => [
                    'heading_font' => 'Manrope',
                    'body_font' => 'Source Sans 3',
                    'heading_weight' => '600',
                    'body_weight' => '400',
                    'base_size' => 15,
                    'line_height' => 1.5,
                    'options' => [
                        ['name' => 'Business Standard', 'heading_font' => 'Manrope', 'body_font' => 'Source Sans 3'],
                        ['name' => 'Data Dense', 'heading_font' => 'IBM Plex Sans', 'body_font' => 'IBM Plex Sans'],
                        ['name' => 'Catalogue Clean', 'heading_font' => 'Work Sans', 'body_font' => 'Work Sans'],
                    ],
                ],
                'components' => ['button_style' => 'rounded', 'card_style' => 'bordered', 'input_style' => 'outlined', 'image_aspect_ratio' => '4:3'],
                'component_options' => [
                    'button_style' => ['rounded', 'sharp'],
                    'card_style' => ['bordered', 'shadow', 'flat'],
                ],
                'feel' => ['border_radius' => '0.25rem', 'section_spacing' => '2.5rem', 'shadow_depth' => 'light'],
                'feel_options' => [
                    'border_radius' => ['0', '0.25rem', '0.375rem'],
                    'section_spacing' => ['2rem', '2.5rem', '3rem'],
                    'shadow_depth' => ['none', 'light'],
                ],
                'animation' => ['entrance' => 'fade', 'duration' => 300, 'stagger' => 40],
                'header' => ['sticky' => true, 'transparent_on_hero' => false, 'show_search' => true, 'show_cart' => true, 'show_account' => true],
                'header_options' => ['variant' => ['standard']],
                'footer' => ['style' => 'multi_column', 'show_social' => false, 'show_newsletter' => false, 'show_payment_icons' => true],
                'footer_options' => ['style' => ['multi_column', 'minimal']],
                'hero' => ['default_height' => '45vh', 'overlay_opacity' => 0.4],
                'product_card' => ['show_quick_add' => true, 'show_rating' => false, 'image_hover' => 'none'],
                'decorations' => [],
            ],
            'default_sections' => [
                ['type' => 'hero_banner', 'variant' => 'minimal_text', 'config' => [
                    'heading' => 'Wholesale Prices, Retail Convenience',
                    'subheading' => 'Office supplies, cleaning products, stationery, and more — from 1 carton to 1 container. Credit terms available for verified businesses.',
                    'cta_text' => 'Browse Catalogue',
                    'cta_link' => '/products',
                ]],
                ['type' => 'category_grid', 'variant' => 'chips', 'config' => [
                    'heading' => 'Quick Categories',
                ]],
                ['type' => 'featured_products', 'variant' => 'standard_grid', 'config' => [
                    'heading' => 'Most Ordered',
                    'subheading' => 'What businesses are buying this week',
                    'product_source' => 'bestselling',
                    'max_items' => 12,
                    'columns' => 4,
                    'show_price' => true,
                ]],
                ['type' => 'image_with_text', 'variant' => 'side_by_side', 'config' => [
                    'heading' => 'Built for Business Buyers',
                    'text' => 'Request quotes, track bulk orders, and manage recurring purchases — all from one dashboard. We supply to over 500 offices, hotels, and restaurants across Nigeria.',
                    'image_position' => 'left',
                ]],
                ['type' => 'faq', 'variant' => 'default', 'config' => [
                    'heading' => 'Business Ordering FAQ',
                    'items' => [
                        ['question' => 'What is the minimum order quantity?', 'answer' => 'Most products have no minimum for retail purchases. For wholesale pricing (10%+ discount), minimum quantities start from 1 carton or as listed on each product.'],
                        ['question' => 'Do you offer credit terms?', 'answer' => 'Yes. Verified businesses can apply for 30-day payment terms. Contact our B2B team to set up your account.'],
                        ['question' => 'How fast is delivery for bulk orders?', 'answer' => 'Within Lagos: 24-48 hours. Nationwide: 3-5 business days via our logistics partners. We can also arrange pickup from our Apapa warehouse.'],
                    ],
                ]],
            ],
        ];
    }
}
