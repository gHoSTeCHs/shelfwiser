import { Image } from '@/types/image';
import { SchemaProperty } from '@/types/index';
import { Shop } from '@/types/shop.ts';
import { ProductVariant } from '@/types/stockMovement';

export type { ProductVariant } from '@/types/stockMovement';

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

export interface TemplatePackagingType {
    name: string;
    display_name?: string;
    units_per_package: number;
    is_sealed_package?: boolean;
    price?: number;
    cost_price?: number;
    is_base_unit?: boolean;
    can_break_down?: boolean;
    min_order_quantity?: number;
    display_order?: number;
}

export interface TemplateVariant {
    name: string;
    sku_suffix?: string;
    attributes?: Record<string, string | number | boolean>;
    packaging_types?: TemplatePackagingType[];
}

export interface TemplateStructure {
    variants: TemplateVariant[];
}

export interface TemplateSeoMetadata {
    title?: string;
    description?: string;
    keywords?: string[];
}

export interface ProductTemplate {
    id: number;
    tenant_id: number | null;
    product_type_id: number;
    category_id: number | null;
    created_by_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    custom_attributes: Record<string, unknown> | null;
    template_structure: TemplateStructure;
    images: string[] | null;
    seo_metadata: TemplateSeoMetadata | null;
    has_variants: boolean;
    is_system: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    productType?: ProductType;
    category?: ProductCategory;
    variant_count?: number;
    usage_count?: number;
}

export interface ProductTemplateListResponse {
    data: ProductTemplate[];
    total: number;
}

/**
 * Form data types for product creation/editing.
 * These use string types for numeric fields to handle form input state.
 */
export interface PackagingTypeFormData {
    id: string;
    name: string;
    display_name: string;
    units_per_package: number;
    is_sealed_package: boolean;
    price: number | string;
    cost_price: number | string | null;
    is_base_unit: boolean;
    can_break_down: boolean;
    min_order_quantity: number;
    display_order: number;
    is_active: boolean;
}

export interface ProductVariantFormData {
    id: string;
    sku: string;
    name: string;
    price: string;
    cost_price: string;
    barcode: string;
    base_unit_name: string;
    attributes: Record<string, unknown>;
    packaging_types: PackagingTypeFormData[];
}
