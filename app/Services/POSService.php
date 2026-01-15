<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\InventoryLocation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\Shop;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class POSService
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

    /**
     * Search products for POS by SKU, barcode, or name
     */
    public function searchProducts(Shop $shop, string $query, int $limit = 20)
    {
        return ProductVariant::query()
            ->whereHas('product', function ($q) use ($shop) {
                $q->where('tenant_id', auth()->user()->tenant_id)
                    ->where('shop_id', $shop->id);
            })
            ->where(function ($q) use ($query) {
                $q->where('sku', 'like', "%{$query}%")
                    ->orWhere('barcode', 'like', "%{$query}%")
                    ->orWhereHas('product', function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%");
                    });
            })
            ->with(['product', 'packagingTypes'])
            ->limit($limit)
            ->get();
    }

    /**
     * Create quick sale order from POS.
     * Uses pessimistic locking to prevent race conditions on stock updates.
     *
     * @throws \Exception If any item has insufficient stock
     */
    public function createQuickSale(
        Shop $shop,
        array $items,
        ?int $customerId = null,
        string $paymentMethod = 'cash',
        float $amountTendered = 0,
        array $options = []
    ): Order {
        return DB::transaction(function () use ($shop, $items, $customerId, $paymentMethod, $amountTendered, $options) {
            $variantIds = collect($items)->pluck('variant_id')->toArray();
            $variants = ProductVariant::with('product')->whereIn('id', $variantIds)->get()->keyBy('id');

            $locations = InventoryLocation::where('location_type', Shop::class)
                ->where('location_id', $shop->id)
                ->whereIn('product_variant_id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_variant_id');

            $itemQuantities = collect($items)->keyBy('variant_id');
            foreach ($items as $item) {
                $variant = $variants->get($item['variant_id']);
                if (! $variant) {
                    throw new \Exception("Product variant {$item['variant_id']} not found");
                }

                $this->validateStockAvailability($variant, $item['quantity'], $shop->id);
            }

            $subtotal = 0;
            $taxAmount = 0;

            $order = Order::create([
                'tenant_id' => auth()->user()->tenant_id,
                'shop_id' => $shop->id,
                'customer_id' => $customerId,
                'offline_id' => $options['offline_id'] ?? null,
                'order_type' => OrderType::POS->value,
                'status' => OrderStatus::DELIVERED->value,
                'payment_status' => PaymentStatus::PAID->value,
                'payment_method' => $paymentMethod,
                'subtotal' => 0,
                'tax_amount' => 0,
                'discount_amount' => $options['discount_amount'] ?? 0,
                'shipping_cost' => 0,
                'total_amount' => 0,
                'paid_amount' => 0,
                'customer_notes' => $options['notes'] ?? null,
                'created_by' => auth()->id(),
                'confirmed_at' => now(),
                'delivered_at' => now(),
            ]);

            $totalLineDiscounts = 0;

            foreach ($items as $item) {
                $variant = $variants->get($item['variant_id']);
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'] ?? $variant->price;
                $lineTotal = $unitPrice * $quantity;
                $lineDiscount = $item['discount_amount'] ?? 0;
                $taxableAmount = $lineTotal - $lineDiscount;

                $lineTax = 0;
                if (($shop->vat_enabled ?? false) && ($variant->product->is_taxable ?? false)) {
                    $lineTax = $taxableAmount * (($shop->vat_rate ?? 0) / 100);
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $item['packaging_type_id'] ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $lineDiscount,
                    'tax_amount' => $lineTax,
                    'total_amount' => $taxableAmount + $lineTax,
                ]);

                $subtotal += $lineTotal;
                $taxAmount += $lineTax;
                $totalLineDiscounts += $lineDiscount;

                if ($variant->product->track_stock ?? true) {
                    $location = $locations->get($variant->id);

                    if (! $location) {
                        $location = InventoryLocation::create([
                            'product_variant_id' => $variant->id,
                            'location_type' => Shop::class,
                            'location_id' => $shop->id,
                            'quantity' => 0,
                            'reserved_quantity' => 0,
                        ]);
                    }

                    $packagingType = isset($item['packaging_type_id'])
                        ? ProductPackagingType::find($item['packaging_type_id'])
                        : null;

                    $this->stockMovementService->recordSale(
                        variant: $variant,
                        location: $location,
                        quantity: $quantity,
                        packagingType: $packagingType,
                        user: auth()->user(),
                        referenceNumber: "POS-{$order->order_number}",
                        notes: "POS Sale - Order {$order->order_number}"
                    );
                }
            }

            $orderDiscount = $options['discount_amount'] ?? 0;
            $totalDiscount = $totalLineDiscounts + $orderDiscount;
            $totalAmount = $subtotal - $totalLineDiscounts + $taxAmount - $orderDiscount;

            $order->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $totalDiscount,
                'total_amount' => $totalAmount,
                'paid_amount' => $totalAmount,
            ]);

            $paymentNotes = null;
            if ($paymentMethod === 'cash' && $amountTendered > 0) {
                $change = $amountTendered - $totalAmount;
                $currencySymbol = $shop->currency_symbol ?? '$';
                $paymentNotes = "Cash tendered: {$currencySymbol}".number_format($amountTendered, 2).
                               ", Change: {$currencySymbol}".number_format($change, 2);

                $order->update([
                    'internal_notes' => $paymentNotes,
                ]);
            }

            OrderPayment::create([
                'order_id' => $order->id,
                'tenant_id' => $order->tenant_id,
                'shop_id' => $order->shop_id,
                'amount' => $totalAmount,
                'payment_method' => $paymentMethod,
                'payment_date' => now(),
                'reference_number' => $options['reference_number'] ?? null,
                'notes' => $paymentNotes ?? "POS payment via {$paymentMethod}",
                'recorded_by' => auth()->id(),
            ]);

            return $order->load(['items.productVariant.product', 'customer', 'shop']);
        });
    }

    /**
     * Get quick customer search results.
     * High-level roles (Owner, GM) can see all customers in tenant.
     * Other roles can only see customers associated with the current shop.
     */
    public function searchCustomers(string $query, Shop $shop, int $limit = 10)
    {
        $user = auth()->user();
        $customerQuery = Customer::where('tenant_id', $user->tenant_id)
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            });

        if (! $user->role->canAccessMultipleStores()) {
            $customerQuery->forShop($shop->id);
        }

        return $customerQuery
            ->limit($limit)
            ->get(['id', 'first_name', 'last_name', 'email', 'phone']);
    }

    /**
     * Get POS session summary.
     * Dates are parsed with Carbon for consistent timezone handling.
     */
    public function getSessionSummary(Shop $shop, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Order::where('tenant_id', auth()->user()->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('created_by', auth()->id())
            ->where('order_type', OrderType::POS)
            ->where('status', OrderStatus::DELIVERED);

        if ($startDate) {
            $parsedStart = Carbon::parse($startDate)->startOfDay();
            $query->where('created_at', '>=', $parsedStart);
        }
        if ($endDate) {
            $parsedEnd = Carbon::parse($endDate)->endOfDay();
            $query->where('created_at', '<=', $parsedEnd);
        }

        $orders = $query->get();

        return [
            'total_sales' => $orders->count(),
            'total_revenue' => $orders->sum('total_amount'),
            'total_tax' => $orders->sum('tax_amount'),
            'cash_sales' => $orders->where('payment_method', 'cash')->sum('total_amount'),
            'card_sales' => $orders->where('payment_method', 'card')->sum('total_amount'),
            'mobile_money_sales' => $orders->where('payment_method', 'mobile_money')->sum('total_amount'),
            'orders' => $orders,
        ];
    }

    /**
     * Validate stock availability for a variant.
     * Throws exception if stock is insufficient.
     *
     * @throws \Exception
     */
    private function validateStockAvailability(ProductVariant $variant, int $quantity, ?int $shopId = null): void
    {
        if (! ($variant->product->track_stock ?? true)) {
            return;
        }

        if (! $this->stockMovementService->checkStockAvailability($variant, $quantity, $shopId)) {
            $available = $this->stockMovementService->getAvailableStock($variant, $shopId);
            throw new \Exception(
                "Insufficient stock for {$variant->sku}. Available: {$available}, Requested: {$quantity}"
            );
        }
    }
}
