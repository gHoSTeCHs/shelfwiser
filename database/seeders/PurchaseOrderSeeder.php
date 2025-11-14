<?php

namespace Database\Seeders;

use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderPayment;
use App\Models\Shop;
use App\Models\SupplierCatalogItem;
use App\Models\SupplierConnection;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseOrderSeeder extends Seeder
{
    public function run(): void
    {
        $connections = SupplierConnection::query()
            ->approved()
            ->with(['buyerTenant.shops', 'supplierTenant.supplierProfile.catalogItems.product.variants'])
            ->get();

        foreach ($connections as $connection) {
            // Create 2-6 purchase orders per connection
            $orderCount = rand(2, 6);

            for ($i = 0; $i < $orderCount; $i++) {
                $this->createPurchaseOrder($connection);
            }
        }
    }

    protected function createPurchaseOrder(SupplierConnection $connection): void
    {
        $buyerShops = $connection->buyerTenant->shops;

        if ($buyerShops->isEmpty()) {
            return;
        }

        $shop = $buyerShops->random();
        $status = $this->getRandomStatus();
        $createdAt = now()->subDays(rand(5, 120));

        $createdBy = $this->getRandomBuyerStaff($connection->buyer_tenant_id);

        $purchaseOrder = PurchaseOrder::create([
            'buyer_tenant_id' => $connection->buyer_tenant_id,
            'supplier_tenant_id' => $connection->supplier_tenant_id,
            'shop_id' => $shop->id,
            'po_number' => $this->generatePONumber($connection->buyer_tenant_id),
            'status' => $status,
            'subtotal' => 0,
            'tax_amount' => $this->shouldApplyTax() ? 0 : 0, // Will be calculated after items
            'shipping_amount' => in_array($status, [PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                ? rand(2000, 10000)
                : 0,
            'discount_amount' => 0,
            'total_amount' => 0,
            'expected_delivery_date' => $createdAt->copy()->addDays(rand(7, 21)),
            'actual_delivery_date' => in_array($status, [PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                ? $createdAt->copy()->addDays(rand(5, 15))
                : null,
            'buyer_notes' => $this->getBuyerNotes(),
            'supplier_notes' => $this->getSupplierNotes($status),
            'payment_status' => PurchaseOrderPaymentStatus::PENDING, // Will be updated based on payments
            'paid_amount' => 0,
            'payment_due_date' => $this->getPaymentDueDate($createdAt, $connection),
            'payment_date' => null,
            'payment_method' => null,
            'payment_reference' => null,
            'created_by' => $createdBy?->id,
            'approved_by' => $this->getApprovedBy($status, $connection),
            'shipped_by' => $this->getShippedBy($status, $connection),
            'received_by' => $this->getReceivedBy($status, $connection),
            'submitted_at' => in_array($status, [PurchaseOrderStatus::SUBMITTED, PurchaseOrderStatus::APPROVED, PurchaseOrderStatus::PROCESSING, PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                ? $createdAt->copy()->addMinutes(rand(10, 120))
                : null,
            'approved_at' => in_array($status, [PurchaseOrderStatus::APPROVED, PurchaseOrderStatus::PROCESSING, PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                ? $createdAt->copy()->addHours(rand(2, 48))
                : null,
            'shipped_at' => in_array($status, [PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                ? $createdAt->copy()->addDays(rand(3, 10))
                : null,
            'received_at' => in_array($status, [PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                ? $createdAt->copy()->addDays(rand(5, 15))
                : null,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        // Create items
        $itemCount = rand(2, 8);
        $this->createPurchaseOrderItems($purchaseOrder, $connection, $itemCount);

        // Calculate totals
        $purchaseOrder->refresh();
        $purchaseOrder->calculateTotals();

        // Add tax if applicable
        if ($this->shouldApplyTax()) {
            $purchaseOrder->tax_amount = round($purchaseOrder->subtotal * 0.075, 2);
            $purchaseOrder->total_amount += $purchaseOrder->tax_amount;
            $purchaseOrder->save();
        }

        // Create payments for certain statuses
        if (in_array($status, [PurchaseOrderStatus::PROCESSING, PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])) {
            $this->createPayments($purchaseOrder);
        }

        $purchaseOrder->updatePaymentStatus();
    }

    protected function createPurchaseOrderItems(PurchaseOrder $po, SupplierConnection $connection, int $count): void
    {
        $catalogItems = SupplierCatalogItem::query()
            ->where('supplier_tenant_id', $connection->supplier_tenant_id)
            ->where('is_available', true)
            ->with(['product.variants', 'pricingTiers'])
            ->inRandomOrder()
            ->limit($count * 2) // Get more than needed in case some don't have variants
            ->get();

        $itemsCreated = 0;

        foreach ($catalogItems as $catalogItem) {
            if ($itemsCreated >= $count) {
                break;
            }

            $variant = $catalogItem->product->variants->first();

            if (!$variant) {
                continue;
            }

            $quantity = $this->determineOrderQuantity($catalogItem);
            $unitPrice = $catalogItem->getPriceForQuantity($quantity, $connection->id);

            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_variant_id' => $variant->id,
                'catalog_item_id' => $catalogItem->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $quantity * $unitPrice,
                'received_quantity' => in_array($po->status, [PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])
                    ? $quantity
                    : 0,
                'notes' => null,
            ]);

            $itemsCreated++;
        }
    }

    protected function createPayments(PurchaseOrder $po): void
    {
        $paymentScenario = $this->getPaymentScenario($po->status);

        if ($paymentScenario === 'none') {
            return;
        }

        if ($paymentScenario === 'full') {
            // Single full payment
            $this->createPayment($po, $po->total_amount, $po->created_at->copy()->addDays(rand(1, 7)));
        } elseif ($paymentScenario === 'partial') {
            // Multiple partial payments
            $remainingAmount = $po->total_amount;
            $paymentCount = rand(2, 3);

            for ($i = 0; $i < $paymentCount; $i++) {
                if ($remainingAmount <= 0) {
                    break;
                }

                if ($i === $paymentCount - 1) {
                    // Last payment - pay remaining
                    $amount = $remainingAmount;
                } else {
                    // Partial payment (20-50% of remaining)
                    $percentage = rand(20, 50) / 100;
                    $amount = round($remainingAmount * $percentage, 2);
                }

                $paymentDate = $po->created_at->copy()->addDays(rand($i * 7, ($i + 1) * 14));
                $this->createPayment($po, $amount, $paymentDate);

                $remainingAmount -= $amount;
            }
        }
    }

    protected function createPayment(PurchaseOrder $po, float $amount, $paymentDate): void
    {
        $recordedBy = $this->getRandomBuyerStaff($po->buyer_tenant_id);

        PurchaseOrderPayment::create([
            'purchase_order_id' => $po->id,
            'amount' => $amount,
            'payment_date' => $paymentDate,
            'payment_method' => $this->getRandomPaymentMethod(),
            'reference_number' => $this->generatePaymentReference(),
            'notes' => $this->getPaymentNotes(),
            'recorded_by' => $recordedBy?->id,
        ]);
    }

    protected function getRandomStatus(): PurchaseOrderStatus
    {
        $weights = [
            PurchaseOrderStatus::DRAFT->value => 5,
            PurchaseOrderStatus::SUBMITTED->value => 10,
            PurchaseOrderStatus::APPROVED->value => 10,
            PurchaseOrderStatus::PROCESSING->value => 10,
            PurchaseOrderStatus::SHIPPED->value => 10,
            PurchaseOrderStatus::RECEIVED->value => 15,
            PurchaseOrderStatus::COMPLETED->value => 35,
            PurchaseOrderStatus::CANCELLED->value => 5,
        ];

        $rand = rand(1, 100);
        $cumulative = 0;

        foreach ($weights as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return PurchaseOrderStatus::from($status);
            }
        }

        return PurchaseOrderStatus::COMPLETED;
    }

    protected function getPaymentScenario(PurchaseOrderStatus $status): string
    {
        if ($status === PurchaseOrderStatus::COMPLETED) {
            return 'full'; // Completed orders are fully paid
        }

        if (in_array($status, [PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::SHIPPED])) {
            // Mix of full and partial payments
            return rand(0, 1) ? 'full' : 'partial';
        }

        if ($status === PurchaseOrderStatus::PROCESSING) {
            // Some have partial payments
            return rand(1, 100) <= 40 ? 'partial' : 'none';
        }

        return 'none';
    }

    protected function determineOrderQuantity(SupplierCatalogItem $catalogItem): int
    {
        $minQty = $catalogItem->min_order_quantity;
        $maxMultiplier = rand(1, 5);

        return $minQty * $maxMultiplier;
    }

    protected function getRandomBuyerStaff(int $tenantId): ?User
    {
        return User::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->inRandomOrder()
            ->first();
    }

    protected function getRandomSupplierStaff(int $tenantId): ?User
    {
        return User::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->inRandomOrder()
            ->first();
    }

    protected function getApprovedBy(?PurchaseOrderStatus $status, SupplierConnection $connection): ?int
    {
        if (!in_array($status, [PurchaseOrderStatus::APPROVED, PurchaseOrderStatus::PROCESSING, PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])) {
            return null;
        }

        $user = $this->getRandomSupplierStaff($connection->supplier_tenant_id);
        return $user?->id;
    }

    protected function getShippedBy(?PurchaseOrderStatus $status, SupplierConnection $connection): ?int
    {
        if (!in_array($status, [PurchaseOrderStatus::SHIPPED, PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])) {
            return null;
        }

        $user = $this->getRandomSupplierStaff($connection->supplier_tenant_id);
        return $user?->id;
    }

    protected function getReceivedBy(?PurchaseOrderStatus $status, SupplierConnection $connection): ?int
    {
        if (!in_array($status, [PurchaseOrderStatus::RECEIVED, PurchaseOrderStatus::COMPLETED])) {
            return null;
        }

        $user = $this->getRandomBuyerStaff($connection->buyer_tenant_id);
        return $user?->id;
    }

    protected function getPaymentDueDate($createdAt, SupplierConnection $connection): ?\DateTime
    {
        $paymentTerms = $connection->payment_terms_override ?? $connection->supplierTenant->supplierProfile->payment_terms;

        if (str_contains($paymentTerms, 'Net')) {
            $days = (int) filter_var($paymentTerms, FILTER_SANITIZE_NUMBER_INT);
            return $createdAt->copy()->addDays($days);
        }

        // Default to 30 days
        return $createdAt->copy()->addDays(30);
    }

    protected function shouldApplyTax(): bool
    {
        return rand(1, 100) <= 30; // 30% of orders have tax
    }

    protected function getBuyerNotes(): ?string
    {
        $notes = [
            'Urgent order - please expedite.',
            'Regular restocking order.',
            'First order with this supplier.',
            'Deliver to warehouse loading dock.',
            null,
            null,
            null, // More likely to have no notes
        ];

        return $notes[array_rand($notes)];
    }

    protected function getSupplierNotes(?PurchaseOrderStatus $status): ?string
    {
        if ($status === PurchaseOrderStatus::CANCELLED) {
            $notes = [
                'Cancelled by buyer - out of stock items.',
                'Buyer requested cancellation due to budget constraints.',
                'Duplicate order - cancelled.',
            ];
            return $notes[array_rand($notes)];
        }

        $notes = [
            'Priority customer - expedited processing.',
            'Standard processing time.',
            'Partial shipment - remaining items on backorder.',
            null,
            null,
            null,
        ];

        return $notes[array_rand($notes)];
    }

    protected function getRandomPaymentMethod(): string
    {
        $methods = ['bank_transfer', 'check', 'cash', 'mobile_money', 'card'];
        return $methods[array_rand($methods)];
    }

    protected function generatePONumber(int $tenantId): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -6));

        return "PO-T{$tenantId}-{$date}-{$random}";
    }

    protected function generatePaymentReference(): string
    {
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -8));

        return "PAY-{$date}-{$random}";
    }

    protected function getPaymentNotes(): ?string
    {
        $notes = [
            'Full payment via bank transfer.',
            'Partial payment - balance to follow.',
            'Payment processed successfully.',
            'Early payment discount applied.',
            null,
            null,
        ];

        return $notes[array_rand($notes)];
    }
}
