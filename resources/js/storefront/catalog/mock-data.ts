import type {
    CartSummary,
    CategoryData,
    NavigationData,
    ProductCardData,
    SectionData,
    ShopData,
} from '../types/storefront';

export const mockShop: ShopData = {
    id: 1,
    name: 'ShelfWise Demo Store',
    slug: 'demo-store',
    currency: 'NGN',
    currency_symbol: '\u20A6',
    currency_decimals: 2,
    logo: null,
    favicon: null,
};

export const mockNavigation: NavigationData = {
    items: [
        { label: 'Home', page_type: 'home', slug: '' },
        { label: 'Products', page_type: 'products', slug: 'products' },
        { label: 'About Us', page_type: 'about', slug: 'about' },
        { label: 'Contact', page_type: 'contact', slug: 'contact' },
    ],
    announcement: null,
    social_links: {
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',
        whatsapp: 'https://wa.me/2341234567890',
    },
};

export const mockCart: CartSummary = {
    item_count: 3,
    subtotal: 125000,
    total: 125000,
};

export const mockProducts: ProductCardData[] = [
    {
        id: 1,
        name: 'Wireless Bluetooth Earbuds',
        slug: 'wireless-earbuds',
        price: 15000,
        compare_at_price: 22000,
        image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&h=800&fit=crop&q=80',
        category_name: 'Electronics',
        is_new: true,
    },
    {
        id: 2,
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-tshirt',
        price: 8500,
        compare_at_price: null,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&q=80',
        category_name: 'Fashion',
        is_new: false,
    },
    {
        id: 3,
        name: 'Organic Shea Butter',
        slug: 'organic-shea-butter',
        price: 3200,
        compare_at_price: 4000,
        image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=800&fit=crop&q=80',
        category_name: 'Beauty',
        is_new: true,
    },
    {
        id: 4,
        name: 'Hand-woven Basket',
        slug: 'hand-woven-basket',
        price: 12000,
        compare_at_price: null,
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=800&fit=crop&q=80',
        category_name: 'Home',
        is_new: false,
    },
    {
        id: 5,
        name: 'Cold-Pressed Juice Bundle',
        slug: 'juice-bundle',
        price: 6500,
        compare_at_price: 8000,
        image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&h=800&fit=crop&q=80',
        category_name: 'Food & Drinks',
        is_new: true,
    },
    {
        id: 6,
        name: 'Ankara Print Fabric',
        slug: 'ankara-fabric',
        price: 4500,
        compare_at_price: null,
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80',
        category_name: 'Fashion',
        is_new: false,
    },
    {
        id: 7,
        name: 'Fitness Resistance Bands',
        slug: 'resistance-bands',
        price: 7800,
        compare_at_price: 9500,
        image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=800&fit=crop&q=80',
        category_name: 'Fitness',
        is_new: false,
    },
    {
        id: 8,
        name: 'Vitamin C Serum',
        slug: 'vitamin-c-serum',
        price: 5600,
        compare_at_price: null,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&fit=crop&q=80',
        category_name: 'Beauty',
        is_new: true,
    },
];

export const mockCategories: CategoryData[] = [
    {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80',
        description: 'Gadgets and accessories',
        product_count: 24,
    },
    {
        id: 2,
        name: 'Fashion',
        slug: 'fashion',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80',
        description: 'Clothing and accessories',
        product_count: 42,
    },
    {
        id: 3,
        name: 'Beauty & Skincare',
        slug: 'beauty',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&q=80',
        description: 'Skincare and cosmetics',
        product_count: 18,
    },
    {
        id: 4,
        name: 'Home & Living',
        slug: 'home',
        image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=600&fit=crop&q=80',
        description: 'Furniture and decor',
        product_count: 31,
    },
    {
        id: 5,
        name: 'Food & Drinks',
        slug: 'food-drinks',
        image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop&q=80',
        description: 'Fresh and packaged foods',
        product_count: 56,
    },
    {
        id: 6,
        name: 'Health & Wellness',
        slug: 'health',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
        description: 'Supplements and fitness',
        product_count: 15,
    },
];

export const mockTestimonials = [
    {
        name: 'Adebayo Okonkwo',
        role: 'Repeat customer',
        text: 'The quality of products here is consistently outstanding. Fast delivery to Lagos mainland and the packaging is always pristine.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face&q=80',
        rating: 5,
    },
    {
        name: 'Ngozi Eze',
        role: 'Fashion enthusiast',
        text: "Finally a Nigerian store that understands curation. Every piece I've bought has been exactly as described. The ankara fabrics are top quality.",
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face&q=80',
        rating: 5,
    },
    {
        name: 'Chidi Nwankwo',
        role: 'First-time buyer',
        text: 'Was skeptical at first, but the customer service won me over. They tracked my order all the way to Abuja. Will definitely shop again.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face&q=80',
        rating: 4,
    },
];

