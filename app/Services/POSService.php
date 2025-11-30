<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;

class POSService
{
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
     * Create quick sale order from POS
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
            $subtotal = 0;
            $taxAmount = 0;

            $order = Order::create([
                'tenant_id' => auth()->user()->tenant_id,
                'shop_id' => $shop->id,
                'customer_id' => $customerId,
                'status' => 'completed',
                'payment_status' => 'paid',
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
            ]);

            foreach ($items as $item) {
                $variant = ProductVariant::findOrFail($item['variant_id']);
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'] ?? $variant->price;
                $lineTotal = $unitPrice * $quantity;

                $lineTax = 0;
                if (($shop->vat_enabled ?? false) && ($variant->product->is_taxable ?? false)) {
                    $lineTax = $lineTotal * (($shop->vat_rate ?? 0) / 100);
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $variant->id,
                    'product_packaging_type_id' => $item['packaging_type_id'] ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $item['discount_amount'] ?? 0,
                    'tax_amount' => $lineTax,
                    'total_amount' => $lineTotal + $lineTax - ($item['discount_amount'] ?? 0),
                ]);

                $subtotal += $lineTotal;
                $taxAmount += $lineTax;

                if ($variant->track_stock) {
                    $variant->decrement('stock_quantity', $quantity);

                    app(StockMovementService::class)->recordMovement([
                        'tenant_id' => auth()->user()->tenant_id,
                        'shop_id' => $shop->id,
                        'product_variant_id' => $variant->id,
                        'type' => StockMovementType::SALE,
                        'quantity' => -$quantity,
                        'reference_number' => "POS-{$order->order_number}",
                        'notes' => "POS Sale - Order {$order->order_number}",
                        'created_by' => auth()->id(),
                    ]);
                }
            }

            $totalAmount = $subtotal + $taxAmount - ($options['discount_amount'] ?? 0);

            $order->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'paid_amount' => $totalAmount,
            ]);

            // Create payment record for audit trail
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
     * Get quick customer search results
     */
    public function searchCustomers(string $query, int $limit = 10)
    {
        return Customer::where('tenant_id', auth()->user()->tenant_id)
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            })
            ->limit($limit)
            ->get(['id', 'first_name', 'last_name', 'email', 'phone']);
    }

    /**
     * Get POS session summary
     */
    public function getSessionSummary(Shop $shop, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Order::where('tenant_id', auth()->user()->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('created_by', auth()->id())
            ->where('status', 'completed');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
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
}
