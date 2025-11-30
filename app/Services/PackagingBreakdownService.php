<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\InventoryLocation;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class PackagingBreakdownService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

    /**
     * Break down a package into smaller units
     * Example: Breaking 1 carton (48 pieces) into 48 individual pieces
     *
     * @throws Throwable
     */
    public function breakdownPackage(
        ProductVariant $variant,
        ProductPackagingType $packageType,
        InventoryLocation $location,
        int $packageQuantity,
        User $user,
        ?string $reason = null
    ): array {
        if (! $packageType->can_break_down) {
            throw new Exception("Package type '{$packageType->name}' cannot be broken down");
        }

        if (! $packageType->breaks_into_packaging_type_id) {
            throw new Exception("Package type '{$packageType->name}' has no breakdown target configured");
        }

        $targetPackageType = ProductPackagingType::find($packageType->breaks_into_packaging_type_id);

        if (! $targetPackageType) {
            throw new Exception("Target package type not found");
        }

        try {
            return DB::transaction(function () use (
                $variant,
                $packageType,
                $targetPackageType,
                $location,
                $packageQuantity,
                $user,
                $reason
            ) {
                // Lock location to prevent race conditions
                $location = InventoryLocation::where('id', $location->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Calculate how many target units we'll get
                $targetUnits = $packageQuantity * $packageType->units_per_package;

                // If target is not base unit, convert to base units first
                if (! $targetPackageType->is_base_unit) {
                    $targetUnits = $targetUnits / $targetPackageType->units_per_package;
                }

                // Verify we have enough packages to break down
                // Note: In a full implementation, you'd track package-level inventory
                // For now, we'll work with base units in inventory_locations
                $baseUnitsNeeded = $packageQuantity * $packageType->units_per_package;

                if ($location->quantity < $baseUnitsNeeded) {
                    throw new Exception("Insufficient stock to break down. Available: {$location->quantity} base units");
                }

                $quantityBefore = $location->quantity;

                // No change to total base units, just recording the breakdown
                // In a more complex system, you might track packages separately

                $shopId = $location->location_type === \App\Models\Shop::class
                    ? $location->location_id
                    : $variant->product->shop_id;

                $referenceNumber = $this->generateReferenceNumber();

                $movement = \App\Models\StockMovement::create([
                    'tenant_id' => $user->tenant_id,
                    'shop_id' => $shopId,
                    'product_variant_id' => $variant->id,
                    'to_location_id' => $location->id,
                    'type' => StockMovementType::ADJUSTMENT,
                    'quantity' => 0, // No quantity change, just package transformation
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $location->quantity,
                    'reference_number' => $referenceNumber,
                    'reason' => $reason ?? "Broke down {$packageQuantity} {$packageType->name} into {$targetUnits} {$targetPackageType->name}",
                    'notes' => "Package breakdown: {$packageQuantity}x {$packageType->name} → {$targetUnits}x {$targetPackageType->name}",
                    'created_by' => $user->id,
                ]);

                Log::info('Package breakdown completed.', [
                    'movement_id' => $movement->id,
                    'from_package' => $packageType->name,
                    'to_package' => $targetPackageType->name,
                    'quantity' => $packageQuantity,
                    'resulting_units' => $targetUnits,
                ]);

                return [
                    'movement' => $movement,
                    'package_quantity' => $packageQuantity,
                    'from_package_type' => $packageType,
                    'target_units' => $targetUnits,
                    'to_package_type' => $targetPackageType,
                ];
            });
        } catch (Throwable $e) {
            Log::error('Package breakdown failed.', [
                'variant_id' => $variant->id,
                'package_type' => $packageType->name,
                'exception' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Calculate how many base units are in a given package
     */
    public function calculateBaseUnits(ProductPackagingType $packageType, int $quantity): int
    {
        if ($packageType->is_base_unit) {
            return $quantity;
        }

        return $quantity * $packageType->units_per_package;
    }

    /**
     * Check if a package can be broken down
     */
    public function canBreakdown(ProductPackagingType $packageType): bool
    {
        return $packageType->can_break_down && $packageType->breaks_into_packaging_type_id !== null;
    }

    /**
     * Get available breakdown options for a package
     */
    public function getBreakdownOptions(ProductPackagingType $packageType): array
    {
        if (! $this->canBreakdown($packageType)) {
            return [];
        }

        $options = [];
        $current = $packageType;

        while ($current && $current->breaks_into_packaging_type_id) {
            $target = ProductPackagingType::find($current->breaks_into_packaging_type_id);

            if (! $target) {
                break;
            }

            $options[] = [
                'from' => $current->name,
                'to' => $target->name,
                'ratio' => $current->units_per_package,
                'description' => "1 {$current->name} = {$current->units_per_package} {$target->name}",
            ];

            $current = $target;
        }

        return $options;
    }

    private function generateReferenceNumber(): string
    {
        return 'BD-'.strtoupper(uniqid());
    }
}
