<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCustomerRequest;
use App\Http\Requests\UpdateCustomerCreditLimitRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerService $customerService
    ) {}

    /**
     * Display a listing of customers.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Customer::class);

        $filters = $request->only(['search', 'status', 'has_credit', 'shop_id', 'sort', 'direction']);

        $customers = $this->customerService->list(
            $request->user()->tenant,
            $request->user(),
            $filters
        );

        $statistics = $this->customerService->getStatistics($request->user()->tenant);

        $shops = $request->user()->tenant->shops()
            ->select('id', 'name', 'slug')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'statistics' => $statistics,
            'shops' => $shops,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new customer.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('create', Customer::class);

        $shops = $request->user()->tenant->shops()
            ->select('id', 'name', 'slug')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Customers/Create', [
            'shops' => $shops,
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(CreateCustomerRequest $request): RedirectResponse
    {
        $customer = $this->customerService->create(
            $request->validated(),
            $request->user()->tenant
        );

        return Redirect::route('customers.show', $customer)
            ->with('success', "Customer '{$customer->full_name}' has been created successfully.");
    }

    /**
     * Display the specified customer.
     */
    public function show(Request $request, Customer $customer): Response
    {
        Gate::authorize('view', $customer);

        $customer = $this->customerService->find($customer->id, $request->user()->tenant);

        $recentOrders = $customer->orders()
            ->with(['shop:id,name', 'items:id,order_id,product_name,quantity,unit_price'])
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'recentOrders' => $recentOrders,
            'canManageCredit' => Gate::allows('manage', $customer),
        ]);
    }

    /**
     * Show the form for editing the specified customer.
     */
    public function edit(Request $request, Customer $customer): Response
    {
        Gate::authorize('update', $customer);

        $customer->load(['preferredShop', 'addresses']);

        $shops = $request->user()->tenant->shops()
            ->select('id', 'name', 'slug')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
            'shops' => $shops,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $this->customerService->update($customer, $request->validated());

        return Redirect::route('customers.show', $customer)
            ->with('success', "Customer '{$customer->full_name}' has been updated successfully.");
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        Gate::authorize('delete', $customer);

        $customerName = $customer->full_name;

        $this->customerService->delete($customer);

        return Redirect::route('customers.index')
            ->with('success', "Customer '{$customerName}' has been deleted successfully.");
    }

    /**
     * Toggle customer active status.
     */
    public function toggleStatus(Request $request, Customer $customer): RedirectResponse
    {
        Gate::authorize('update', $customer);

        $newStatus = !$customer->is_active;
        $this->customerService->toggleActive($customer, $newStatus);

        $statusLabel = $newStatus ? 'activated' : 'deactivated';

        return back()->with('success', "Customer '{$customer->full_name}' has been {$statusLabel}.");
    }

    /**
     * Update customer credit limit.
     */
    public function updateCreditLimit(UpdateCustomerCreditLimitRequest $request, Customer $customer): RedirectResponse
    {
        Gate::authorize('manage', $customer);

        $this->customerService->setCreditLimit(
            $customer,
            $request->validated()['credit_limit']
        );

        return back()->with('success', 'Credit limit has been updated successfully.');
    }

    /**
     * Generate quick customer data for rapid creation.
     */
    public function generateData(Request $request): JsonResponse
    {
        Gate::authorize('create', Customer::class);

        $data = $this->customerService->generateQuickCustomerData($request->user()->tenant);

        return response()->json($data);
    }
}
