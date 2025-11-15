import { Shop } from '@/types/shop';

export type MaterialOption = 'customer_materials' | 'shop_materials' | 'none';

export interface MaterialOptionInfo {
    value: MaterialOption;
    label: string;
    description: string;
}

export interface ServiceCategory {
    id: number;
    tenant_id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    children?: ServiceCategory[];
    services_count?: number;
}

export interface ServiceAddon {
    id: number;
    service_id: number | null;
    service_category_id: number | null;
    name: string;
    description: string | null;
    price: number;
    allows_quantity: boolean;
    max_quantity: number | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ServiceVariant {
    id: number;
    service_id: number;
    name: string;
    description: string | null;
    customer_materials_price: number | null;
    shop_materials_price: number | null;
    base_price: number;
    estimated_duration_minutes: number | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Service {
    id: number;
    tenant_id: number;
    shop_id: number;
    service_category_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    has_material_options: boolean;
    is_active: boolean;
    is_available_online: boolean;
    created_at: string;
    updated_at: string;
    category?: ServiceCategory | null;
    shop?: Shop;
    variants?: ServiceVariant[];
    addons?: ServiceAddon[];
    variants_count?: number;
}

export interface ServiceListResponse {
    data: Service[];
    total: number;
}

export interface CreateServiceData {
    shop_id: number;
    service_category_id?: number;
    name: string;
    description?: string;
    image_url?: string;
    has_material_options: boolean;
    is_active: boolean;
    is_available_online: boolean;
    variants: CreateServiceVariantData[];
}

export interface CreateServiceVariantData {
    name: string;
    description?: string;
    base_price: number;
    customer_materials_price?: number;
    shop_materials_price?: number;
    estimated_duration_minutes?: number;
    sort_order?: number;
    is_active?: boolean;
}

export interface CreateServiceAddonData {
    name: string;
    description?: string;
    price: number;
    allows_quantity: boolean;
    max_quantity?: number;
    sort_order?: number;
    is_active?: boolean;
}

export interface SelectedAddon {
    addon_id: number;
    quantity: number;
}
