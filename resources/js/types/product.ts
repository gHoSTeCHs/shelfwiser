import { Shop } from '@/types/shop.ts';
import { SchemaProperty } from '@/types/index';

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
    children?: ProductCategory[];
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    has_variants: boolean;
    is_active: boolean;
    type: ProductType;
    category: ProductCategory | null;
    shop: Shop;
    variants: ProductVariant[];
    variants_count: number;
    created_at: string;
}

export interface ProductVariant {
    id?: string;
    sku: string;
    name: string;
    price: string;
    cost_price: string;
    is_active?: boolean;
    barcode: string;
    attributes: Record<string, string>;
    batch_number?: string;
    expiry_date?: string;
    serial_number?: string;
}

export interface ProductListResponse {
    data: Product[];
    total: number;
}

