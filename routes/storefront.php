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
            ->middleware('throttle:5,1'); // 5 attempts per minute
        Route::get('/register', [CustomerAuthController::class, 'showRegister'])->name('register');
        Route::post('/register', [CustomerAuthController::class, 'register'])
            ->middleware('throttle:3,1'); // 3 registrations per minute
    });

    Route::middleware('auth:customer')->group(function () {
        Route::post('/logout', [CustomerAuthController::class, 'logout'])->name('logout');

        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');
        Route::get('/checkout/success/{order}', [CheckoutController::class, 'success'])->name('checkout.success');

        Route::prefix('account')->name('account.')->group(function () {
            Route::get('/', [CustomerPortalController::class, 'dashboard'])->name('dashboard');
            Route::get('/orders', [CustomerPortalController::class, 'orders'])->name('orders');
            Route::get('/orders/{order}', [CustomerPortalController::class, 'orderDetail'])->name('orders.show');
            Route::get('/profile', [CustomerPortalController::class, 'profile'])->name('profile');
            Route::patch('/profile', [CustomerPortalController::class, 'updateProfile'])->name('profile.update');
        });
    });
});
