import { Product } from './product';
import { ProductCategory } from './product';
import { Shop } from './shop';
import { User } from './index';
import { ProductVariant, ProductPackagingType } from './stockMovement';

// Cart Types
export interface Cart {
    id: number;
    shop_id: number;
    customer_id: number | null;
    session_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    items?: CartItem[];
}

export interface CartItem {
    id: number;
    cart_id: number;
    product_variant_id: number;
    product_packaging_type_id: number | null;
    quantity: number;
    price: number;
    created_at: string;
    updated_at: string;
    productVariant?: ProductVariant & {
        product?: Product;
    };
    packagingType?: ProductPackagingType;
    subtotal?: number;
}

export interface CartSummary {
    items: CartItem[];
    subtotal: number;
    shipping_fee: number;
    tax: number;
    total: number;
    item_count: number;
}

// Customer Address Types
export interface CustomerAddress {
    id: number;
    customer_id: number;
    type: 'shipping' | 'billing' | 'both';
    is_default: boolean;
    first_name: string;
    last_name: string;
    phone: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string | null;
    country: string;
    created_at: string;
    updated_at: string;
    full_name?: string;
    formatted_address?: string;
}

// Storefront Page Props
export interface StorefrontHomeProps {
    shop: Shop;
    featuredProducts: Product[];
    categories: ProductCategory[];
    cartSummary: CartSummary;
}

export interface StorefrontProductsProps {
    shop: Shop;
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: ProductCategory[];
    filters: {
        search?: string;
        category?: number;
        sort?: string;
        per_page?: number;
    };
    cartSummary: CartSummary;
}

export interface StorefrontProductDetailProps {
    shop: Shop;
    product: Product;
    relatedProducts: Product[];
    cartSummary: CartSummary;
}

export interface StorefrontCartProps {
    shop: Shop;
    cart: Cart;
    cartSummary: CartSummary;
}

// Form Data Types
export interface AddToCartData {
    variant_id: number;
    quantity: number;
    packaging_type_id?: number;
}

export interface UpdateCartItemData {
    quantity: number;
}

// Sort Options
export type ProductSortOption = 'name' | 'price_low' | 'price_high' | 'newest' | 'featured';

export interface SortOption {
    value: ProductSortOption;
    label: string;
}

// Storefront Settings (from shop.storefront_settings)
export interface StorefrontSettings {
    theme_color?: string;
    banner_image?: string;
    logo?: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
    social_links?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    business_hours?: string;
    contact_email?: string;
    enable_reviews?: boolean;
    enable_wishlist?: boolean;
    min_order_amount?: number;
    shipping_fee?: number;
    free_shipping_threshold?: number;
}
