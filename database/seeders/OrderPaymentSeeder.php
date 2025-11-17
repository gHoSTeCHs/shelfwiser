<?php

namespace Database\Seeders;

use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderPaymentSeeder extends Seeder
{
    /**
     * Seed payment records for existing orders
     *
     * Creates realistic payment scenarios including:
     * - Full payments (single method)
     * - Partial payments (single method)
     * - Split payments (multiple methods on same order)
     */
    public function run(): void
    {
        $orders = Order::with('shop')
            ->whereNotNull('customer_id')
            ->where('payment_status', '!=', PaymentStatus::REFUNDED)
            ->get();

        foreach ($orders as $order) {
            $staffMember = $this->getRandomStaff($order);

            if (!$staffMember) {
                continue;
            }

            $this->createPaymentsForOrder($order, $staffMember);
        }
    }

    /**
     * Create payment records for an order based on its payment status
     */
    protected function createPaymentsForOrder(Order $order, User $staffMember): void
    {
        $paymentScenario = rand(1, 100);

        if ($order->payment_status === PaymentStatus::PAID) {
            if ($paymentScenario <= 70) {
                $this->createFullPayment($order, $staffMember);
            } else {
                $this->createSplitPayment($order, $staffMember);
            }
        } elseif ($order->payment_status === PaymentStatus::PARTIAL) {
            $this->createPartialPayment($order, $staffMember);
        }
    }

    /**
     * Create a single full payment record
     */
    protected function createFullPayment(Order $order, User $staffMember): void
    {
        OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $order->total_amount,
            'payment_method' => $this->getRandomPaymentMethod(),
            'payment_date' => $order->confirmed_at ?? $order->created_at,
            'reference_number' => $this->generateReferenceNumber(),
            'recorded_by' => $staffMember->id,
        ]);
    }

    /**
     * Create multiple payment records that add up to the full amount (split payment)
     * Example: ₦10,000 order paid as ₦6,000 transfer + ₦4,000 cash
     */
    protected function createSplitPayment(Order $order, User $staffMember): void
    {
        $totalAmount = (float) $order->total_amount;
        $firstPaymentPercentage = rand(40, 70) / 100;
        $firstPaymentAmount = round($totalAmount * $firstPaymentPercentage, 2);
        $secondPaymentAmount = round($totalAmount - $firstPaymentAmount, 2);

        $paymentDate = $order->confirmed_at ?? $order->created_at;

        OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $firstPaymentAmount,
            'payment_method' => 'bank_transfer',
            'payment_date' => $paymentDate,
            'reference_number' => $this->generateReferenceNumber(),
            'notes' => 'First payment (bank transfer)',
            'recorded_by' => $staffMember->id,
        ]);

        OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $secondPaymentAmount,
            'payment_method' => 'cash',
            'payment_date' => $paymentDate->copy()->addMinutes(rand(5, 30)),
            'reference_number' => null,
            'notes' => 'Balance payment (cash)',
            'recorded_by' => $staffMember->id,
        ]);
    }

    /**
     * Create partial payment (less than total amount)
     */
    protected function createPartialPayment(Order $order, User $staffMember): void
    {
        $totalAmount = (float) $order->total_amount;
        $paidPercentage = rand(30, 80) / 100;
        $paidAmount = round($totalAmount * $paidPercentage, 2);

        OrderPayment::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'amount' => $paidAmount,
            'payment_method' => $this->getRandomPaymentMethod(),
            'payment_date' => $order->confirmed_at ?? $order->created_at,
            'reference_number' => $this->generateReferenceNumber(),
            'notes' => 'Partial payment - balance to be paid later',
            'recorded_by' => $staffMember->id,
        ]);
    }

    /**
     * Get a random payment method
     */
    protected function getRandomPaymentMethod(): string
    {
        $methods = ['cash', 'card', 'bank_transfer', 'mobile_money'];
        return $methods[array_rand($methods)];
    }

    /**
     * Generate a realistic reference number for bank transfers
     */
    protected function generateReferenceNumber(): ?string
    {
        return rand(0, 1) ? 'TRF-' . strtoupper(substr(md5(rand()), 0, 12)) : null;
    }

    /**
     * Get a random staff member from the order's shop
     */
    protected function getRandomStaff(Order $order): ?User
    {
        $users = User::where('tenant_id', $order->tenant_id)
            ->where('is_active', true)
            ->whereHas('shops', function ($query) use ($order) {
                $query->where('shops.id', $order->shop_id);
            })
            ->get();

        return $users->isNotEmpty() ? $users->random() : null;
    }
}
