<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecordCustomerPaymentRequest;
use App\Models\Customer;
use App\Models\Shop;
use App\Services\CustomerCreditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerCreditController extends Controller
{
    public function __construct(
        protected CustomerCreditService $creditService
    ) {}

    /**
     * Display customer credit summary and transaction history
     */
    public function show(Shop $shop, Customer $customer): Response
    {
        $this->authorize('manage', $customer);

        $summary = $this->creditService->getCreditSummary($customer);

        return Inertia::render('Customers/Credit/Show', [
            'shop' => $shop,
            'customer' => $customer,
            'summary' => $summary,
        ]);
    }

    /**
     * Display form to record a payment on customer account
     */
    public function createPayment(Shop $shop, Customer $customer): Response
    {
        $this->authorize('manage', $customer);

        return Inertia::render('Customers/Credit/RecordPayment', [
            'shop' => $shop,
            'customer' => $customer->load('creditTransactions' => fn($q) => $q->latest()->limit(5)),
        ]);
    }

    /**
     * Record a payment on customer's credit account
     */
    public function storePayment(RecordCustomerPaymentRequest $request, Shop $shop, Customer $customer): RedirectResponse
    {
        $this->authorize('manage', $customer);

        try {
            $transaction = $this->creditService->recordPayment(
                customer: $customer,
                amount: $request->validated('amount'),
                paymentMethod: $request->validated('payment_method'),
                shop: $shop,
                referenceNumber: $request->validated('reference_number'),
                notes: $request->validated('notes')
            );

            return redirect()
                ->route('customers.credit.show', [$shop, $customer])
                ->with('success', "Payment of ₦{$transaction->amount} recorded successfully");

        } catch (\Exception $e) {
            return back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display customer credit transaction history
     */
    public function transactions(Request $request, Shop $shop, Customer $customer): Response
    {
        $this->authorize('view', $customer);

        $transactions = $customer->creditTransactions()
            ->with(['order', 'recordedBy'])
            ->when($request->type, fn($q, $type) => $q->where('type', $type))
            ->latest()
            ->paginate(20);

        return Inertia::render('Customers/Credit/Transactions', [
            'shop' => $shop,
            'customer' => $customer,
            'transactions' => $transactions,
            'filters' => $request->only('type'),
        ]);
    }

    /**
     * Display list of customers with credit accounts
     */
    public function index(Request $request, Shop $shop): Response
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->whereNotNull('credit_limit')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->sort === 'balance_high', fn($q) => $q->orderBy('account_balance', 'desc'))
            ->when($request->sort === 'balance_low', fn($q) => $q->orderBy('account_balance', 'asc'))
            ->when($request->sort === 'limit_high', fn($q) => $q->orderBy('credit_limit', 'desc'))
            ->when($request->sort === 'limit_low', fn($q) => $q->orderBy('credit_limit', 'asc'))
            ->when(!$request->sort, fn($q) => $q->orderBy('account_balance', 'desc'))
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Customers/Credit/Index', [
            'shop' => $shop,
            'customers' => $customers,
            'filters' => $request->only(['search', 'sort']),
            'stats' => [
                'total_customers' => Customer::where('tenant_id', auth()->user()->tenant_id)
                    ->whereNotNull('credit_limit')
                    ->count(),
                'total_balance' => Customer::where('tenant_id', auth()->user()->tenant_id)
                    ->sum('account_balance'),
                'total_limit' => Customer::where('tenant_id', auth()->user()->tenant_id)
                    ->sum('credit_limit'),
            ],
        ]);
    }
}
