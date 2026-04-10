<?php

use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\CustomerAuthController;
use App\Http\Controllers\Storefront\CustomerPortalController;
use App\Http\Controllers\Storefront\StorefrontApiController;
use App\Http\Controllers\Storefront\StorefrontRenderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Storefront Routes
|--------------------------------------------------------------------------
|
| Public-facing e-commerce routes for customers to browse and shop.
| Routes are scoped to a specific shop using the shop slug.
|
| Page GETs are handled by StorefrontRenderController (builder-driven).
| Mutations are handled by existing controllers until StorefrontApiController
| is implemented in Chunk 5.
|
*/

Route::prefix('store/{shop:slug}')->middleware('storefront.enabled')->name('storefront.')->group(function () {

    // === COMPOSABLE PAGES (section-composed via builder) ===
    Route::get('/', [StorefrontRenderController::class, 'home'])->name('index');
    Route::get('/products', [StorefrontRenderController::class, 'products'])->name('products');
    Route::get('/products/{product:slug}', [StorefrontRenderController::class, 'productDetail'])->name('product');
    Route::get('/about', [StorefrontRenderController::class, 'about'])->name('about');
    Route::get('/contact', [StorefrontRenderController::class, 'contact'])->name('contact');
    Route::get('/p/{slug}', [StorefrontRenderController::class, 'page'])->name('page');

    // === FIXED THEMED PAGES ===
    Route::get('/services', [StorefrontRenderController::class, 'services'])->name('services');
    Route::get('/services/{service:slug}', [StorefrontRenderController::class, 'serviceDetail'])->name('service');
    Route::get('/cart', [StorefrontRenderController::class, 'cart'])->name('cart');

    // Auth pages (guest only)
    Route::middleware('guest:customer')->group(function () {
        Route::get('/login', [StorefrontRenderController::class, 'login'])->name('login');
        Route::post('/login', [CustomerAuthController::class, 'login'])
            ->middleware('throttle:5,1');
        Route::get('/register', [StorefrontRenderController::class, 'register'])->name('register');
        Route::post('/register', [CustomerAuthController::class, 'register'])
            ->middleware('throttle:3,1');

        Route::get('/forgot-password', [StorefrontRenderController::class, 'forgotPassword'])->name('password.request');
        Route::post('/forgot-password', [CustomerAuthController::class, 'sendResetLink'])
            ->middleware('throttle:3,1')
            ->name('password.email');
        Route::get('/reset-password/{token}', [StorefrontRenderController::class, 'resetPassword'])->name('password.reset');
        Route::post('/reset-password', [CustomerAuthController::class, 'resetPassword'])
            ->middleware('throttle:3,1')
            ->name('password.update');
    });

    // Cart mutations (existing Inertia controllers — kept during transition)
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::post('/cart/service', [CartController::class, 'storeService'])->name('cart.store-service');
    Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{item}', [CartController::class, 'destroy'])->name('cart.destroy');

    // === JSON API (for themed storefront pages via storefrontFetch) ===
    Route::prefix('api')->group(function () {
        Route::get('/cart', [StorefrontApiController::class, 'getCart']);
        Route::post('/cart', [StorefrontApiController::class, 'addToCart']);
        Route::post('/cart/service', [StorefrontApiController::class, 'addServiceToCart']);
        Route::patch('/cart/{item}', [StorefrontApiController::class, 'updateCartItem'])->whereNumber('item');
        Route::delete('/cart/{item}', [StorefrontApiController::class, 'removeCartItem'])->whereNumber('item');
        Route::get('/cart/summary', [StorefrontApiController::class, 'cartSummary']);

        Route::middleware('guest:customer')->group(function () {
            Route::post('/auth/login', [StorefrontApiController::class, 'login'])
                ->middleware('throttle:5,1');
            Route::post('/auth/register', [StorefrontApiController::class, 'register'])
                ->middleware('throttle:3,1');
            Route::post('/auth/forgot-password', [StorefrontApiController::class, 'forgotPassword'])
                ->middleware('throttle:3,1');
            Route::post('/auth/reset-password', [StorefrontApiController::class, 'resetPassword'])
                ->middleware('throttle:3,1');
        });

        Route::middleware('auth:customer')->group(function () {
            Route::post('/auth/logout', [StorefrontApiController::class, 'logout']);
            Route::post('/auth/verify-email/resend', [StorefrontApiController::class, 'resendVerification'])
                ->middleware('throttle:6,1');
            Route::post('/checkout', [StorefrontApiController::class, 'processCheckout']);
            Route::patch('/account/profile', [StorefrontApiController::class, 'updateProfile']);
            Route::post('/account/orders/{order}/cancel', [StorefrontApiController::class, 'cancelOrder']);
        });
    });

    // Payment gateway callbacks
    Route::get('/payment/callback', [CheckoutController::class, 'paymentCallback'])->name('payment.callback');
    Route::post('/payment/webhook', [CheckoutController::class, 'paymentWebhook'])
        ->withoutMiddleware(['storefront.enabled', \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('payment.webhook');

    // Email verification (signed URL — outside auth group)
    Route::get('/verify-email/{id}/{hash}', [CustomerAuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');

    // Authenticated customer pages
    Route::middleware('auth:customer')->group(function () {
        Route::post('/logout', [CustomerAuthController::class, 'logout'])->name('logout');

        Route::get('/verify-email', [StorefrontRenderController::class, 'verifyEmail'])->name('verification.notice');
        Route::post('/email/verification-notification', [CustomerAuthController::class, 'resendVerificationEmail'])
            ->middleware('throttle:6,1')
            ->name('verification.send');

        Route::get('/checkout', [StorefrontRenderController::class, 'checkout'])->name('checkout');
        Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');
        Route::get('/checkout/success/{order}', [StorefrontRenderController::class, 'checkoutSuccess'])->name('checkout.success');
        Route::get('/checkout/pending/{order}', [StorefrontRenderController::class, 'checkoutPending'])->name('checkout.pending');

        Route::prefix('account')->name('account.')->group(function () {
            Route::get('/', [StorefrontRenderController::class, 'accountDashboard'])->name('dashboard');
            Route::get('/orders', [StorefrontRenderController::class, 'accountOrders'])->name('orders');
            Route::get('/orders/{order}', [StorefrontRenderController::class, 'accountOrderDetail'])->name('orders.show');
            Route::post('/orders/{order}/cancel', [CustomerPortalController::class, 'cancelOrder'])->name('orders.cancel');
            Route::get('/profile', [StorefrontRenderController::class, 'accountProfile'])->name('profile');
            Route::patch('/profile', [CustomerPortalController::class, 'updateProfile'])->name('profile.update');
        });
    });
});
