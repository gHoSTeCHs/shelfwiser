<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class StorefrontSeeder extends Seeder
{
    private array $dailyCounters = [];

    /**
     * Seed storefront-specific data: carts and customer orders.
     */
    public function run(): void
    {
        $shops = Shop::with(['products.variants.packagingTypes'])
            ->where('storefront_enabled', true)
            ->get();

        foreach ($shops as $shop) {
            $this->createCartsForShop($shop);
            $this->createCustomerOrdersForShop($shop);
        }
    }

    protected function createCartsForShop(Shop $shop): void
    {
        $customers = Customer::where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->limit(3)
            ->get();

        $variants = $this->getAvailableVariants($shop);

        if ($variants->isEmpty()) {
            return;
        }

        foreach ($customers as $customer) {
            if (rand(1, 100) <= 40) {
                $this->createCartForCustomer($shop, $customer, $variants);
            }
        }

        for ($i = 0; $i < rand(1, 3); $i++) {
            $this->createGuestCart($shop, $variants);
        }
    }

    protected function createCartForCustomer(Shop $shop, Customer $customer, $variants): void
    {
        $existingCart = Cart::where('shop_id', $shop->id)
            ->where('customer_id', $customer->id)
            ->first();

        if ($existingCart) {
            return;
        }

        $cart = Cart::create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'expires_at' => now()->addDays(30),
        ]);

        $this->addItemsToCart($cart, $variants);
    }

    protected function createGuestCart(Shop $shop, $variants): void
    {
        $sessionId = 'seed_guest_'.uniqid();

        $cart = Cart::create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'session_id' => $sessionId,
            'expires_at' => now()->addDays(7),
        ]);

        $this->addItemsToCart($cart, $variants);
    }

    protected function addItemsToCart(Cart $cart, $variants): void
    {
        $itemCount = rand(1, 4);
        $selectedVariants = $variants->random(min($itemCount, $variants->count()));

        foreach ($selectedVariants as $variant) {
            $packagingTypes = $variant->packagingTypes;
            if ($packagingTypes->isEmpty()) {
                continue;
            }

            $packaging = $packagingTypes->first();

            CartItem::create([
                'cart_id' => $cart->id,
                'tenant_id' => $cart->tenant_id,
                'product_variant_id' => $variant->id,
                'product_packaging_type_id' => $packaging->id,
                'sellable_type' => ProductVariant::class,
                'sellable_id' => $variant->id,
                'quantity' => rand(1, 3),
                'price' => $packaging->price,
            ]);
        }
    }

    protected function createCustomerOrdersForShop(Shop $shop): void
    {
        $customers = Customer::where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->get();

        $variants = $this->getAvailableVariants($shop);

        if ($variants->isEmpty() || $customers->isEmpty()) {
            return;
        }

        foreach ($customers as $customer) {
            $orderCount = rand(0, 3);
            for ($i = 0; $i < $orderCount; $i++) {
                $this->createCustomerOrder($shop, $customer, $variants);
            }
        }
    }

    protected function createCustomerOrder(Shop $shop, Customer $customer, $variants): void
    {
        $status = $this->getRandomStatus();
        $paymentStatus = $this->getRandomPaymentStatus($status);

        $createdAt = now()->subDays(rand(1, 60));
        $dateKey = $createdAt->format('Y-m-d');

        if (! isset($this->dailyCounters[$dateKey])) {
            $lastOrder = Order::whereDate('created_at', $createdAt)->latest('id')->first();
            $this->dailyCounters[$dateKey] = $lastOrder ? (int) substr($lastOrder->order_number, -4) : 0;
        }

        $this->dailyCounters[$dateKey]++;
        $sequence = $this->dailyCounters[$dateKey];
        $orderNumber = sprintf('ORD-%s-%04d', $createdAt->format('Ymd'), $sequence);

        $address = $customer->addresses()->first();
        $shippingAddress = $address ? [
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'phone' => $customer->phone,
            'address_line_1' => $address->address_line_1,
            'city' => $address->city,
            'state' => $address->state,
            'country' => $address->country,
        ] : [
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'phone' => $customer->phone,
            'address_line_1' => '123 Default Street',
            'city' => 'Lagos',
            'state' => 'Lagos',
            'country' => 'Nigeria',
        ];

        $order = Order::create([
            'tenant_id' => $shop->tenant_id,
            'shop_id' => $shop->id,
            'customer_id' => $customer->id,
            'order_number' => $orderNumber,
            'order_type' => OrderType::CUSTOMER->value,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'payment_method' => 'cash_on_delivery',
            'subtotal' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'shipping_cost' => rand(500, 2000),
            'total_amount' => 0,
            'shipping_address' => json_encode($shippingAddress),
            'billing_address' => json_encode($shippingAddress),
            'customer_notes' => rand(1, 10) > 7 ? 'Please deliver between 9am and 5pm' : null,
            'confirmed_at' => in_array($status, [
                OrderStatus::CONFIRMED->value,
                OrderStatus::PROCESSING->value,
                OrderStatus::PACKED->value,
                OrderStatus::SHIPPED->value,
                OrderStatus::DELIVERED->value,
            ]) ? $createdAt->copy()->addMinutes(rand(10, 60)) : null,
            'shipped_at' => in_array($status, [
                OrderStatus::SHIPPED->value,
                OrderStatus::DELIVERED->value,
            ]) ? $createdAt->copy()->addDays(rand(1, 3)) : null,
            'delivered_at' => $status === OrderStatus::DELIVERED->value
                ? $createdAt->copy()->addDays(rand(2, 7))
                : null,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        $this->createOrderItems($order, $variants);

        $order->refresh();
        $order->calculateTotals();
        $order->save();
    }

    protected function createOrderItems(Order $order, $variants): void
    {
        $itemCount = rand(1, 4);
        $selectedVariants = $variants->random(min($itemCount, $variants->count()));

        foreach ($selectedVariants as $variant) {
            $packagingTypes = $variant->packagingTypes;
            if ($packagingTypes->isEmpty()) {
                continue;
            }

            $packaging = $packagingTypes->first();
            $quantity = rand(1, 3);
            $unitPrice = (float) $packaging->price;

            OrderItem::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'product_variant_id' => $variant->id,
                'product_packaging_type_id' => $packaging->id,
                'sellable_type' => ProductVariant::class,
                'sellable_id' => $variant->id,
                'packaging_description' => $packaging->display_name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total_amount' => $unitPrice * $quantity,
            ]);
        }
    }

    protected function getAvailableVariants(Shop $shop)
    {
        return ProductVariant::query()
            ->whereHas('product', function ($query) use ($shop) {
                $query->where('shop_id', $shop->id)
                    ->where('is_active', true);
            })
            ->where('is_available_online', true)
            ->where('is_active', true)
            ->with('packagingTypes')
            ->get();
    }

    protected function getRandomStatus(): string
    {
        $statuses = [
            OrderStatus::PENDING->value => 20,
            OrderStatus::CONFIRMED->value => 15,
            OrderStatus::PROCESSING->value => 10,
            OrderStatus::SHIPPED->value => 10,
            OrderStatus::DELIVERED->value => 40,
            OrderStatus::CANCELLED->value => 5,
        ];

        $rand = rand(1, 100);
        $cumulative = 0;

        foreach ($statuses as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $status;
            }
        }

        return OrderStatus::DELIVERED->value;
    }

    protected function getRandomPaymentStatus(string $orderStatus): string
    {
        if ($orderStatus === OrderStatus::CANCELLED->value) {
            return rand(0, 1) ? PaymentStatus::UNPAID->value : PaymentStatus::REFUNDED->value;
        }

        if ($orderStatus === OrderStatus::DELIVERED->value) {
            return PaymentStatus::PAID->value;
        }

        if ($orderStatus === OrderStatus::PENDING->value) {
            return PaymentStatus::UNPAID->value;
        }

        $statuses = [PaymentStatus::UNPAID->value, PaymentStatus::PARTIAL->value, PaymentStatus::PAID->value];

        return $statuses[array_rand($statuses)];
    }
}
