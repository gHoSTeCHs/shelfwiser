<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\Shop;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        //        private  ProductTemplateService $templateService
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Product::class);

        return Inertia::render('Products/Index', [
            'products' => $this->productService->getProductsForIndex(),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Product::class);

        return Inertia::render('Products/Create', $this->productService->getCreateFormData($request->user()->tenant_id));
    }

    /**
     * @throws Throwable
     */
    public function store(CreateProductRequest $request): RedirectResponse
    {
        Gate::authorize('create', Product::class);

        $shop = Shop::query()->findOrFail($request->validated()['shop_id']);

        $product = $this->productService->create(
            $request->validated(),
            $request->user()->tenant,
            $shop
        );

        return Redirect::route('products.index')
            ->with('success', "Product '$product->name' created successfully.");
    }

    public function show(Product $product): Response
    {
        Gate::authorize('view', $product);

        $showData = $this->productService->getProductShowData($product);

        return Inertia::render('Products/Show', [
            'product' => $product,
            'can_manage' => auth()->user()->can('manage', $product),
            ...$showData,
        ]);
    }

    public function edit(Product $product): Response
    {
        Gate::authorize('manage', $product);

        $formData = $this->productService->getEditFormData($product);

        return Inertia::render('Products/Edit', [
            'product' => $product,
            ...$formData,
        ]);
    }

    /**
     * @throws Throwable
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        Gate::authorize('manage', $product);

        $this->productService->update($product, $request->validated());

        return Redirect::route('products.show', $product)
            ->with('success', "Product '$product->name' updated successfully.");
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        try {
            $this->productService->delete($product);

            return Redirect::route('products.index')
                ->with('success', 'Product deleted successfully.');
        } catch (\RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }
}
