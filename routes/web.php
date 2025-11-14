<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierCatalogController;
use App\Http\Controllers\SupplierConnectionController;
use App\Http\Controllers\SupplierProfileController;
use App\Http\Controllers\Web\StaffManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/refresh', [DashboardController::class, 'refresh'])->name('dashboard.refresh');

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

    Route::prefix('supplier')->name('supplier.')->group(function () {
        Route::prefix('profile')->name('profile.')->group(function () {
            Route::get('/', [SupplierProfileController::class, 'index'])->name('index');
            Route::post('/enable', [SupplierProfileController::class, 'enable'])->name('enable');
            Route::put('/{profile}', [SupplierProfileController::class, 'update'])->name('update');
            Route::post('/disable', [SupplierProfileController::class, 'disable'])->name('disable');
        });

        Route::prefix('catalog')->name('catalog.')->group(function () {
            Route::get('/', [SupplierCatalogController::class, 'index'])->name('index');
            Route::get('/create', [SupplierCatalogController::class, 'create'])->name('create');
            Route::post('/', [SupplierCatalogController::class, 'store'])->name('store');
            Route::get('/{catalogItem}/edit', [SupplierCatalogController::class, 'edit'])->name('edit');
            Route::put('/{catalogItem}', [SupplierCatalogController::class, 'update'])->name('update');
            Route::delete('/{catalogItem}', [SupplierCatalogController::class, 'destroy'])->name('destroy');
            Route::get('/browse/{supplier?}', [SupplierCatalogController::class, 'browse'])->name('browse');
        });

        Route::prefix('connections')->name('connections.')->group(function () {
            Route::get('/', [SupplierConnectionController::class, 'index'])->name('index');
            Route::get('/pending', [SupplierConnectionController::class, 'pending'])->name('pending');
            Route::post('/{supplierTenant}', [SupplierConnectionController::class, 'store'])->name('store');
            Route::post('/{connection}/approve', [SupplierConnectionController::class, 'approve'])->name('approve');
            Route::post('/{connection}/reject', [SupplierConnectionController::class, 'reject'])->name('reject');
            Route::post('/{connection}/suspend', [SupplierConnectionController::class, 'suspend'])->name('suspend');
            Route::post('/{connection}/activate', [SupplierConnectionController::class, 'activate'])->name('activate');
            Route::put('/{connection}/terms', [SupplierConnectionController::class, 'updateTerms'])->name('update-terms');
        });
    });

    Route::prefix('purchase-orders')->name('purchase-orders.')->group(function () {
        Route::get('/', [PurchaseOrderController::class, 'index'])->name('index');
        Route::get('/supplier', [PurchaseOrderController::class, 'supplier'])->name('supplier');
        Route::get('/create', [PurchaseOrderController::class, 'create'])->name('create');
        Route::post('/', [PurchaseOrderController::class, 'store'])->name('store');
        Route::get('/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('show');
        Route::post('/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit'])->name('submit');
        Route::post('/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('approve');
        Route::post('/{purchaseOrder}/ship', [PurchaseOrderController::class, 'ship'])->name('ship');
        Route::post('/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('receive');
        Route::post('/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->name('cancel');
        Route::post('/{purchaseOrder}/payment', [PurchaseOrderController::class, 'recordPayment'])->name('record-payment');
    });

});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
