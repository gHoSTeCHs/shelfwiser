import { Shop } from '@/types/shop.ts';
import { SchemaProperty } from '@/types/index';
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

export interface ProductListResponse {
    data: Product[];
    total: number;
}

