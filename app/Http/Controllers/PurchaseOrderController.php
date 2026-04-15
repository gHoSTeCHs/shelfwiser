<?php

namespace App\Http\Controllers;

use App\Enums\ConnectionStatus;
use App\Http\Requests\Supplier\CancelPurchaseOrderRequest;
use App\Http\Requests\Supplier\CreatePurchaseOrderRequest;
use App\Http\Requests\Supplier\ReceivePurchaseOrderRequest;
use App\Http\Requests\Supplier\RecordPaymentRequest;
use App\Models\PurchaseOrder;
use App\Models\Shop;
use App\Models\SupplierConnection;
use App\Models\Tenant;
use App\Services\PurchaseOrderService;
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
    ) {}

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        Gate::authorize('purchaseOrder.viewAny', PurchaseOrder::class);

        $shopId = $request->input('shop_id') ? (int) $request->input('shop_id') : null;

        return Inertia::render('PurchaseOrders/Index', [
            'purchaseOrders' => $this->purchaseOrderService->getPaginatedBuyerPurchaseOrders(
                auth()->user()->tenant,
                $shopId,
            ),
            'shops' => $this->purchaseOrderService->getShopsForDropdown(auth()->user()->tenant_id),
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function supplier(): Response
    {
        Gate::authorize('purchaseOrder.viewAsSupplier', auth()->user()->tenant);

        return Inertia::render('PurchaseOrders/Supplier', [
            'purchaseOrders' => $this->purchaseOrderService->getPaginatedSupplierPurchaseOrders(
                auth()->user()->tenant,
            ),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('purchaseOrder.viewAny', PurchaseOrder::class);

        $selectedSupplierId = $request->input('supplier');
        $supplierCatalog = null;

        if ($selectedSupplierId) {
            $supplierTenant = $this->resolveApprovedSupplier((int) $selectedSupplierId);
            $search = $request->input('search', '');
            $perPage = min((int) $request->input('per_page', 20), 50);

            $supplierCatalog = $this->purchaseOrderService->getSupplierCatalog(
                $supplierTenant,
                $search,
                $perPage,
            );
        }

        return Inertia::render('PurchaseOrders/Create', [
            'shops' => $this->purchaseOrderService->getShopsForDropdown(auth()->user()->tenant_id),
            'supplierConnections' => $this->purchaseOrderService->getApprovedConnectionsForBuyer(
                auth()->user()->tenant,
            ),
            'supplierCatalog' => $supplierCatalog,
            'selectedSupplierId' => $selectedSupplierId ? (int) $selectedSupplierId : null,
        ]);
    }

    public function store(CreatePurchaseOrderRequest $request): RedirectResponse
    {
        $shop = Shop::query()->findOrFail($request->validated('shop_id'));
        Gate::authorize('purchaseOrder.create', $shop);

        $supplierTenant = $this->resolveApprovedSupplier((int) $request->validated('supplier_tenant_id'));

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
        Gate::authorize('purchaseOrder.view', $purchaseOrder);

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
        Gate::authorize('purchaseOrder.submit', $purchaseOrder);

        $this->purchaseOrderService->submitPurchaseOrder($purchaseOrder, auth()->user());

        return Redirect::back()
            ->with('success', 'Purchase order submitted successfully.');
    }

    public function approve(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('purchaseOrder.approve', $purchaseOrder);

        $this->purchaseOrderService->approvePurchaseOrder($purchaseOrder, auth()->user());

        return Redirect::back()
            ->with('success', 'Purchase order approved.');
    }

    public function ship(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('purchaseOrder.ship', $purchaseOrder);

        $this->purchaseOrderService->shipPurchaseOrder($purchaseOrder, auth()->user());

        return Redirect::back()
            ->with('success', 'Purchase order marked as shipped. Stock has been deducted.');
    }

    public function receive(ReceivePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('purchaseOrder.receive', $purchaseOrder);

        $this->purchaseOrderService->receivePurchaseOrder(
            $purchaseOrder,
            auth()->user(),
            $request->validated()
        );

        return Redirect::back()
            ->with('success', 'Purchase order received. Stock has been added to your inventory.');
    }

    public function cancel(CancelPurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('purchaseOrder.cancel', $purchaseOrder);

        $this->purchaseOrderService->cancelPurchaseOrder(
            $purchaseOrder,
            $request->user(),
            $request->validated('reason')
        );

        return Redirect::back()
            ->with('success', 'Purchase order cancelled.');
    }

    /**
     * Resolve a supplier tenant only if the current tenant has an approved/active
     * supplier connection with them. 404s otherwise — prevents enumeration.
     */
    private function resolveApprovedSupplier(int $supplierTenantId): Tenant
    {
        $buyerTenantId = auth()->user()->tenant_id;

        SupplierConnection::query()
            ->where('buyer_tenant_id', $buyerTenantId)
            ->where('supplier_tenant_id', $supplierTenantId)
            ->whereIn('status', [ConnectionStatus::APPROVED->value, ConnectionStatus::ACTIVE->value])
            ->firstOrFail();

        return Tenant::query()->findOrFail($supplierTenantId);
    }

    public function recordPayment(RecordPaymentRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('purchaseOrder.recordPayment', $purchaseOrder);

        $this->purchaseOrderService->recordPayment(
            $purchaseOrder,
            $request->validated(),
            auth()->user()
        );

        return Redirect::back()
            ->with('success', 'Payment recorded successfully.');
    }
}
