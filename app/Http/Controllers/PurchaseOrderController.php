<?php

namespace App\Http\Controllers;

use App\Http\Requests\Supplier\CreatePurchaseOrderRequest;
use App\Http\Requests\Supplier\ReceivePurchaseOrderRequest;
use App\Http\Requests\Supplier\RecordPaymentRequest;
use App\Models\PurchaseOrder;
use App\Models\Shop;
use App\Models\Tenant;
use App\Services\PurchaseOrderService;
use App\Services\SupplierConnectionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(
        private readonly PurchaseOrderService $purchaseOrderService,
        private readonly SupplierConnectionService $connectionService
    ) {}

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PurchaseOrder::class);

        $tenantId = auth()->user()->tenant_id;
        $shopId = $request->input('shop_id');

        $query = PurchaseOrder::forBuyer($tenantId)
            ->with(['supplierTenant', 'shop', 'items.productVariant', 'createdBy']);

        if ($shopId) {
            $query->forShop($shopId);
        }

        $purchaseOrders = $query->orderBy('created_at', 'desc')->paginate(20);

        $shops = Shop::where('tenant_id', $tenantId)->get(['id', 'name']);

        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
            'shops' => $shops,
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function supplier(): Response
    {
        Gate::authorize('viewAsSupplier', auth()->user()->tenant);

        $purchaseOrders = PurchaseOrder::forSupplier(auth()->user()->tenant_id)
            ->with(['buyerTenant', 'shop', 'items.productVariant', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('PurchaseOrders/Supplier', [
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('viewAny', PurchaseOrder::class);

        $tenantId = auth()->user()->tenant_id;
        $shops = Shop::where('tenant_id', $tenantId)->get(['id', 'name']);

        $connections = $this->connectionService->getConnectionsForBuyer(auth()->user()->tenant);
        $approvedConnections = $connections->filter(fn ($conn) => $conn->status->canOrder());

        $supplierCatalog = [];
        $selectedSupplierId = $request->input('supplier');

        if ($selectedSupplierId) {
            $supplierTenant = Tenant::findOrFail($selectedSupplierId);
            $supplierCatalog = $supplierTenant->supplierProfile
                ->catalogItems()
                ->where('is_available', true)
                ->with(['product', 'pricingTiers'])
                ->get();
        }

        return Inertia::render('PurchaseOrders/Create', [
            'shops' => $shops,
            'supplierConnections' => $approvedConnections,
            'supplierCatalog' => $supplierCatalog,
            'selectedSupplierId' => $selectedSupplierId ? (int) $selectedSupplierId : null,
        ]);
    }

    public function store(CreatePurchaseOrderRequest $request): RedirectResponse
    {
        // Validate shop belongs to user's tenant
        $shop = Shop::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->findOrFail($request->input('shop_id'));

        // Supplier tenant doesn't need validation as it's a different tenant (B2B)
        $supplierTenant = Tenant::findOrFail($request->input('supplier_tenant_id'));

        $po = $this->purchaseOrderService->createPurchaseOrder(
            auth()->user()->tenant,
            $shop,
            $supplierTenant,
            $request->validated(),
            auth()->user()
        );

        return Redirect::route('purchase-orders.show', $po)
            ->with('success', "Purchase order {$po->po_number} created successfully.");
    }

    public function show(PurchaseOrder $purchaseOrder): Response
    {
        Gate::authorize('view', $purchaseOrder);

        $purchaseOrder->load([
            'items.productVariant.product',
            'items.catalogItem',
            'supplierTenant',
            'buyerTenant',
            'shop',
            'payments.recordedBy',
            'stockMovements',
            'createdBy',
            'approvedBy',
            'shippedBy',
            'receivedBy',
        ]);

        $isSupplier = auth()->user()->tenant_id === $purchaseOrder->supplier_tenant_id;
        $isBuyer = auth()->user()->tenant_id === $purchaseOrder->buyer_tenant_id;

        return Inertia::render('PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder,
            'isSupplier' => $isSupplier,
            'isBuyer' => $isBuyer,
        ]);
    }

    public function submit(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('submit', $purchaseOrder);

        $this->purchaseOrderService->submitPurchaseOrder($purchaseOrder, auth()->user());

        return Redirect::back()
            ->with('success', 'Purchase order submitted successfully.');
    }

    public function approve(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('approve', $purchaseOrder);

        $this->purchaseOrderService->approvePurchaseOrder($purchaseOrder, auth()->user());

        return Redirect::back()
            ->with('success', 'Purchase order approved.');
    }

    public function ship(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('ship', $purchaseOrder);

        $this->purchaseOrderService->shipPurchaseOrder($purchaseOrder, auth()->user());

        return Redirect::back()
            ->with('success', 'Purchase order marked as shipped. Stock has been deducted.');
    }

    public function receive(ReceivePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->purchaseOrderService->receivePurchaseOrder(
            $purchaseOrder,
            auth()->user(),
            $request->validated()
        );

        return Redirect::back()
            ->with('success', 'Purchase order received. Stock has been added to your inventory.');
    }

    public function cancel(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('cancel', $purchaseOrder);

        $this->purchaseOrderService->cancelPurchaseOrder(
            $purchaseOrder,
            $request->input('reason')
        );

        return Redirect::back()
            ->with('success', 'Purchase order cancelled.');
    }

    public function recordPayment(RecordPaymentRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->purchaseOrderService->recordPayment(
            $purchaseOrder,
            $request->validated(),
            auth()->user()
        );

        return Redirect::back()
            ->with('success', 'Payment recorded successfully.');
    }
}
