<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\StorefrontPageType;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shop;
use App\Services\Storefront\StorefrontRenderService;
use Illuminate\View\View;

class StorefrontRenderController extends Controller
{
    public function __construct(
        private readonly StorefrontRenderService $renderService
    ) {}

    public function home(Shop $shop): View
    {
        return $this->renderPage($shop, StorefrontPageType::HOME);
    }

    public function products(Shop $shop): View
    {
        return $this->renderPage($shop, StorefrontPageType::PRODUCTS);
    }

    public function productDetail(Shop $shop, string $slug): View
    {
        return $this->renderPage($shop, StorefrontPageType::PRODUCT_DETAIL, $slug);
    }

    public function about(Shop $shop): View
    {
        return $this->renderPage($shop, StorefrontPageType::ABOUT);
    }

    public function contact(Shop $shop): View
    {
        return $this->renderPage($shop, StorefrontPageType::CONTACT);
    }

    public function page(Shop $shop, string $slug): View
    {
        return $this->renderPage($shop, StorefrontPageType::CUSTOM, $slug);
    }

    public function services(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'services');
    }

    public function serviceDetail(Shop $shop, string $slug): View
    {
        return $this->renderFixedPage($shop, 'service-detail', ['slug' => $slug]);
    }

    public function cart(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'cart');
    }

    public function checkout(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'checkout');
    }

    public function checkoutSuccess(Shop $shop, Order $order): View
    {
        $this->authorizeOrderAccess($order, $shop);

        return $this->renderFixedPage($shop, 'checkout-success', ['order' => $order]);
    }

    public function checkoutPending(Shop $shop, Order $order): View
    {
        $this->authorizeOrderAccess($order, $shop);

        return $this->renderFixedPage($shop, 'checkout-pending', ['order' => $order]);
    }

    public function login(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'login');
    }

    public function register(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'register');
    }

    public function forgotPassword(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'forgot-password');
    }

    public function resetPassword(Shop $shop, string $token): View
    {
        return $this->renderFixedPage($shop, 'reset-password', ['token' => $token]);
    }

    public function verifyEmail(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'verify-email');
    }

    public function accountDashboard(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'account-dashboard');
    }

    public function accountOrders(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'account-orders');
    }

    public function accountOrderDetail(Shop $shop, Order $order): View
    {
        $this->authorizeOrderAccess($order, $shop);

        return $this->renderFixedPage($shop, 'account-order-detail', ['order' => $order]);
    }

    public function accountProfile(Shop $shop): View
    {
        return $this->renderFixedPage($shop, 'account-profile');
    }

    private function renderPage(Shop $shop, StorefrontPageType $pageType, ?string $slug = null): View
    {
        $config = $shop->storefrontConfig;
        abort_unless($config?->is_published, 404);

        $pageData = $this->renderService->buildPage($shop, $pageType, $slug);

        return view('storefront.builder-app', [
            'pageData' => $pageData,
            'seo' => $pageData['seo'],
            'themeStyles' => $pageData['themeStyles'],
        ]);
    }

    private function renderFixedPage(Shop $shop, string $page, array $params = []): View
    {
        $config = $shop->storefrontConfig;
        abort_unless($config?->is_published, 404);

        $pageData = $this->renderService->buildFixedPage($shop, $page, $params);

        return view('storefront.builder-app', [
            'pageData' => $pageData,
            'seo' => $pageData['seo'],
            'themeStyles' => $pageData['themeStyles'],
        ]);
    }

    private function authorizeOrderAccess(Order $order, Shop $shop): void
    {
        $customer = auth('customer')->user();
        abort_unless(
            $customer && $order->customer_id === $customer->id && $order->shop_id === $shop->id,
            403
        );
    }
}
