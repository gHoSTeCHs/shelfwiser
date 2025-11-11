export interface StockMovement {
    id: number;
    tenant_id: number;
    product_variant_id: number;
    from_location_id: number | null;
    to_location_id: number | null;
    type: StockMovementType;
    quantity: number;
    quantity_before: number | null;
    quantity_after: number | null;
    reference_number: string | null;
    reason: string | null;
    notes: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    product_variant?: ProductVariant;
    from_location?: InventoryLocation;
    to_location?: InventoryLocation;
    created_by_user?: {
        id: number;
        name: string;
    };
}

export interface ProductVariant {
    id: number;
    product_id: number;
    sku: string;
    name: string | null;
    price: number;
    cost_price: number | null;
    barcode: string | null;
    attributes: Record<string, any> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    product?: {
        id: number;
        name: string;
        slug: string;
        shop_id: number;
    };
    inventory_locations?: InventoryLocation[];
}

export interface InventoryLocation {
    id: number;
    product_variant_id: number;
    locatable_type: string;
    locatable_id: number;
    quantity: number;
    reserved_quantity: number;
    batch_number: string | null;
    expiry_date: string | null;
    serial_number: string | null;
    bin_location: string | null;
    created_at: string;
    updated_at: string;
    locatable?: {
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
