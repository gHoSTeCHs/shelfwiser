<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for syncing product variants to offline POS.
 * Returns a flattened structure optimized for IndexedDB storage and fast lookup.
 */
class SyncProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;

        // Calculate stock from inventory locations
        $stockQuantity = $this->relationLoaded('inventoryLocations')
            ? $this->inventoryLocations->sum('quantity')
            : $this->total_stock;

        $availableStock = $this->relationLoaded('inventoryLocations')
            ? $this->inventoryLocations->sum(fn($loc) => max(0, $loc->quantity - $loc->reserved_quantity))
            : $this->available_stock;

        return [
            // Identifiers
            'id' => $this->id,
            'product_id' => $this->product_id,
            'tenant_id' => $product->tenant_id,
            'shop_id' => $product->shop_id,

            // Display info
            'product_name' => $product->name,
            'variant_name' => $this->name,
            'display_name' => $product->name . ($this->name ? ' - ' . $this->name : ''),

            // Lookup keys (indexed in IndexedDB)
            'sku' => $this->sku,
            'barcode' => $this->barcode,

            // Pricing
            'price' => (float) $this->price,
            'cost_price' => (float) $this->cost_price,

            // Stock
            'stock_quantity' => $stockQuantity,
            'available_stock' => $availableStock,
            'track_stock' => $product->track_stock ?? true,
            'reorder_level' => $this->reorder_level,

            // Tax & status
            'is_taxable' => $product->is_taxable ?? false,
            'is_active' => $this->is_active,

            // Images
            'image_url' => $this->image_url ?? $product->image_url ?? null,

            // Packaging types for unit selection
            'packaging_types' => $this->whenLoaded('packagingTypes', function () {
                return $this->packagingTypes->map(fn($pkg) => [
                    'id' => $pkg->id,
                    'name' => $pkg->name,
                    'display_name' => $pkg->display_name ?? $pkg->name,
                    'units_per_package' => $pkg->units_per_package,
                    'price' => (float) $pkg->price,
                    'is_base_unit' => $pkg->is_base_unit,
                    'can_break_down' => $pkg->can_break_down,
                ]);
            }),

            // Timestamps for sync
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
