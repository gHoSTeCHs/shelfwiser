import { Image } from '@/types/image';
import { SchemaProperty } from '@/types/index';
import { Shop } from '@/types/shop.ts';
import { ProductVariant } from '@/types/stockMovement';

export interface ProductType {
    id: number;
    slug: string;
    label: string;
    description: string;
    config_schema: {
        type: string;
        properties: Record<string, SchemaProperty>;
        required: string[];
    } | null;
    supports_variants: boolean;
    requires_batch_tracking: boolean;
    requires_serial_tracking: boolean;
}

export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    children?: ProductCategory[];
}

export interface Product {
    id: number;
    tenant_id: number;
    shop_id: number;
    template_id: number | null;
    product_type_id: number;
    category_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    custom_attributes: Record<string, unknown> | null;
    has_variants: boolean;
    is_active: boolean;
    track_stock: boolean;
    is_taxable: boolean;
    is_featured: boolean;
    display_order: number;
    seo_title: string | null;
    seo_description: string | null;
    seo_keywords: string | null;
    type: ProductType;
    category: ProductCategory | null;
    shop: Shop;
    variants: ProductVariant[];
    variants_count: number;
    images?: Image[];
    created_at: string;
    updated_at: string;
}

export interface ProductListResponse {
    data: Product[];
    total: number;
}
