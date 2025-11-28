<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Service;
use App\Models\Shop;
use App\Services\CartService;
use App\Services\StorefrontService;
use Illuminate\Http\Request;
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
            // Check if storefront is enabled
        if (! $shop->storefront_enabled) {
            abort(404, 'Storefront not available for this shop');
        }

        $featuredProducts = $this->storefrontService->getFeaturedProducts($shop);
        $categories = $this->storefrontService->getCategories($shop);

        // Get featured services (limit to 4 for homepage)
        $featuredServices = \App\Models\Service::where('shop_id', $shop->id)
            ->where('is_active', true)
            ->where('is_available_online', true)
            ->where('is_featured', true)
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(4)
            ->get();

        // Get cart summary for current user/session
        $cart = $this->cartService->getCart($shop, auth()->id());
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
    public function products(Request $request, Shop $shop): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'integer', 'exists:product_categories,id'],
            'sort' => ['nullable', 'string', 'in:name,price_low,price_high,newest,featured'],
            'per_page' => ['nullable', 'integer', 'min:6', 'max:24'],
        ]);

        $products = $this->storefrontService->getProducts(
            $shop,
            $validated['search'] ?? null,
            $validated['category'] ?? null,
            $validated['sort'] ?? 'name',
            $validated['per_page'] ?? 12
        );

        $categories = $this->storefrontService->getCategories($shop);

        // Get cart summary
        $cart = $this->cartService->getCart($shop, auth()->id());
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

        // Get cart summary
        $cart = $this->cartService->getCart($shop, auth()->id());
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
    public function services(Request $request, Shop $shop): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'integer', 'exists:service_categories,id'],
            'sort' => ['nullable', 'string', 'in:name,price_low,price_high,newest'],
            'per_page' => ['nullable', 'integer', 'min:6', 'max:24'],
        ]);

        $services = $this->storefrontService->getServices(
            $shop,
            $validated['search'] ?? null,
            $validated['category'] ?? null,
            $validated['sort'] ?? 'name',
            $validated['per_page'] ?? 12
        );

        $categories = $this->storefrontService->getServiceCategories($shop);

        // Get cart summary
        $cart = $this->cartService->getCart($shop, auth()->id());
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

        // Get category-wide addons if service has a category
        $categoryAddons = [];
        if ($service->service_category_id) {
            $categoryAddons = \App\Models\ServiceAddon::where('service_category_id', $service->service_category_id)
                ->whereNull('service_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        }

        $relatedServices = $this->storefrontService->getRelatedServices($service);

        // Get cart summary
        $cart = $this->cartService->getCart($shop, auth()->id());
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
