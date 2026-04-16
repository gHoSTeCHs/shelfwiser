<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerCreditTransaction;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CustomerCreditService
{
    /**
     * Charge an order to customer's credit account
     */
    public function chargeOrder(Customer $customer, Order $order, ?User $recordedBy = null): CustomerCreditTransaction
    {
        return DB::transaction(function () use ($customer, $order, $recordedBy) {
            $lockedCustomer = Customer::query()->where('id', $customer->id)->lockForUpdate()->first();

            if (! $lockedCustomer->canPurchaseOnCredit($order->total_amount)) {
                $available = $lockedCustomer->availableCredit();
                throw new \Exception(
                    $available !== null
                        ? 'Credit limit exceeded. Available credit: ₦'.number_format($available, 2)
                        : 'Cannot charge order to credit'
                );
            }

            $transaction = CustomerCreditTransaction::query()->create([
                'customer_id' => $lockedCustomer->id,
                'order_id' => $order->id,
                'tenant_id' => $lockedCustomer->tenant_id,
                'shop_id' => $order->shop_id,
                'type' => 'charge',
                'amount' => $order->total_amount,
                'balance_before' => $lockedCustomer->account_balance,
                'balance_after' => $lockedCustomer->account_balance + $order->total_amount,
                'description' => "Order {$order->order_number} charged to account",
                'recorded_by' => $recordedBy?->id,
            ]);

            $lockedCustomer->account_balance += $order->total_amount;
            $lockedCustomer->total_purchases += $order->total_amount;
            $lockedCustomer->last_purchase_at = now();
            $lockedCustomer->save();

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
        ?string $notes = null,
        ?User $recordedBy = null,
    ): CustomerCreditTransaction {
        return DB::transaction(function () use ($customer, $amount, $paymentMethod, $shop, $referenceNumber, $notes, $recordedBy) {
            $lockedCustomer = Customer::query()->where('id', $customer->id)->lockForUpdate()->first();

            $transaction = CustomerCreditTransaction::query()->create([
                'customer_id' => $lockedCustomer->id,
                'tenant_id' => $lockedCustomer->tenant_id,
                'shop_id' => $shop?->id,
                'type' => 'payment',
                'amount' => $amount,
                'balance_before' => $lockedCustomer->account_balance,
                'balance_after' => max(0, $lockedCustomer->account_balance - $amount),
                'description' => "Payment received via {$paymentMethod}",
                'reference_number' => $referenceNumber,
                'notes' => $notes,
                'recorded_by' => $recordedBy?->id,
            ]);

            $lockedCustomer->account_balance = max(0, $lockedCustomer->account_balance - $amount);
            $lockedCustomer->save();

            $this->applyPaymentToOrders($lockedCustomer, $amount, $recordedBy);

            return $transaction;
        });
    }

    /**
     * Apply payment to customer's outstanding orders (oldest first)
     */
    protected function applyPaymentToOrders(Customer $customer, float $amount, ?User $recordedBy = null): void
    {
        $unpaidOrders = $customer->unpaidOrders()->get();
        $remainingAmount = $amount;

        foreach ($unpaidOrders as $order) {
            if ($remainingAmount <= 0) {
                break;
            }

            $orderBalance = $order->remainingBalance();
            $paymentAmount = min($remainingAmount, $orderBalance);

            if ($paymentAmount > 0) {
                OrderPayment::query()->create([
                    'order_id' => $order->id,
                    'tenant_id' => $order->tenant_id,
                    'shop_id' => $order->shop_id,
                    'amount' => $paymentAmount,
                    'payment_method' => 'customer_credit',
                    'payment_date' => now(),
                    'notes' => 'Applied from customer account payment',
                    'recorded_by' => $recordedBy?->id,
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
        $totalOwed = $unpaidOrders->sum(fn ($order) => $order->remainingBalance());

        return [
            'account_balance' => $customer->account_balance,
            'credit_limit' => $customer->credit_limit,
            'available_credit' => $customer->availableCredit(),
            'total_purchases' => $customer->total_purchases,
            'last_purchase_at' => $customer->last_purchase_at,
            'unpaid_order_count' => $unpaidOrders->count(),
            'total_owed' => $totalOwed,
            'unpaid_orders' => $unpaidOrders->map(fn ($order) => [
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
                ->map(fn ($txn) => [
                    'id' => $txn->id,
                    'date' => $txn->created_at->format('Y-m-d H:i'),
                    'type' => $txn->type,
                    'amount' => $txn->amount,
                    'balance_after' => $txn->balance_after,
                    'description' => $txn->description,
                    'recorded_by' => $txn->recordedBy?->first_name.' '.$txn->recordedBy?->last_name,
                ]),
        ];
    }

    /**
     * Get paginated customers with credit accounts and aggregated stats.
     *
     * @param  array{search?: string|null, sort?: string|null}  $filters
     * @return array{customers: LengthAwarePaginator, stats: array{total_customers: int, total_balance: float, total_limit: float}}
     */
    public function getCreditCustomers(array $filters): array
    {
        $baseQuery = Customer::query()->whereNotNull('credit_limit');

        $stats = (clone $baseQuery)
            ->selectRaw('COUNT(*) as total_customers, COALESCE(SUM(account_balance), 0) as total_balance, COALESCE(SUM(credit_limit), 0) as total_limit')
            ->first();

        $search = $filters['search'] ?? null;
        $sort = $filters['sort'] ?? null;

        $customers = $baseQuery
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($sort === 'balance_high', fn ($q) => $q->orderBy('account_balance', 'desc'))
            ->when($sort === 'balance_low', fn ($q) => $q->orderBy('account_balance', 'asc'))
            ->when($sort === 'limit_high', fn ($q) => $q->orderBy('credit_limit', 'desc'))
            ->when($sort === 'limit_low', fn ($q) => $q->orderBy('credit_limit', 'asc'))
            ->when(! $sort, fn ($q) => $q->orderBy('account_balance', 'desc'))
            ->paginate(20)
            ->withQueryString();

        return [
            'customers' => $customers,
            'stats' => [
                'total_customers' => (int) $stats->total_customers,
                'total_balance' => (float) $stats->total_balance,
                'total_limit' => (float) $stats->total_limit,
            ],
        ];
    }

    /**
     * Get paginated credit transaction history for a customer.
     */
    public function getTransactionHistory(Customer $customer, ?string $type = null): LengthAwarePaginator
    {
        return $customer->creditTransactions()
            ->with(['order', 'recordedBy'])
            ->when($type, fn ($q, $type) => $q->where('type', $type))
            ->latest()
            ->paginate(20);
    }

    /**
     * Eager-load the customer's recent credit transactions onto the model.
     */
    public function loadRecentTransactions(Customer $customer, int $limit = 5): Customer
    {
        return $customer->load([
            'creditTransactions' => fn ($q) => $q->latest()->limit($limit),
        ]);
    }
}
