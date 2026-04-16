<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreditTransactionsRequest;
use App\Http\Requests\IndexCreditCustomersRequest;
use App\Http\Requests\RecordCustomerPaymentRequest;
use App\Models\Customer;
use App\Models\Shop;
use App\Services\CustomerCreditService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CustomerCreditController extends Controller
{
    public function __construct(
        protected CustomerCreditService $creditService
    ) {}

    public function show(Shop $shop, Customer $customer): Response
    {
        Gate::authorize('manage', $customer);

        return Inertia::render('Customers/Credit/Show', [
            'shop' => $shop,
            'customer' => $customer,
            'summary' => $this->creditService->getCreditSummary($customer),
        ]);
    }

    public function createPayment(Shop $shop, Customer $customer): Response
    {
        Gate::authorize('manage', $customer);

        return Inertia::render('Customers/Credit/RecordPayment', [
            'shop' => $shop,
            'customer' => $this->creditService->loadRecentTransactions($customer),
        ]);
    }

    public function storePayment(RecordCustomerPaymentRequest $request, Shop $shop, Customer $customer): RedirectResponse
    {
        Gate::authorize('manage', $customer);

        try {
            $transaction = $this->creditService->recordPayment(
                customer: $customer,
                amount: $request->validated('amount'),
                paymentMethod: $request->validated('payment_method'),
                shop: $shop,
                referenceNumber: $request->validated('reference_number'),
                notes: $request->validated('notes'),
                recordedBy: $request->user(),
            );

            return redirect()
                ->route('customers.credit.show', [$shop, $customer])
                ->with('success', "Payment of ₦$transaction->amount recorded successfully");
        } catch (Exception $e) {
            return back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    public function transactions(CreditTransactionsRequest $request, Shop $shop, Customer $customer): Response
    {
        Gate::authorize('view', $customer);

        return Inertia::render('Customers/Credit/Transactions', [
            'shop' => $shop,
            'customer' => $customer,
            'transactions' => $this->creditService->getTransactionHistory($customer, $request->validated('type')),
            'filters' => $request->only('type'),
        ]);
    }

    public function index(IndexCreditCustomersRequest $request, Shop $shop): Response
    {
        Gate::authorize('viewAny', Customer::class);

        $result = $this->creditService->getCreditCustomers($request->filters());

        return Inertia::render('Customers/Credit/Index', [
            'shop' => $shop,
            'customers' => $result['customers'],
            'filters' => $request->only(['search', 'sort']),
            'stats' => $result['stats'],
        ]);
    }
}
