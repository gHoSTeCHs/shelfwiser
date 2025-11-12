<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Models\Shop;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $productService)
    {
    }

    public function index(): Response
    {
        Gate::authorize('create', Product::class);

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('Products/Index', [
            'products' => Product::where('tenant_id', $tenantId)
                ->with(['type', 'category', 'shop', 'variants'])
                ->withCount('variants')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Product::class);

        $tenantId = auth()->user()->tenant_id;

        $shops = Shop::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'name', 'slug']);

        $productTypes = ProductType::accessibleTo($tenantId)
            ->where('is_active', true)
            ->get(['id', 'slug', 'label', 'description', 'config_schema', 'supports_variants', 'requires_batch_tracking', 'requires_serial_tracking']);

        $categories = ProductCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Products/Create', [
            'shops' => $shops,
            'productTypes' => $productTypes,
            'categories' => $categories,
        ]);
    }

    public function store(CreateProductRequest $request): RedirectResponse
    {
        $shop = Shop::query()->findOrFail($request->input('shop_id'));

        $product = $this->productService->create(
            $request->validated(),
            $request->user()->tenant,
            $shop
        );

        return Redirect::route('products.index')
            ->with('success', "Product '{$product->name}' created successfully.");
    }

    public function show(Product $product): Response
    {
        Gate::authorize('view', $product);

        $product->load(['type', 'category', 'shop', 'variants.inventoryLocations']);

        return Inertia::render('Products/Show', [
            'product' => $product,
            'can_manage' => auth()->user()->can('manage', $product),
        ]);
    }

    public function edit(Product $product): Response
    {
        Gate::authorize('manage', $product);

        $product->load(['type', 'category', 'variants']);

        $tenantId = auth()->user()->tenant_id;

        $productTypes = ProductType::accessibleTo($tenantId)
            ->where('is_active', true)
            ->get(['id', 'slug', 'label', 'description', 'config_schema', 'supports_variants', 'requires_batch_tracking', 'requires_serial_tracking']);

        $categories = ProductCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'productTypes' => $productTypes,
            'categories' => $categories,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->productService->update($product, $request->validated());

        return Redirect::route('products.show', $product)
            ->with('success', "Product '{$product->name}' updated successfully.");
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        $product->delete();

        return Redirect::route('products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
