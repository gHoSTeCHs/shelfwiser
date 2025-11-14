<?php

namespace App\Services;

use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Models\ProductVariant;
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
                'buyer_notes' => $data['buyer_notes'] ?? null,
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
        $catalogItem = SupplierCatalogItem::findOrFail($data['catalog_item_id']);
        $connection = $this->connectionService->getConnection($po->buyerTenant, $po->supplierTenant);

        $quantity = $data['quantity'];
        $unitPrice = $data['unit_price'] ?? $catalogItem->getPriceForQuantity($quantity, $connection?->id);

        return PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'product_variant_id' => $data['product_variant_id'],
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

    public function shipPurchaseOrder(PurchaseOrder $po, User $user): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user) {
            if (! $po->status->canShip()) {
                throw new \Exception('PO cannot be shipped in current status');
            }

            foreach ($po->items as $item) {
                $this->decreaseSupplierStock($item, $user);
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

    public function receivePurchaseOrder(PurchaseOrder $po, User $user, array $data = []): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $user, $data) {
            if (! $po->status->canReceive()) {
                throw new \Exception('PO cannot be received in current status');
            }

            foreach ($po->items as $item) {
                $receivedQty = $data['items'][$item->id]['received_quantity'] ?? $item->quantity;
                $this->increaseBuyerStock($item, $receivedQty, $user);

                $item->update(['received_quantity' => $receivedQty]);
            }

            $po->update([
                'status' => PurchaseOrderStatus::RECEIVED,
                'received_at' => now(),
                'received_by' => $user->id,
                'actual_delivery_date' => $data['actual_delivery_date'] ?? now()->toDateString(),
            ]);

            Log::info('Purchase order received', [
                'po_id' => $po->id,
                'po_number' => $po->po_number,
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

    public function cancelPurchaseOrder(PurchaseOrder $po, string $reason = null): PurchaseOrder
    {
        return DB::transaction(function () use ($po, $reason) {
            if (! $po->status->canCancel()) {
                throw new \Exception('PO cannot be cancelled in current status');
            }

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

    protected function decreaseSupplierStock(PurchaseOrderItem $item, User $user): void
    {
        $variant = $item->productVariant;
        $po = $item->purchaseOrder;

        $location = $variant->inventoryLocations()
            ->where('location_type', Shop::class)
            ->where('location_id', $po->supplierTenant->shops()->first()->id)
            ->first();

        if (! $location) {
            throw new \Exception("Supplier inventory location not found for variant {$variant->sku}");
        }

        $quantityBefore = $location->quantity;
        $location->decrement('quantity', $item->quantity);

        $this->stockMovementService->recordMovement([
            'tenant_id' => $po->supplier_tenant_id,
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

    protected function calculatePaymentDueDate(string $paymentTerms): ?\DateTime
    {
        if (preg_match('/Net (\d+)/', $paymentTerms, $matches)) {
            $days = (int) $matches[1];
            return now()->addDays($days)->toDateTime();
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
}
