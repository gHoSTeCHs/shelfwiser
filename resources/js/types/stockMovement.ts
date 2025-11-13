export interface StockMovement {
    id: number;
    tenant_id: number;
    product_variant_id: number;
    product_packaging_type_id: number | null;
    from_location_id: number | null;
    to_location_id: number | null;
    type: StockMovementType;
    quantity: number;
    package_quantity: number | null;
    cost_per_package: number | null;
    cost_per_base_unit: number | null;
    quantity_before: number | null;
    quantity_after: number | null;
    reference_number: string | null;
    reason: string | null;
    notes: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    product_variant?: ProductVariant;
    packaging_type?: ProductPackagingType;
    from_location?: InventoryLocation;
    to_location?: InventoryLocation;
    created_by_user?: {
        id: number;
        name: string;
    };
    package_description?: string;
    total_cost?: number;
}

export interface ProductPackagingType {
    id: number;
    product_variant_id: number;
    name: string;
    display_name: string | null;
    units_per_package: number;
    is_sealed_package: boolean;
    price: number;
    cost_price: number | null;
    is_base_unit: boolean;
    can_break_down: boolean;
    breaks_into_packaging_type_id: number | null;
    min_order_quantity: number;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    price_per_unit?: number;
    has_discount?: boolean;
    discount_percentage?: number;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    sku: string;
    name: string | null;
    price: number;
    cost_price: number | null;
    reorder_level: number | null;
    barcode: string | null;
    attributes: Record<string, any> | null;
    base_unit_name: string;
    image_url: string | null;
    images: string[] | null;
    batch_number?: string;
    expiry_date?: string;
    serial_number?: string;
    is_active: boolean;
    total_stock?: number;
    available_stock?: number;
    created_at: string;
    updated_at: string;
    product?: {
        id: number;
        name: string;
        slug: string;
        shop_id: number;
    };
    inventory_locations?: InventoryLocation[];
    packaging_types?: ProductPackagingType[];
}

export interface InventoryLocation {
    id: number;
    product_variant_id: number;
    location_type: string;
    location_id: number;
    quantity: number;
    reserved_quantity: number;
    batch_number: string | null;
    expiry_date: string | null;
    serial_number: string | null;
    bin_location: string | null;
    created_at: string;
    updated_at: string;
    location?: {
        id: number;
        name: string;
        type?: string;
    };
}

export type StockMovementType =
    | 'purchase'
    | 'sale'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'transfer_in'
    | 'transfer_out'
    | 'return'
    | 'damage'
    | 'loss'
    | 'stock_take';

export interface StockMovementTypeOption {
    value: StockMovementType;
    label: string;
}
