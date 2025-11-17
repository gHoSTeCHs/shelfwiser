<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Shop;
use Illuminate\Support\Facades\DB;

class CustomerCreditService
{
    /**
     * Charge an order to customer's credit account
     */
    public function chargeOrder(Customer $customer, Order $order): CustomerCreditTransaction
    {
        if (!$customer->canPurchaseOnCredit($order->total_amount)) {
            $available = $customer->availableCredit();
            throw new \Exception(
                $available !== null 
                    ? "Credit limit exceeded. Available credit: ₦" . number_format($available, 2)
                    : "Cannot charge order to credit"
            );
        }

        return DB::transaction(function () use ($customer, $order) {
            $transaction = CustomerCreditTransaction::create([
                'customer_id' => $customer->id,
                'order_id' => $order->id,
                'tenant_id' => $customer->tenant_id,
                'shop_id' => $order->shop_id,
                'type' => 'charge',
                'amount' => $order->total_amount,
                'balance_before' => $customer->account_balance,
                'balance_after' => $customer->account_balance + $order->total_amount,
                'description' => "Order {$order->order_number} charged to account",
                'recorded_by' => auth()->id(),
            ]);

            $customer->account_balance += $order->total_amount;
            $customer->total_purchases += $order->total_amount;
            $customer->last_purchase_at = now();
            $customer->save();

            return $transaction;
        });
    }

    /**
     * Record payment on customer's account
     */
    public function recordPayment(
        Customer $customer,
        float $amount,
        string $paymentMethod,
        ?Shop $shop = null,
        ?string $referenceNumber = null,
        ?string $notes = null
    ): CustomerCreditTransaction {
        return DB::transaction(function () use ($customer, $amount, $paymentMethod, $shop, $referenceNumber, $notes) {
            $transaction = CustomerCreditTransaction::create([
                'customer_id' => $customer->id,
                'tenant_id' => $customer->tenant_id,
                'shop_id' => $shop?->id,
                'type' => 'payment',
                'amount' => $amount,
                'balance_before' => $customer->account_balance,
                'balance_after' => max(0, $customer->account_balance - $amount),
                'description' => "Payment received via {$paymentMethod}",
                'reference_number' => $referenceNumber,
                'notes' => $notes,
                'recorded_by' => auth()->id(),
            ]);

            $customer->account_balance = max(0, $customer->account_balance - $amount);
            $customer->save();

            $this->applyPaymentToOrders($customer, $amount);

            return $transaction;
        });
    }

    /**
     * Apply payment to customer's outstanding orders (oldest first)
     */
    protected function applyPaymentToOrders(Customer $customer, float $amount): void
    {
        $unpaidOrders = $customer->unpaidOrders()->get();
        $remainingAmount = $amount;

        foreach ($unpaidOrders as $order) {
            if ($remainingAmount <= 0) break;

            $orderBalance = $order->remainingBalance();
            $paymentAmount = min($remainingAmount, $orderBalance);

            if ($paymentAmount > 0) {
                OrderPayment::create([
                    'order_id' => $order->id,
                    'tenant_id' => $order->tenant_id,
                    'shop_id' => $order->shop_id,
                    'amount' => $paymentAmount,
                    'payment_method' => 'customer_credit',
                    'payment_date' => now(),
                    'notes' => 'Applied from customer account payment',
                    'recorded_by' => auth()->id(),
                ]);

                $remainingAmount -= $paymentAmount;
            }
        }
    }

    /**
     * Get customer's credit summary
     */
    public function getCreditSummary(Customer $customer): array
    {
        $unpaidOrders = $customer->unpaidOrders()->with('payments')->get();
        $totalOwed = $unpaidOrders->sum(fn($order) => $order->remainingBalance());

        return [
            'account_balance' => $customer->account_balance,
            'credit_limit' => $customer->credit_limit,
            'available_credit' => $customer->availableCredit(),
            'total_purchases' => $customer->total_purchases,
            'last_purchase_at' => $customer->last_purchase_at,
            'unpaid_order_count' => $unpaidOrders->count(),
            'total_owed' => $totalOwed,
            'unpaid_orders' => $unpaidOrders->map(fn($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'date' => $order->created_at->format('Y-m-d'),
                'total' => $order->total_amount,
                'paid' => $order->paid_amount,
                'balance' => $order->remainingBalance(),
                'status' => $order->status->label(),
                'payment_status' => $order->payment_status->label(),
            ]),
            'recent_transactions' => $customer->creditTransactions()
                ->latest()
                ->limit(10)
                ->with('recordedBy')
                ->get()
                ->map(fn($txn) => [
                    'id' => $txn->id,
                    'date' => $txn->created_at->format('Y-m-d H:i'),
                    'type' => $txn->type,
                    'amount' => $txn->amount,
                    'balance_after' => $txn->balance_after,
                    'description' => $txn->description,
                    'recorded_by' => $txn->recordedBy?->first_name . ' ' . $txn->recordedBy?->last_name,
                ]),
        ];
    }
}
