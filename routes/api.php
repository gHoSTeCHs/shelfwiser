<?php

use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\Webhooks\PaymentWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/webhooks/payment/{gateway}', [PaymentWebhookController::class, 'handle'])
    ->name('webhooks.payment');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payment/gateways', [PaymentController::class, 'gateways'])->name('api.payment.gateways');

    // Sync endpoints for offline POS
    Route::prefix('sync')->name('api.sync.')->group(function () {
        Route::get('/products', [SyncController::class, 'syncProducts'])->name('products');
        Route::get('/customers', [SyncController::class, 'syncCustomers'])->name('customers');
        Route::post('/orders', [SyncController::class, 'syncOrders'])->name('orders');
    });
});
