import type { SchemaPropertyValue } from './index';

export type InventoryModelType = 'simple_retail' | 'wholesale_only' | 'hybrid';
export type ShopOfferingType = 'products' | 'services' | 'both';

export interface InventoryModelOption {
    value: InventoryModelType;
    label: string;
    description: string;
    complexity: string;
    suitable_for: string;
    features: string[];
}

export interface ShopConfigSchemaProperty {
    type: string;
    title?: string;
    default?: SchemaPropertyValue;
    enum?: SchemaPropertyValue[];
}

export interface ShopType {
    slug: string;
    label: string;
    description?: string;
    config_schema?: {
        type: 'object';
        properties: Record<string, ShopConfigSchemaProperty>;
        required?: string[];
    };
}

export interface StorefrontSettings {
    shipping_fee?: number;
    free_shipping_threshold?: number;
    theme_color?: string;
    logo_url?: string | null;
    banner_url?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    social_facebook?: string | null;
    social_instagram?: string | null;
    social_twitter?: string | null;
    business_hours?: string | null;
}

export interface Shop {
    id: number;
    tenant_id: number;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    type: ShopType | null;
    config: Record<string, SchemaPropertyValue> | null;
    is_active: boolean;
    storefront_enabled: boolean;
    users_count?: number;
    can_manage: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateShopRequest {
    name: string;
    shop_type_slug: string;
    inventory_model: InventoryModelType;
    address?: string;
    city: string;
    state: string;
    country: string;
    phone?: string;
    email?: string;
    config: Record<string, SchemaPropertyValue>;
    is_active?: boolean;
}