interface SectionVariantConfig {
    type: string;
    label: string;
    variants: string[];
    defaultVariant: string;
}

export const classicCommerceSections: SectionVariantConfig[] = [
    {
        type: 'hero_banner',
        label: 'Hero Banner',
        variants: [
            'centered_overlay',
            'split_image',
            'slideshow',
            'minimal_text',
            'asymmetric',
            'video_background',
        ],
        defaultVariant: 'centered_overlay',
    },
    {
        type: 'featured_products',
        label: 'Featured Products',
        variants: [
            'standard_grid',
            'spotlight_plus_grid',
            'horizontal_scroll',
            'carousel',
            'masonry',
        ],
        defaultVariant: 'standard_grid',
    },
    {
        type: 'category_grid',
        label: 'Shop by Category',
        variants: [
            'image_overlay',
            'image_above',
            'icon_grid',
            'chips',
            'carousel',
        ],
        defaultVariant: 'image_above',
    },
    {
        type: 'testimonials',
        label: 'Testimonials',
        variants: ['grid', 'carousel', 'single_spotlight'],
        defaultVariant: 'grid',
    },
    {
        type: 'newsletter_signup',
        label: 'Newsletter',
        variants: ['inline', 'stacked', 'popup_trigger'],
        defaultVariant: 'inline',
    },
    {
        type: 'image_with_text',
        label: 'Image + Text',
        variants: ['side_by_side', 'overlap', 'stacked'],
        defaultVariant: 'side_by_side',
    },
    {
        type: 'contact_form',
        label: 'Contact Form',
        variants: ['stacked', 'side_by_side'],
        defaultVariant: 'stacked',
    },
];

export function buildSectionData(
    type: string,
    variant: string,
    shopSlug: string,
): SectionData {
    const configBase = {
        shop_slug: shopSlug,
        currency_symbol: '\u20A6',
        currency_decimals: 2,
    };

    switch (type) {
        case 'hero_banner':
            return {
                id: 'cat-100',
                type: 'hero_banner',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'Welcome to Our Store',
                    subheading:
                        'Discover premium Nigerian products curated just for you',
                    cta_text: 'Shop Now',
                    cta_link: `/store/${shopSlug}/products`,
                    secondary_cta_text: 'Learn More',
                    secondary_cta_link: `/store/${shopSlug}/about`,
                    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1600&h=900&fit=crop&q=80',
                    overlay_opacity: 0.45,
                },
                data: {},
            };

        case 'featured_products':
            return {
                id: 'cat-200',
                type: 'featured_products',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'Featured Products',
                    subheading: 'Hand-picked for you',
                },
                data: { products: mockProducts },
            };

        case 'category_grid':
            return {
                id: 'cat-300',
                type: 'category_grid',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'Shop by Category',
                    subheading: 'Browse our collections',
                    columns: 3,
                },
                data: { categories: mockCategories },
            };

        case 'testimonials':
            return {
                id: 'cat-400',
                type: 'testimonials',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'What Our Customers Say',
                    testimonials: mockTestimonials,
                },
                data: {},
            };

        case 'newsletter_signup':
            return {
                id: 'cat-500',
                type: 'newsletter_signup',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'Stay Updated',
                    subheading:
                        'Get exclusive deals and new arrivals in your inbox',
                    placeholder: 'Enter your email',
                    button_text: 'Subscribe',
                },
                data: {},
            };

        case 'image_with_text':
            return {
                id: 'cat-600',
                type: 'image_with_text',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'Our Story',
                    text: 'We started with a simple belief: Nigerian shoppers deserve better. Better quality, better prices, better service. Every product in our store is hand-picked and quality-checked before it reaches you.',
                    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80',
                    cta_text: 'About Us',
                    cta_link: `/store/${shopSlug}/about`,
                },
                data: {},
            };

        case 'contact_form':
            return {
                id: 'cat-700',
                type: 'contact_form',
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: {
                    ...configBase,
                    heading: 'Get In Touch',
                    subheading: "Have a question? We'd love to hear from you.",
                },
                data: {},
            };

        default:
            return {
                id: 'cat-999',
                type,
                variant,
                is_visible: true,
                scroll_animation: 'fade-up',
                config: configBase,
                data: {},
            };
    }
}
