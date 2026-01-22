<?php

use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\CustomerAuthController;
use App\Http\Controllers\Storefront\CustomerPortalController;
use App\Http\Controllers\Storefront\StorefrontController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Storefront Routes
|--------------------------------------------------------------------------
|
| Public-facing e-commerce routes for customers to browse and shop.
| Routes are scoped to a specific shop using the shop slug.
|
*/

Route::prefix('store/{shop:slug}')->name('storefront.')->group(function () {
    Route::get('/', [StorefrontController::class, 'index'])->name('index');
    Route::get('/products', [StorefrontController::class, 'products'])->name('products');
    Route::get('/products/{product:slug}', [StorefrontController::class, 'show'])->name('product');
    Route::get('/services', [StorefrontController::class, 'services'])->name('services');
    Route::get('/services/{service:slug}', [StorefrontController::class, 'showService'])->name('service');

    Route::get('/cart', [CartController::class, 'index'])->name('cart');
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::post('/cart/service', [CartController::class, 'storeService'])->name('cart.store-service');
    Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{item}', [CartController::class, 'destroy'])->name('cart.destroy');

    Route::middleware('guest:customer')->group(function () {
        Route::get('/login', [CustomerAuthController::class, 'showLogin'])->name('login');
        Route::post('/login', [CustomerAuthController::class, 'login'])
            ->middleware('throttle:5,1');
        Route::get('/register', [CustomerAuthController::class, 'showRegister'])->name('register');
        Route::post('/register', [CustomerAuthController::class, 'register'])
            ->middleware('throttle:3,1');

        Route::get('/forgot-password', [CustomerAuthController::class, 'showForgotPassword'])->name('password.request');
        Route::post('/forgot-password', [CustomerAuthController::class, 'sendResetLink'])
            ->middleware('throttle:3,1')
            ->name('password.email');
        Route::get('/reset-password/{token}', [CustomerAuthController::class, 'showResetPassword'])->name('password.reset');
        Route::post('/reset-password', [CustomerAuthController::class, 'resetPassword'])
            ->middleware('throttle:3,1')
            ->name('password.update');
    });

    Route::get('/payment/callback', [CheckoutController::class, 'paymentCallback'])->name('payment.callback');
    Route::post('/payment/webhook', [CheckoutController::class, 'paymentWebhook'])->name('payment.webhook');

    Route::get('/verify-email/{id}/{hash}', [CustomerAuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');

    Route::middleware('auth:customer')->group(function () {
        Route::post('/logout', [CustomerAuthController::class, 'logout'])->name('logout');

        Route::get('/verify-email', [CustomerAuthController::class, 'showVerificationNotice'])->name('verification.notice');
        Route::post('/email/verification-notification', [CustomerAuthController::class, 'resendVerificationEmail'])
            ->middleware('throttle:6,1')
            ->name('verification.send');

        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');
        Route::get('/checkout/success/{order}', [CheckoutController::class, 'success'])->name('checkout.success');
        Route::get('/checkout/pending/{order}', [CheckoutController::class, 'paymentPending'])->name('checkout.pending');

        Route::prefix('account')->name('account.')->group(function () {
            Route::get('/', [CustomerPortalController::class, 'dashboard'])->name('dashboard');
            Route::get('/orders', [CustomerPortalController::class, 'orders'])->name('orders');
            Route::get('/orders/{order}', [CustomerPortalController::class, 'orderDetail'])->name('orders.show');
            Route::post('/orders/{order}/cancel', [CustomerPortalController::class, 'cancelOrder'])->name('orders.cancel');
            Route::get('/profile', [CustomerPortalController::class, 'profile'])->name('profile');
            Route::patch('/profile', [CustomerPortalController::class, 'updateProfile'])->name('profile.update');
        });
    });
});
