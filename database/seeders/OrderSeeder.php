<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductPackagingType;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    private array $dailyCounters = [];

    public function run(): void
    {
        $shops = Shop::with(['products.variants.packagingTypes'])->get();

        foreach ($shops as $shop) {
            $orderCount = rand(8, 15);

            for ($i = 0; $i < $orderCount; $i++) {
                $this->createOrder($shop);
            }
        }
    }

    protected function createOrder(Shop $shop): void
    {
        $status = $this->getRandomStatus();
        $paymentStatus = $this->getRandomPaymentStatus($status);
        $createdBy = $this->getRandomStaff($shop);
        $customer = $this->getRandomCustomer($shop);

        $createdAt = now()->subDays(rand(1, 90));
        $dateKey = $createdAt->format('Y-m-d');

        if (! isset($this->dailyCounters[$dateKey])) {
            $lastOrder = Order::whereDate('created_at', $createdAt)->latest('id')->first();
            $this->dailyCounters[$dateKey] = $lastOrder ? (int) substr($lastOrder->order_number, -4) : 0;
        }

        $this->dailyCounters[$dateKey]++;
        $sequence = $this->dailyCounters[$dateKey];
        $orderNumber = sprintf('ORD-%s-%04d', $createdAt->format('Ymd'), $sequence);

        $order = Order::create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'customer_id' => $customer?->id,
            'order_number' => $orderNumber,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'payment_method' => $this->getRandomPaymentMethod(),
            'subtotal' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'shipping_cost' => $status === OrderStatus::SHIPPED || $status === OrderStatus::DELIVERED ? rand(0, 5000) : 0,
            'total_amount' => 0,
            'customer_notes' => null,
            'internal_notes' => null,
            'confirmed_at' => in_array($status, [OrderStatus::CONFIRMED, OrderStatus::PROCESSING, OrderStatus::PACKED, OrderStatus::SHIPPED, OrderStatus::DELIVERED])
                ? $createdAt->copy()->addMinutes(rand(10, 60))
                : null,
            'shipped_at' => in_array($status, [OrderStatus::SHIPPED, OrderStatus::DELIVERED])
                ? $createdAt->copy()->addDays(rand(1, 3))
                : null,
            'delivered_at' => $status === OrderStatus::DELIVERED
                ? $createdAt->copy()->addDays(rand(2, 7))
                : null,
            'created_by' => $createdBy?->id,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        $itemCount = rand(1, 5);
        $this->createOrderItems($order, $shop, $itemCount);

        $order->refresh();
        $order->calculateTotals();
        $order->save();
    }

    protected function createOrderItems(Order $order, Shop $shop, int $count): void
    {
        $availableVariants = $this->getAvailableVariants($shop);

        if ($availableVariants->isEmpty()) {
            return;
        }

        $selectedVariants = $availableVariants->random(min($count, $availableVariants->count()));

        foreach ($selectedVariants as $variant) {
            $packagingTypes = $variant->packagingTypes;

            if ($packagingTypes->isEmpty()) {
                continue;
            }

            $packaging = $packagingTypes->random();

            $quantity = $this->determineQuantity($packaging);
            $unitPrice = (float) $packaging->price;
            $discountAmount = $this->calculateDiscountAmount($unitPrice, $quantity);
            $taxAmount = $this->calculateTaxAmount($unitPrice, $quantity, $discountAmount);

            OrderItem::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'product_variant_id' => $variant->id,
                'product_packaging_type_id' => $packaging->id,
                'packaging_description' => $packaging->display_name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => 0,
            ]);
        }
    }

    protected function getAvailableVariants(Shop $shop)
    {
        return ProductVariant::query()
            ->whereHas('product', function ($query) use ($shop) {
                $query->where('shop_id', $shop->id);
            })
            ->with('packagingTypes')
            ->get();
    }

    protected function getRandomStatus(): OrderStatus
    {
        $statuses = [
            OrderStatus::PENDING->value => 15,
            OrderStatus::CONFIRMED->value => 10,
            OrderStatus::PROCESSING->value => 10,
            OrderStatus::PACKED->value => 5,
            OrderStatus::SHIPPED->value => 5,
            OrderStatus::DELIVERED->value => 50,
            OrderStatus::CANCELLED->value => 5,
        ];

        $rand = rand(1, 100);
        $cumulative = 0;

        foreach ($statuses as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return OrderStatus::from($status);
            }
        }

        return OrderStatus::DELIVERED;
    }

    protected function getRandomPaymentStatus(OrderStatus $orderStatus): PaymentStatus
    {
        if ($orderStatus === OrderStatus::CANCELLED) {
            return rand(0, 1) ? PaymentStatus::UNPAID : PaymentStatus::REFUNDED;
        }

        if ($orderStatus === OrderStatus::DELIVERED) {
            return PaymentStatus::PAID;
        }

        if ($orderStatus === OrderStatus::PENDING) {
            return rand(0, 2) ? PaymentStatus::UNPAID : PaymentStatus::PARTIAL;
        }

        $statuses = [PaymentStatus::UNPAID, PaymentStatus::PARTIAL, PaymentStatus::PAID];

        return $statuses[array_rand($statuses)];
    }

    protected function getRandomPaymentMethod(): string
    {
        $methods = ['cash', 'card', 'bank_transfer', 'mobile_money'];

        return $methods[array_rand($methods)];
    }

    protected function getRandomStaff(Shop $shop): ?User
    {
        $users = User::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->whereHas('shops', function ($query) use ($shop) {
                $query->where('shops.id', $shop->id);
            })
            ->get();

        return $users->isNotEmpty() ? $users->random() : null;
    }

    /**
     * Get a random customer for the shop's tenant (70% chance) or null for walk-in customer (30% chance)
     */
    protected function getRandomCustomer(Shop $shop): ?Customer
    {
        if (rand(1, 100) <= 30) {
            return null;
        }

        $customers = Customer::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->get();

        return $customers->isNotEmpty() ? $customers->random() : null;
    }

    protected function determineQuantity(ProductPackagingType $packaging): int
    {
        if ($packaging->units_per_package >= 24) {
            return rand(1, 5);
        }

        if ($packaging->units_per_package >= 6) {
            return rand(1, 10);
        }

        return rand(1, 20);
    }

    protected function calculateDiscountAmount(float $unitPrice, int $quantity): float
    {
        $shouldApplyDiscount = rand(1, 100) <= 20;

        if (! $shouldApplyDiscount) {
            return 0;
        }

        $subtotal = $unitPrice * $quantity;
        $discountPercentage = rand(5, 15) / 100;

        return round($subtotal * $discountPercentage, 2);
    }

    protected function calculateTaxAmount(float $unitPrice, int $quantity, float $discountAmount): float
    {
        $shouldApplyTax = rand(1, 100) <= 30;

        if (! $shouldApplyTax) {
            return 0;
        }

        $subtotal = ($unitPrice * $quantity) - $discountAmount;
        $taxRate = 0.075;

        return round($subtotal * $taxRate, 2);
    }
}
