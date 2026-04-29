<?php

namespace App\Http\Controllers;

use App\Http\Requests\Supplier\AddToCatalogRequest;
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

    public function index(Request $request): Response
    {
        Gate::authorize('catalog.manage', $request->user()->tenant);

        return Inertia::render('Supplier/Catalog/Index', [
            'catalogItems' => $this->supplierService->getCatalogItems($request->user()->tenant),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('catalog.manage', $request->user()->tenant);

        return Inertia::render('Supplier/Catalog/Create', [
            'products' => $this->supplierService->getProductsNotInCatalog(),
        ]);
    }

    public function store(AddToCatalogRequest $request): RedirectResponse
    {
        Gate::authorize('catalog.manage', $request->user()->tenant);

        $catalogItem = $this->supplierService->addToCatalog(
            $request->user()->tenant,
            $request->validated()
        );

        return Redirect::route('supplier.catalog.index')
            ->with('success', "Product '{$catalogItem->product->name}' added to catalog successfully.");
    }

    public function edit(Request $request, SupplierCatalogItem $catalogItem): Response
    {
        Gate::authorize('catalog.manageCatalogItem', $catalogItem);

        $catalogItem->load(['product.variants', 'pricingTiers']);

        return Inertia::render('Supplier/Catalog/Edit', [
            'catalogItem' => $catalogItem,
        ]);
    }

    public function update(AddToCatalogRequest $request, SupplierCatalogItem $catalogItem): RedirectResponse
    {
        Gate::authorize('catalog.manageCatalogItem', $catalogItem);

        $this->supplierService->updateCatalogItem($catalogItem, $request->validated());

        return Redirect::route('supplier.catalog.index')
            ->with('success', 'Catalog item updated successfully.');
    }

    public function destroy(Request $request, SupplierCatalogItem $catalogItem): RedirectResponse
    {
        Gate::authorize('catalog.manageCatalogItem', $catalogItem);

        $this->supplierService->removeFromCatalog($catalogItem);

        return Redirect::route('supplier.catalog.index')
            ->with('success', 'Product removed from catalog successfully.');
    }

    public function browse(Request $request, ?Tenant $supplier = null): Response
    {
        Gate::authorize('catalog.viewAny');

        if ($supplier) {
            Gate::authorize('catalog.viewCatalog', $supplier);
        }

        $catalogItems = $this->supplierService->getAvailableCatalog($supplier, $request->user()->tenant)
            ->withQueryString();

        return Inertia::render('Supplier/Catalog/Browse', [
            'catalogItems' => $catalogItems,
            'supplier' => $supplier,
        ]);
    }
}
