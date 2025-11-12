<?php

use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\Web\StaffManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('staff')->name('users.')->group(function () {
        Route::get('/', [StaffManagementController::class, 'index'])->name('index');
        Route::get('/create', [StaffManagementController::class, 'create'])->name('create');
        Route::post('/', [StaffManagementController::class, 'store'])->name('store');
        Route::get('/{staff}', [StaffManagementController::class, 'show'])->name('show');
        Route::get('/{staff}/edit', [StaffManagementController::class, 'edit'])->name('edit');
        Route::put('/{staff}', [StaffManagementController::class, 'update'])->name('update');
        Route::delete('/{staff}', [StaffManagementController::class, 'destroy'])->name('destroy');
    });

    Route::resource('shops', ShopController::class);

    Route::resource('categories', ProductCategoryController::class);

    Route::resource('products', ProductController::class);

    Route::resource('orders', OrderController::class);

    Route::prefix('orders')->name('orders.')->group(function () {
        Route::post('/{order}/status', [OrderController::class, 'updateStatus'])->name('update-status');
        Route::post('/{order}/payment', [OrderController::class, 'updatePaymentStatus'])->name('update-payment');
    });

    Route::prefix('stock-movements')->name('stock-movements.')->group(function () {
        Route::get('/', [StockMovementController::class, 'index'])->name('index');
        Route::get('/export', [StockMovementController::class, 'export'])->name('export');
        Route::get('/{stockMovement}', [StockMovementController::class, 'show'])->name('show');
        Route::post('/adjust', [StockMovementController::class, 'adjustStock'])->name('adjust');
        Route::post('/transfer', [StockMovementController::class, 'transferStock'])->name('transfer');
        Route::post('/stock-take', [StockMovementController::class, 'stockTake'])->name('stock-take');
        Route::post('/variant/{variant}/setup-locations', [StockMovementController::class, 'setupLocations'])->name('setup-locations');
        Route::get('/variant/{variant}/history', [StockMovementController::class, 'history'])->name('history');
    });

});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
