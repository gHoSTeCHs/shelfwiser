/* eslint-disable @typescript-eslint/no-explicit-any */


export interface ShopType {
    slug: string;
    label: string;
    description?: string;
    config_schema?: {
        type: 'object';
        properties: Record<
            string,
            {
                type: string;
                title?: string;
                default?: any;
                enum?: any[];
            }
        >;
        required?: string[];
    };
}

export interface Shop {
    products_count?: number;
    id: number;
    name: string;
    slug: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    type: ShopType;
    config: Record<string, any>;
    // products: Product[]
    is_active: boolean;
    users_count?: number;
    can_manage: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateShopRequest {
    name: string;
    shop_type_slug: string;
    config: Record<string, any>;
}
