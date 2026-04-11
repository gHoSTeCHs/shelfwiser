<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\ProductsFilterRequest;
use App\Http\Requests\Storefront\ServicesFilterRequest;
use App\Models\Product;
use App\Models\Service;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\StorefrontService;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function __construct(
        protected StorefrontService $storefrontService,
        protected CartService $cartService
    ) {}

    /**
     * Display the storefront home page.
     */
    public function index(Shop $shop): Response
    {
        $featuredProducts = $this->storefrontService->getFeaturedProducts($shop);
        $categories = $this->storefrontService->getCategories($shop);

        $featuredServices = $this->storefrontService->getFeaturedServices($shop, 4);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/Home', [
            'shop' => $shop,
            'featuredProducts' => $featuredProducts,
            'featuredServices' => $featuredServices,
            'categories' => $categories,
            'cartSummary' => $cartSummary,
        ]);
    }

    /**
     * Display product listing page.
     */
    public function products(ProductsFilterRequest $request, Shop $shop): Response
    {
        $validated = $request->validated();

        $products = $this->storefrontService->getProducts(
            $shop,
            $validated['search'] ?? null,
            $validated['category'] ?? null,
            $validated['sort'] ?? 'name',
            $validated['per_page'] ?? 12
        );

        $categories = $this->storefrontService->getCategories($shop);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/Products', [
            'shop' => $shop,
            'products' => $products,
            'categories' => $categories,
            'filters' => $validated,
            'cartSummary' => $cartSummary,
        ]);
    }

    /**
     * Display single product page.
     */
    public function show(Shop $shop, Product $product): Response
    {
        // Ensure product belongs to the shop
        if ($product->shop_id !== $shop->id || ! $product->is_active) {
            abort(404);
        }

        $product->load([
            'variants' => fn ($q) => $q->where('is_available_online', true)
                ->where('is_active', true)
                ->with('packagingTypes'),
            'category',
            'type',
        ]);

        $relatedProducts = $this->storefrontService->getRelatedProducts($product);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/ProductDetail', [
            'shop' => $shop,
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'cartSummary' => $cartSummary,
        ]);
    }

    /**
     * Display service listing page.
     */
    public function services(ServicesFilterRequest $request, Shop $shop): Response
    {
        $validated = $request->validated();

        $services = $this->storefrontService->getServices(
            $shop,
            $validated['search'] ?? null,
            $validated['category'] ?? null,
            $validated['sort'] ?? 'name',
            $validated['per_page'] ?? 12
        );

        $categories = $this->storefrontService->getServiceCategories($shop);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/Services', [
            'shop' => $shop,
            'services' => $services,
            'categories' => $categories,
            'filters' => $validated,
            'cartSummary' => $cartSummary,
        ]);
    }

    /**
     * Display single service page.
     */
    public function showService(Shop $shop, Service $service): Response
    {
        // Ensure service belongs to the shop
        if ($service->shop_id !== $shop->id || ! $service->is_active) {
            abort(404);
        }

        $service->load([
            'variants' => fn ($q) => $q->where('is_active', true)
                ->orderBy('sort_order'),
            'category',
            'addons' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
        ]);

        $categoryAddons = $this->storefrontService->getCategoryAddons($service);

        $relatedServices = $this->storefrontService->getRelatedServices($service);

        $cart = $this->cartService->getCart($shop, auth('customer')->id());
        $cartSummary = $this->cartService->getCartSummary($cart);

        return Inertia::render('Storefront/ServiceDetail', [
            'shop' => $shop,
            'service' => $service,
            'categoryAddons' => $categoryAddons,
            'relatedServices' => $relatedServices,
            'cartSummary' => $cartSummary,
        ]);
    }
}
