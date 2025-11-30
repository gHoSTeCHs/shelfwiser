<?php

namespace App\Http\Controllers;

use App\Http\Requests\Supplier\AddToCatalogRequest;
use App\Models\Product;
use App\Models\SupplierCatalogItem;
use App\Models\Tenant;
use App\Services\SupplierService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class SupplierCatalogController extends Controller
{
    public function __construct(private readonly SupplierService $supplierService) {}

    public function index(): Response
    {
        Gate::authorize('manageCatalog', auth()->user()->tenant);

        $tenantId = auth()->user()->tenant_id;

        $catalogItems = SupplierCatalogItem::forSupplier($tenantId)
            ->with(['product.variants', 'pricingTiers'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Supplier/Catalog/Index', [
            'catalogItems' => $catalogItems,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('manageCatalog', auth()->user()->tenant);

        $tenantId = auth()->user()->tenant_id;

        $products = Product::where('tenant_id', $tenantId)
            ->with(['variants', 'shop'])
            ->whereDoesntHave('supplierCatalogItem')
            ->latest()
            ->get();

        return Inertia::render('Supplier/Catalog/Create', [
            'products' => $products,
        ]);
    }

    public function store(AddToCatalogRequest $request): RedirectResponse
    {
        $product = Product::findOrFail($request->input('product_id'));

        $this->supplierService->addToCatalog(
            auth()->user()->tenant,
            $product,
            $request->validated()
        );

        return Redirect::route('supplier.catalog.index')
            ->with('success', "Product '{$product->name}' added to catalog successfully.");
    }

    public function edit(SupplierCatalogItem $catalogItem): Response
    {
        Gate::authorize('manageCatalog', auth()->user()->tenant);

        $catalogItem->load(['product.variants', 'pricingTiers']);

        return Inertia::render('Supplier/Catalog/Edit', [
            'catalogItem' => $catalogItem,
        ]);
    }

    public function update(AddToCatalogRequest $request, SupplierCatalogItem $catalogItem): RedirectResponse
    {
        $this->supplierService->updateCatalogItem($catalogItem, $request->validated());

        return Redirect::route('supplier.catalog.index')
            ->with('success', 'Catalog item updated successfully.');
    }

    public function destroy(SupplierCatalogItem $catalogItem): RedirectResponse
    {
        Gate::authorize('manageCatalog', auth()->user()->tenant);

        $this->supplierService->removeFromCatalog($catalogItem);

        return Redirect::route('supplier.catalog.index')
            ->with('success', 'Product removed from catalog successfully.');
    }

    public function browse(Request $request, ?Tenant $supplier = null): Response
    {
        $buyerTenant = auth()->user()->tenant;

        if ($supplier) {
            Gate::authorize('viewCatalog', $supplier);
        }

        $catalogItems = $this->supplierService->getAvailableCatalog($supplier, $buyerTenant);

        return Inertia::render('Supplier/Catalog/Browse', [
            'catalogItems' => $catalogItems,
            'supplier' => $supplier,
        ]);
    }
}
