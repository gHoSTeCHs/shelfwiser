import type { ReactNode } from 'react';

export interface StorefrontPageData {
    shop: ShopData;
    template: TemplateData;
    theme: ResolvedTheme;
    themeStyles: string;
    themeStyleVars: Record<string, string>;
    sections?: SectionData[];
    seo: SeoData;
    cart: CartSummary;
    navigation: NavigationData;
    customer: CustomerData | null;
    csrfToken: string;
    fixedPage?: string;
    fixedPageData?: Record<string, unknown>;
}

export interface TemplateData {
    slug: string;
    animation_tier: AnimationTier;
    structural_config: StructuralConfig;
}

export type AnimationTier = 'none' | 'subtle' | 'polished' | 'cinematic';

export interface StructuralConfig {
    layout?: string;
    max_sections_per_page?: number;
    container_max_width?: string;
    [key: string]: unknown;
}

export interface ShopData {
    id: number;
    name: string;
    slug: string;
    currency: string;
    currency_symbol: string;
    currency_decimals: number;
    logo: string | null;
    favicon: string | null;
}

export interface CustomerData {
    id: number;
    name: string;
    email: string;
}

export interface ResolvedTheme {
    colors: Record<string, string>;
    typography: TypographyConfig;
    components: ComponentConfig;
    feel: FeelConfig;
    animation: AnimationConfig;
    header: HeaderConfig;
    footer: FooterConfig;
    hero: HeroConfig;
    product_card: ProductCardConfig;
    decorations: DecorationConfig;
}

export interface TypographyConfig {
    heading_font: string;
    body_font: string;
    heading_weight: string;
    body_weight: string;
    base_size: number;
    line_height: number;
}

export interface ComponentConfig {
    button_style?: string;
    input_style?: string;
    card_style?: string;
    [key: string]: unknown;
}

export interface FeelConfig {
    border_radius?: string;
    section_spacing?: string;
    shadow_depth?: string;
    [key: string]: unknown;
}

export interface AnimationConfig {
    entrance_style?: string;
    hover_style?: string;
    [key: string]: unknown;
}

export interface HeaderConfig {
    variant?: string;
    position?: string;
    [key: string]: unknown;
}

export interface FooterConfig {
    variant?: string;
    [key: string]: unknown;
}

export interface HeroConfig {
    default_variant?: string;
    [key: string]: unknown;
}

export interface ProductCardConfig {
    variant?: string;
    [key: string]: unknown;
}

export interface DecorationConfig {
    background_pattern?: string;
    [key: string]: unknown;
}

export interface SectionData {
    id: string;
    type: string;
    variant: string;
    is_visible: boolean;
    scroll_animation: string;
    config: Record<string, unknown>;
    data: Record<string, unknown> | unknown[];
}

export interface NavigationData {
    items: NavigationItem[];
    announcement: AnnouncementData | null;
    social_links: Record<string, string> | null;
}

export interface NavigationItem {
    label: string;
    page_type: string;
    slug: string;
}

export interface AnnouncementData {
    text?: string;
    link?: string;
    is_active?: boolean;
    [key: string]: unknown;
}

export interface SeoData {
    title: string;
    description: string;
    image: string | null;
}

export interface CartSummary {
    item_count: number;
    subtotal: number;
    total: number;
}

export interface ProductData {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    images: ProductImage[];
    category: CategoryData | null;
    variants: ProductVariantData[];
    is_active: boolean;
}

export interface ProductImage {
    id: number;
    url: string;
    alt: string | null;
    sort_order: number;
}

export interface ProductVariantData {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
}

export interface CategoryData {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    description: string | null;
    product_count?: number;
}

export interface ProductCardData {
    id: number;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    image: string | null;
    category_name: string | null;
    is_new?: boolean;
}

export interface SlideData {
    heading?: string;
    subheading?: string;
    image?: string;
    cta_text?: string;
    cta_link?: string;
}

export interface LayoutProps {
    shop: ShopData;
    navigation: NavigationData;
    cart: CartSummary;
    theme: ResolvedTheme;
    customer: CustomerData | null;
    children: ReactNode;
}

export interface SectionProps {
    config: Record<string, unknown>;
    variant: string;
    data: Record<string, unknown> | unknown[];
    theme: ResolvedTheme;
}

export interface FixedPageProps {
    data: Record<string, unknown>;
    shop: ShopData;
    customer: CustomerData | null;
    theme: ResolvedTheme;
}

export interface CartItemData {
    id: number;
    name: string;
    variant_name: string | null;
    price: number;
    quantity: number;
    image: string | null;
    max_quantity: number | null;
}

export interface CartPageData {
    items: CartItemData[];
    summary: CartSummaryDetail;
}

export interface CartSummaryDetail {
    subtotal: number;
    shipping_fee: number;
    tax: number;
    total: number;
    item_count: number;
}

export interface CheckoutPageData extends CartPageData {
    payment_methods: string[];
}

export interface ShippingAddress {
    first_name: string;
    last_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

export interface OrderItemData {
    id: number;
    name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    total: number;
    image: string | null;
}

export interface PaymentData {
    id: number;
    method: string;
    amount: number;
    status: string;
}

export interface OrderData {
    id: number;
    order_number: string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    created_at: string;
    items: OrderItemData[];
    payments: PaymentData[];
}

export interface OrderPageData {
    order: OrderData | null;
}

export interface LoginPageData {
    shop_name: string;
    registration_enabled: boolean;
}

export interface RegisterPageData {
    shop_name: string;
}

export interface AuthPageData {
    shop_name: string;
}

export interface ResetPasswordPageData {
    shop_name: string;
    token: string;
    email: string;
}
