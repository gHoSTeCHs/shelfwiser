<?php

namespace App\Services;

use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderPayment;
use App\Models\Shop;
use App\Models\SupplierCatalogItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseOrderService
{
    public function __construct(
        private StockMovementService $stockMovementService,
        private SupplierConnectionService $connectionService
    ) {}

    public function createPurchaseOrder(Tenant $buyerTenant, Shop $shop, Tenant $supplierTenant, array $data, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($buyerTenant, $shop, $supplierTenant, $data, $user) {
            if (! $this->connectionService->canOrder($buyerTenant, $supplierTenant)) {
                throw new \Exception('No active connection with supplier');
            }

            $po = PurchaseOrder::create([
                'buyer_tenant_id' => $buyerTenant->id,
                'supplier_tenant_id' => $supplierTenant->id,
                'shop_id' => $shop->id,
                'po_number' => $this->generatePONumber(),
                'status' => PurchaseOrderStatus::DRAFT,
                'buyer_notes' => $data['notes'] ?? null,
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'created_by' => $user->id,
            ]);

            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $this->addItem($po, $itemData);
                }
            }

            $po->calculateTotals();

            $supplierProfile = $supplierTenant->supplierProfile;
            $connection = $this->connectionService->getConnection($buyerTenant, $supplierTenant);

            $paymentTerms = $connection->payment_terms_override ?? $supplierProfile->payment_terms;
            $po->payment_due_date = $this->calculatePaymentDueDate($paymentTerms);
            $po->save();

            Log::info('Purchase order created', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'buyer_tenant_id' => $buyerTenant->id,
                'supplier_tenant_id' => $supplierTenant->id,
            ]);

            return $po->fresh(['items.productVariant', 'items.catalogItem']);
        });
    }

    public function addItem(PurchaseOrder $po, array $data): PurchaseOrderItem
    {
        $catalogItem = SupplierCatalogItem::with('product.variants')->findOrFail($data['catalog_item_id']);
        $connection = $this->connectionService->getConnection($po->buyerTenant, $po->supplierTenant);

        $quantity = $data['quantity'];

        if ($catalogItem->min_order_quantity && $quantity < $catalogItem->min_order_quantity) {
            throw new \Exception(
                "Quantity {$quantity} is below the minimum order quantity of {$catalogItem->min_order_quantity} for this item"
            );
        }

        $unitPrice = $data['unit_price'] ?? $catalogItem->getPriceForQuantity($quantity, $connection?->id);
        $itemTotal = $unitPrice * $quantity;

        if ($connection && $connection->credit_limit) {
            $poCurrentTotal = $po->items()->sum('total_price') ?? 0;
            $newPoTotal = $poCurrentTotal + $itemTotal;

            $outstandingAmount = $this->calculateOutstandingAmount(
                $po->buyerTenant->id,
                $po->supplier_tenant_id,
                $po->id
            );

            $newTotalOutstanding = $outstandingAmount + $newPoTotal;

            if ($newTotalOutstanding > $connection->credit_limit) {
                $availableCredit = max(0, $connection->credit_limit - $outstandingAmount - $poCurrentTotal);
                throw new \Exception(
                    'Adding this item would exceed your credit limit. Available credit: '.
                    number_format($availableCredit, 2)
                );
            }
        }

        $product = $catalogItem->product;
        $productVariantId = $data['product_variant_id'] ?? $product->variants()->first()?->id;

        if (! $productVariantId) {
            throw new \Exception("Product {$product->name} has no variants available");
        }

        return PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_variant_id' => $productVariantId,
            'catalog_item_id' => $catalogItem->id,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $unitPrice * $quantity,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function updateItem(PurchaseOrderItem $item, array $data): PurchaseOrderItem
    {
        if (! $item->purchaseOrder->status->canEdit()) {
            throw new \Exception('Cannot edit items in this PO status');
        }

        $item->update([
            'quantity' => $data['quantity'] ?? $item->quantity,
            'unit_price' => $data['unit_price'] ?? $item->unit_price,
            'notes' => $data['notes'] ?? $item->notes,
        ]);

        $item->calculateTotal();
        $item->purchaseOrder->calculateTotals();

        return $item->fresh();
    }

    public function removeItem(PurchaseOrderItem $item): void
    {
        if (! $item->purchaseOrder->status->canEdit()) {
            throw new \Exception('Cannot remove items in this PO status');
        }

        DB::transaction(function () use ($item) {
            $po = $item->purchaseOrder;
            $item->delete();
            $po->calculateTotals();
        });
    }

    public function submitPurchaseOrder(PurchaseOrder $po, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user) {
            if (! $po->status->canEdit()) {
                throw new \Exception('PO cannot be submitted in current status');
            }

            if ($po->items->isEmpty()) {
                throw new \Exception('Cannot submit empty purchase order');
            }

            $this->reserveSupplierStock($po, $user);

            $po->update([
                'status' => PurchaseOrderStatus::SUBMITTED,
                'submitted_at' => now(),
            ]);

            Log::info('Purchase order submitted', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'submitted_by' => $user->id,
            ]);

            return $po->fresh();
        });
    }

    public function approvePurchaseOrder(PurchaseOrder $po, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user) {
            if (! $po->status->canApprove()) {
                throw new \Exception('PO cannot be approved in current status');
            }

            $po->update([
                'status' => PurchaseOrderStatus::APPROVED,
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

            Log::info('Purchase order approved', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'approved_by' => $user->id,
            ]);

            return $po->fresh();
        });
    }

    public function startProcessingPurchaseOrder(PurchaseOrder $po, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user) {
            if (! $po->status->canStartProcessing()) {
                throw new \Exception('PO cannot start processing in current status');
            }

            $po->update([
                'status' => PurchaseOrderStatus::PROCESSING,
            ]);

            Log::info('Purchase order processing started', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'started_by' => $user->id,
            ]);

            return $po->fresh();
        });
    }

    public function shipPurchaseOrder(PurchaseOrder $po, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user) {
            if (! $po->status->canShip()) {
                throw new \Exception('PO cannot be shipped in current status');
            }

            $validatedLocations = $this->validateStockForShipping($po);

            foreach ($po->items as $item) {
                $location = $validatedLocations[$item->id];
                $this->decreaseSupplierStockWithLocation($item, $location, $user);
            }

            $po->update([
                'status' => PurchaseOrderStatus::SHIPPED,
                'shipped_at' => now(),
                'shipped_by' => $user->id,
            ]);

            Log::info('Purchase order shipped', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'shipped_by' => $user->id,
            ]);

            return $po->fresh();
        });
    }

    /**
     * Receive items from a purchase order. Supports partial receipts.
     *
     * @param  array  $data  = [
     *                       'items' => [
     *                       item_id => ['received_quantity' => qty],
     *                       ...
     *                       ],
     *                       'actual_delivery_date' => 'Y-m-d'
     *                       ]
     */
    public function receivePurchaseOrder(PurchaseOrder $po, User $user, array $data = []): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user, $data) {
            if (! $po->status->canReceive()) {
                throw new \Exception('PO cannot be received in current status');
            }

            foreach ($po->items as $item) {
                $newReceivedQty = $data['items'][$item->id]['received_quantity'] ?? 0;

                if ($newReceivedQty < 0) {
                    throw new \Exception("Received quantity cannot be negative for item {$item->id}");
                }

                if ($newReceivedQty > 0) {
                    $totalReceived = $item->received_quantity + $newReceivedQty;

                    if ($totalReceived > $item->quantity) {
                        throw new \Exception(
                            "Total received quantity ({$totalReceived}) cannot exceed ordered quantity ({$item->quantity}) for item {$item->id}"
                        );
                    }

                    $this->increaseBuyerStock($item, $newReceivedQty, $user);
                    $item->increment('received_quantity', $newReceivedQty);
                }
            }

            $allItemsFullyReceived = $po->items()->get()->every(fn ($item) => $item->isFullyReceived());
            $anyItemsPartiallyReceived = $po->items()->get()->some(fn ($item) => $item->received_quantity > 0 && ! $item->isFullyReceived());

            $newStatus = $allItemsFullyReceived
                ? PurchaseOrderStatus::RECEIVED
                : ($anyItemsPartiallyReceived ? PurchaseOrderStatus::PARTIALLY_RECEIVED : $po->status);

            $updateData = [
                'status' => $newStatus,
                'actual_delivery_date' => $data['actual_delivery_date'] ?? $po->actual_delivery_date ?? now()->toDateString(),
            ];

            if ($newStatus === PurchaseOrderStatus::RECEIVED && ! $po->received_at) {
                $updateData['received_at'] = now();
                $updateData['received_by'] = $user->id;
            }

            $po->update($updateData);

            Log::info('Purchase order received', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'status' => $newStatus->value,
                'received_by' => $user->id,
            ]);

            return $po->fresh();
        });
    }

    public function completePurchaseOrder(PurchaseOrder $po): PurchaseOrder
    {
        return DB::transaction(function () use ($po) {
            $po->update(['status' => PurchaseOrderStatus::COMPLETED]);

            Log::info('Purchase order completed', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
            ]);

            return $po->fresh();
        });
    }

    public function cancelPurchaseOrder(PurchaseOrder $po, ?string $reason = null): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $reason) {
            if (! $po->status->canCancel()) {
                throw new \Exception('PO cannot be cancelled in current status');
            }

            $this->releaseStockReservation($po);

            $po->update([
                'status' => PurchaseOrderStatus::CANCELLED,
                'supplier_notes' => $reason,
            ]);

            $po->update(['payment_status' => PurchaseOrderPaymentStatus::CANCELLED]);

            Log::info('Purchase order cancelled', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
                'reason' => $reason,
            ]);

            return $po->fresh();
        });
    }

    public function recordPayment(PurchaseOrder $po, array $data, User $user): PurchaseOrderPayment
    {
        return DB::transaction(function () use ($po, $data, $user) {
            if (! $po->payment_status->canRecordPayment()) {
                throw new \Exception('Cannot record payment for this PO');
            }

            $payment = PurchaseOrderPayment::create([
                'purchase_order_id' => $po->id,
                'amount' => $data['amount'],
                'payment_date' => $data['payment_date'] ?? now(),
                'payment_method' => $data['payment_method'],
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $user->id,
            ]);

            Log::info('Payment recorded for purchase order', [
                'po_id' => $po->id,
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
            ]);

            return $payment;
        });
    }

    /**
     * @deprecated Use decreaseSupplierStockWithLocation instead
     */
    protected function decreaseSupplierStock(PurchaseOrderItem $item, User $user): void
    {
        $variant = $item->productVariant;
        $po = $item->purchaseOrder;

        $location = $variant->inventoryLocations()
            ->where('location_type', Shop::class)
            ->whereHas('location', fn ($q) => $q->where('tenant_id', $po->supplier_tenant_id))
            ->where('quantity', '>=', $item->quantity)
            ->lockForUpdate()
            ->orderBy('quantity', 'desc')
            ->first();

        if (! $location) {
            throw new \Exception("Supplier inventory location not found or insufficient stock for variant {$variant->sku}");
        }

        $this->decreaseSupplierStockWithLocation($item, $location, $user);
    }

    /**
     * Decrease supplier stock using a pre-validated and locked inventory location.
     * Also releases the reservation that was made during PO submission.
     */
    protected function decreaseSupplierStockWithLocation(PurchaseOrderItem $item, $location, User $user): void
    {
        $variant = $item->productVariant;
        $po = $item->purchaseOrder;

        $quantityBefore = $location->quantity;
        $location->decrement('quantity', $item->quantity);

        if ($location->reserved_quantity >= $item->quantity) {
            $location->decrement('reserved_quantity', $item->quantity);
        }

        $this->stockMovementService->recordMovement([
            'tenant_id' => $po->supplier_tenant_id,
            'shop_id' => $location->location_id,
            'product_variant_id' => $variant->id,
            'purchase_order_id' => $po->id,
            'type' => StockMovementType::PURCHASE_ORDER_SHIPPED,
            'quantity' => -$item->quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityBefore - $item->quantity,
            'reference_number' => $po->po_number,
            'reason' => "Shipped to {$po->buyerTenant->name} - PO #{$po->po_number}",
            'created_by' => $user->id,
        ]);
    }

    protected function increaseBuyerStock(PurchaseOrderItem $item, int $receivedQuantity, User $user): void
    {
        $variant = $item->productVariant;
        $po = $item->purchaseOrder;

        $location = $variant->inventoryLocations()
            ->where('location_type', Shop::class)
            ->where('location_id', $po->shop_id)
            ->first();

        if (! $location) {
            $location = $variant->inventoryLocations()->create([
                'tenant_id' => $po->buyer_tenant_id,
                'location_type' => Shop::class,
                'location_id' => $po->shop_id,
                'quantity' => 0,
                'reserved_quantity' => 0,
            ]);
        }

        $quantityBefore = $location->quantity;
        $location->increment('quantity', $receivedQuantity);

        $this->stockMovementService->recordMovement([
            'tenant_id' => $po->buyer_tenant_id,
            'shop_id' => $po->shop_id,
            'product_variant_id' => $variant->id,
            'purchase_order_id' => $po->id,
            'type' => StockMovementType::PURCHASE_ORDER_RECEIVED,
            'quantity' => $receivedQuantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityBefore + $receivedQuantity,
            'reference_number' => $po->po_number,
            'reason' => "Received from {$po->supplierTenant->name} - PO #{$po->po_number}",
            'created_by' => $user->id,
        ]);
    }

    protected function generatePONumber(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid()), 0, 6));

        return "PO-{$date}-{$random}";
    }

    /**
     * Calculate payment due date from payment terms string.
     * Handles various formats: "Net 30", "Net 30 Days", "Due in 15 days", "15 days", "COD", "Due on Receipt", etc.
     */
    protected function calculatePaymentDueDate(?string $paymentTerms): ?\DateTime
    {
        if (empty($paymentTerms)) {
            return now()->addDays(30)->toDateTime();
        }

        $normalizedTerms = strtolower(trim($paymentTerms));

        if (in_array($normalizedTerms, ['cod', 'cash on delivery', 'due on receipt', 'immediate', 'upon receipt'])) {
            return now()->toDateTime();
        }

        if (preg_match('/(\d+)\s*(?:days?|d)?/i', $paymentTerms, $matches)) {
            $days = (int) $matches[1];
            if ($days > 0 && $days <= 365) {
                return now()->addDays($days)->toDateTime();
            }
        }

        return now()->addDays(30)->toDateTime();
    }

    public function getPurchaseOrdersForBuyer(Tenant $buyerTenant, ?Shop $shop = null): Collection
    {
        $query = PurchaseOrder::forBuyer($buyerTenant->id)
            ->with(['supplierTenant', 'shop', 'items.productVariant', 'createdBy']);

        if ($shop) {
            $query->forShop($shop->id);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function getPurchaseOrdersForSupplier(Tenant $supplierTenant): Collection
    {
        return PurchaseOrder::forSupplier($supplierTenant->id)
            ->with(['buyerTenant', 'shop', 'items.productVariant', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Calculate total outstanding amount for a buyer with a specific supplier.
     * Includes SUBMITTED, APPROVED, SHIPPED, PARTIALLY_RECEIVED and RECEIVED orders for accurate credit limit checking.
     * Uses database locking to prevent race conditions during concurrent order creation.
     */
    protected function calculateOutstandingAmount(int $buyerTenantId, int $supplierTenantId, ?int $excludePoId = null): float
    {
        $query = PurchaseOrder::where('buyer_tenant_id', $buyerTenantId)
            ->where('supplier_tenant_id', $supplierTenantId)
            ->whereIn('status', [
                PurchaseOrderStatus::DRAFT,
                PurchaseOrderStatus::SUBMITTED,
                PurchaseOrderStatus::APPROVED,
                PurchaseOrderStatus::PROCESSING,
                PurchaseOrderStatus::SHIPPED,
                PurchaseOrderStatus::PARTIALLY_RECEIVED,
                PurchaseOrderStatus::RECEIVED,
            ])
            ->where(function ($query) {
                $query->where('payment_status', '!=', PurchaseOrderPaymentStatus::PAID)
                    ->orWhereNull('payment_status');
            })
            ->lockForUpdate();

        if ($excludePoId) {
            $query->where('id', '!=', $excludePoId);
        }

        $unpaidPOs = $query->get();

        $totalOutstanding = 0;
        foreach ($unpaidPOs as $po) {
            $totalAmount = $po->total_amount ?? 0;
            $paidAmount = $po->payments()->sum('amount');
            $totalOutstanding += ($totalAmount - $paidAmount);
        }

        return $totalOutstanding;
    }

    /**
     * Reserve stock at supplier's inventory for a purchase order.
     * Called when PO is submitted to ensure stock availability.
     */
    protected function reserveSupplierStock(PurchaseOrder $po, User $user): void
    {
        foreach ($po->items as $item) {
            $variant = $item->productVariant;

            $location = $variant->inventoryLocations()
                ->where('location_type', Shop::class)
                ->whereHas('location', fn ($q) => $q->where('tenant_id', $po->supplier_tenant_id))
                ->where('quantity', '>=', $item->quantity)
                ->lockForUpdate()
                ->orderBy('quantity', 'desc')
                ->first();

            if (! $location) {
                throw new \Exception(
                    "Insufficient stock for {$variant->sku}. Required: {$item->quantity}"
                );
            }

            $availableQty = $location->quantity - $location->reserved_quantity;
            if ($availableQty < $item->quantity) {
                throw new \Exception(
                    "Insufficient available stock for {$variant->sku}. Available: {$availableQty}, Required: {$item->quantity}"
                );
            }

            $location->increment('reserved_quantity', $item->quantity);

            $this->stockMovementService->recordMovement([
                'tenant_id' => $po->supplier_tenant_id,
                'shop_id' => $location->location_id,
                'product_variant_id' => $variant->id,
                'purchase_order_id' => $po->id,
                'type' => StockMovementType::PURCHASE_ORDER_RESERVED,
                'quantity' => 0,
                'quantity_before' => $location->quantity,
                'quantity_after' => $location->quantity,
                'reference_number' => $po->po_number,
                'reason' => "Stock reserved for PO #{$po->po_number} to {$po->buyerTenant->name}",
                'created_by' => $user->id,
            ]);
        }
    }

    /**
     * Release stock reservation when a PO is cancelled.
     */
    protected function releaseStockReservation(PurchaseOrder $po): void
    {
        if (! in_array($po->status, [PurchaseOrderStatus::SUBMITTED, PurchaseOrderStatus::APPROVED, PurchaseOrderStatus::PROCESSING])) {
            return;
        }

        foreach ($po->items as $item) {
            $variant = $item->productVariant;

            $location = $variant->inventoryLocations()
                ->where('location_type', Shop::class)
                ->whereHas('location', fn ($q) => $q->where('tenant_id', $po->supplier_tenant_id))
                ->lockForUpdate()
                ->first();

            if ($location && $location->reserved_quantity >= $item->quantity) {
                $location->decrement('reserved_quantity', $item->quantity);

                $this->stockMovementService->recordMovement([
                    'tenant_id' => $po->supplier_tenant_id,
                    'shop_id' => $location->location_id,
                    'product_variant_id' => $variant->id,
                    'purchase_order_id' => $po->id,
                    'type' => StockMovementType::PURCHASE_ORDER_RESERVATION_RELEASED,
                    'quantity' => 0,
                    'quantity_before' => $location->quantity,
                    'quantity_after' => $location->quantity,
                    'reference_number' => $po->po_number,
                    'reason' => "Reservation released for cancelled PO #{$po->po_number}",
                    'created_by' => auth()->id(),
                ]);
            }
        }
    }

    /**
     * Validate all items have sufficient reserved stock before shipping.
     * Returns array of inventory locations keyed by item ID.
     */
    protected function validateStockForShipping(PurchaseOrder $po): array
    {
        $locations = [];

        foreach ($po->items as $item) {
            $variant = $item->productVariant;

            $location = $variant->inventoryLocations()
                ->where('location_type', Shop::class)
                ->whereHas('location', fn ($q) => $q->where('tenant_id', $po->supplier_tenant_id))
                ->lockForUpdate()
                ->first();

            if (! $location) {
                throw new \Exception(
                    "Inventory location not found for variant {$variant->sku}"
                );
            }

            if ($location->quantity < $item->quantity) {
                throw new \Exception(
                    "Insufficient stock for {$variant->sku}. Available: {$location->quantity}, Required: {$item->quantity}"
                );
            }

            $locations[$item->id] = $location;
        }

        return $locations;
    }
}
