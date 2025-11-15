<?php

use App\Http\Controllers\Storefront\CartController;
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
    // Shop home and product browsing
    Route::get('/', [StorefrontController::class, 'index'])->name('index');
    Route::get('/products', [StorefrontController::class, 'products'])->name('products');
    Route::get('/products/{product:slug}', [StorefrontController::class, 'show'])->name('product');

    // Shopping cart
    Route::get('/cart', [CartController::class, 'index'])->name('cart');
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/{item}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{item}', [CartController::class, 'destroy'])->name('cart.destroy');
});
