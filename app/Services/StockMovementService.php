<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\InventoryLocation;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class StockMovementService
{
    /**
     * @throws Throwable
     */
    public function adjustStock(
        ProductVariant $variant,
        InventoryLocation $location,
        int $quantity,
        StockMovementType $type,
        User $user,
        ?string $reason = null,
        ?string $notes = null
    ): StockMovement {
        Log::info('Stock adjustment process started.', [
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'quantity' => $quantity,
            'type' => $type->value,
        ]);

        try {
            return DB::transaction(function () use ($variant, $location, $quantity, $type, $user, $reason, $notes) {
                $quantityBefore = $location->quantity;

                if ($type->isIncrease()) {
                    $location->quantity += $quantity;
                } elseif ($type->isDecrease()) {
                    if ($location->quantity < $quantity) {
                        throw new Exception('Insufficient stock. Available: ' . $location->quantity);
                    }
                    $location->quantity -= $quantity;
                }

                $location->save();

                $shopId = $location->location_type === \App\Models\Shop::class
                    ? $location->location_id
                    : $variant->product->shop_id;

                $movement = StockMovement::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'shop_id' => $shopId,
                    'product_variant_id' => $variant->id,
                    'to_location_id' => $location->id,
                    'type' => $type,
                    'quantity' => $quantity,
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $location->quantity,
                    'reference_number' => $this->generateReferenceNumber($type),
                    'reason' => $reason,
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                Log::info('Stock adjusted successfully.', ['movement_id' => $movement->id]);

                return $movement;
            });
        } catch (Throwable $e) {
            Log::error('Stock adjustment failed.', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function transferStock(
        ProductVariant $variant,
        InventoryLocation $fromLocation,
        InventoryLocation $toLocation,
        int $quantity,
        User $user,
        ?string $reason = null,
        ?string $notes = null
    ): array {
        Log::info('Stock transfer process started.', [
            'variant_id' => $variant->id,
            'from_location_id' => $fromLocation->id,
            'to_location_id' => $toLocation->id,
            'quantity' => $quantity,
        ]);

        try {
            return DB::transaction(function () use ($variant, $fromLocation, $toLocation, $quantity, $user, $reason, $notes) {
                if ($fromLocation->quantity < $quantity) {
                    throw new Exception('Insufficient stock at source location. Available: ' . $fromLocation->quantity);
                }

                $fromQuantityBefore = $fromLocation->quantity;
                $toQuantityBefore = $toLocation->quantity;

                $fromLocation->quantity -= $quantity;
                $fromLocation->save();

                $toLocation->quantity += $quantity;
                $toLocation->save();

                $referenceNumber = $this->generateReferenceNumber(StockMovementType::TRANSFER_OUT);

                $outMovement = StockMovement::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'product_variant_id' => $variant->id,
                    'from_location_id' => $fromLocation->id,
                    'to_location_id' => $toLocation->id,
                    'type' => StockMovementType::TRANSFER_OUT,
                    'quantity' => $quantity,
                    'quantity_before' => $fromQuantityBefore,
                    'quantity_after' => $fromLocation->quantity,
                    'reference_number' => $referenceNumber,
                    'reason' => $reason,
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                $inMovement = StockMovement::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'product_variant_id' => $variant->id,
                    'from_location_id' => $fromLocation->id,
                    'to_location_id' => $toLocation->id,
                    'type' => StockMovementType::TRANSFER_IN,
                    'quantity' => $quantity,
                    'quantity_before' => $toQuantityBefore,
                    'quantity_after' => $toLocation->quantity,
                    'reference_number' => $referenceNumber,
                    'reason' => $reason,
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                Log::info('Stock transferred successfully.', [
                    'out_movement_id' => $outMovement->id,
                    'in_movement_id' => $inMovement->id,
                ]);

                return [
                    'out' => $outMovement,
                    'in' => $inMovement,
                ];
            });
        } catch (Throwable $e) {
            Log::error('Stock transfer failed.', [
                'variant_id' => $variant->id,
                'from_location_id' => $fromLocation->id,
                'to_location_id' => $toLocation->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Record a purchase with packaging context and update weighted average cost
     *
     * @throws Throwable
     */
    public function recordPurchase(
        ProductVariant $variant,
        InventoryLocation $location,
        int $packageQuantity,
        ProductPackagingType $packagingType,
        float $costPerPackage,
        User $user,
        ?string $notes = null
    ): StockMovement {
        Log::info('Purchase recording process started.', [
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'package_quantity' => $packageQuantity,
            'packaging_type_id' => $packagingType->id,
        ]);

        try {
            return DB::transaction(function () use (
                $variant,
                $location,
                $packageQuantity,
                $packagingType,
                $costPerPackage,
                $user,
                $notes
            ) {
                $baseUnits = $packageQuantity * $packagingType->units_per_package;
                $costPerBaseUnit = $costPerPackage / $packagingType->units_per_package;

                $quantityBefore = $location->quantity;

                $variant->updateWeightedAverageCost($baseUnits, $costPerBaseUnit);

                $location->quantity += $baseUnits;
                $location->save();

                $movement = StockMovement::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $packagingType->id,
                    'to_location_id' => $location->id,
                    'type' => StockMovementType::PURCHASE,
                    'quantity' => $baseUnits,
                    'package_quantity' => $packageQuantity,
                    'cost_per_package' => $costPerPackage,
                    'cost_per_base_unit' => $costPerBaseUnit,
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $location->quantity,
                    'reference_number' => $this->generateReferenceNumber(StockMovementType::PURCHASE),
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                Log::info('Purchase recorded successfully.', [
                    'movement_id' => $movement->id,
                    'base_units' => $baseUnits,
                    'new_avg_cost' => $variant->fresh()->cost_price,
                ]);

                return $movement;
            });
        } catch (Throwable $e) {
            Log::error('Purchase recording failed.', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Record a sale with packaging context
     *
     * @throws Throwable
     */
    public function recordSale(
        ProductVariant $variant,
        InventoryLocation $location,
        int $quantity,
        ?ProductPackagingType $packagingType,
        User $user,
        ?string $referenceNumber = null,
        ?string $notes = null
    ): StockMovement {
        Log::info('Sale recording process started.', [
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'quantity' => $quantity,
        ]);

        try {
            return DB::transaction(function () use (
                $variant,
                $location,
                $quantity,
                $packagingType,
                $user,
                $referenceNumber,
                $notes
            ) {
                $quantityBefore = $location->quantity;

                if ($location->quantity < $quantity) {
                    throw new Exception('Insufficient stock. Available: ' . $location->quantity);
                }

                $location->quantity -= $quantity;
                $location->save();

                $packageQuantity = null;
                if ($packagingType) {
                    $packageQuantity = (int) ($quantity / $packagingType->units_per_package);
                }

                $movement = StockMovement::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $packagingType?->id,
                    'from_location_id' => $location->id,
                    'type' => StockMovementType::SALE,
                    'quantity' => -$quantity,
                    'package_quantity' => $packageQuantity ? -$packageQuantity : null,
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $location->quantity,
                    'reference_number' => $referenceNumber ?? $this->generateReferenceNumber(StockMovementType::SALE),
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                Log::info('Sale recorded successfully.', ['movement_id' => $movement->id]);

                return $movement;
            });
        } catch (Throwable $e) {
            Log::error('Sale recording failed.', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function stockTake(
        ProductVariant $variant,
        InventoryLocation $location,
        int $actualQuantity,
        User $user,
        ?string $notes = null
    ): ?StockMovement {
        Log::info('Stock take process started.', [
            'variant_id' => $variant->id,
            'location_id' => $location->id,
            'actual_quantity' => $actualQuantity,
        ]);

        try {
            return DB::transaction(function () use ($variant, $location, $actualQuantity, $user, $notes) {
                $quantityBefore = $location->quantity;
                $difference = $actualQuantity - $quantityBefore;

                if ($difference === 0) {
                    Log::info('Stock take completed: no adjustment needed.');
                    return null;
                }

                $location->quantity = $actualQuantity;
                $location->save();

//                $type = $difference > 0 ? StockMovementType::ADJUSTMENT_IN : StockMovementType::ADJUSTMENT_OUT;
                $quantity = abs($difference);

                $movement = StockMovement::query()->create([
                    'tenant_id' => $user->tenant_id,
                    'product_variant_id' => $variant->id,
                    'to_location_id' => $location->id,
                    'type' => StockMovementType::STOCK_TAKE,
                    'quantity' => $quantity,
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $actualQuantity,
                    'reference_number' => $this->generateReferenceNumber(StockMovementType::STOCK_TAKE),
                    'reason' => $difference > 0 ? 'Stock take - surplus found' : 'Stock take - shortage found',
                    'notes' => $notes,
                    'created_by' => $user->id,
                ]);

                Log::info('Stock take completed successfully.', ['movement_id' => $movement->id]);

                return $movement;
            });
        } catch (Throwable $e) {
            Log::error('Stock take failed.', [
                'variant_id' => $variant->id,
                'location_id' => $location->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * @throws Throwable
     */
    public function recordMovement(array $data): StockMovement
    {
        return DB::transaction(function () use ($data) {
            $movement = StockMovement::create($data);

            Log::info('Stock movement recorded', [
                'movement_id' => $movement->id,
                'type' => $movement->type->value,
            ]);

            return $movement;
        });
    }

    private function generateReferenceNumber(StockMovementType $type): string
    {
        $prefix = match ($type) {
            StockMovementType::PURCHASE => 'PUR',
            StockMovementType::SALE => 'SAL',
            StockMovementType::ADJUSTMENT_IN => 'ADJ-IN',
            StockMovementType::ADJUSTMENT_OUT => 'ADJ-OUT',
            StockMovementType::TRANSFER_IN, StockMovementType::TRANSFER_OUT => 'TRF',
            StockMovementType::RETURN => 'RET',
            StockMovementType::DAMAGE => 'DMG',
            StockMovementType::LOSS => 'LOSS',
            StockMovementType::STOCK_TAKE => 'STK',
            StockMovementType::PURCHASE_ORDER_SHIPPED => 'PO-SHIP',
            StockMovementType::PURCHASE_ORDER_RECEIVED => 'PO-RCV',
        };

        return $prefix . '-' . strtoupper(uniqid());
    }
}
