<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FundRequestController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ServiceAddonController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceVariantController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierCatalogController;
use App\Http\Controllers\SupplierConnectionController;
use App\Http\Controllers\SupplierProfileController;
use App\Http\Controllers\ShopSettingsController;
use App\Http\Controllers\StaffPayrollController;
use App\Http\Controllers\TimesheetController;
use App\Http\Controllers\WageAdvanceController;
use App\Http\Controllers\Web\StaffManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/refresh', [DashboardController::class, 'refresh'])->name('dashboard.refresh');

    // Reports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/sales', [ReportsController::class, 'sales'])->name('sales');
        Route::get('/sales/export', [ReportsController::class, 'exportSales'])->name('sales.export');
        Route::get('/inventory', [ReportsController::class, 'inventory'])->name('inventory');
        Route::get('/inventory/export', [ReportsController::class, 'exportInventory'])->name('inventory.export');
        Route::get('/suppliers', [ReportsController::class, 'suppliers'])->name('suppliers');
        Route::get('/suppliers/export', [ReportsController::class, 'exportSuppliers'])->name('suppliers.export');
        Route::get('/financials', [ReportsController::class, 'financials'])->name('financials');
        Route::get('/financials/export', [ReportsController::class, 'exportFinancials'])->name('financials.export');
        Route::get('/customer-analytics', [ReportsController::class, 'customerAnalytics'])->name('customer-analytics');
        Route::get('/customer-analytics/export', [ReportsController::class, 'exportCustomerAnalytics'])->name('customer-analytics.export');
        Route::get('/product-profitability', [ReportsController::class, 'productProfitability'])->name('product-profitability');
        Route::get('/product-profitability/export', [ReportsController::class, 'exportProductProfitability'])->name('product-profitability.export');
    });

    Route::prefix('staff')->name('users.')->group(function () {
        Route::get('/', [StaffManagementController::class, 'index'])->name('index');
        Route::get('/create', [StaffManagementController::class, 'create'])->name('create');
        Route::post('/', [StaffManagementController::class, 'store'])->name('store');
        Route::get('/{staff}', [StaffManagementController::class, 'show'])->name('show');
        Route::get('/{staff}/edit', [StaffManagementController::class, 'edit'])->name('edit');
        Route::put('/{staff}', [StaffManagementController::class, 'update'])->name('update');
        Route::delete('/{staff}', [StaffManagementController::class, 'destroy'])->name('destroy');

        Route::post('/{employee}/payroll', [StaffPayrollController::class, 'store'])->name('payroll.store');
        Route::patch('/{employee}/payroll/deductions', [StaffPayrollController::class, 'updateDeductions'])->name('payroll.deductions.update');
        Route::patch('/{employee}/payroll/tax-settings', [StaffPayrollController::class, 'updateTaxSettings'])->name('payroll.tax-settings.update');
    });

    Route::prefix('timesheets')->name('timesheets.')->group(function () {
        Route::get('/', [TimesheetController::class, 'index'])->name('index');
        Route::get('/approval-queue', [TimesheetController::class, 'approvalQueue'])->name('approval-queue');
        Route::get('/{timesheet}', [TimesheetController::class, 'show'])->name('show');

        Route::post('/clock-in', [TimesheetController::class, 'clockIn'])->name('clock-in');
        Route::post('/{timesheet}/clock-out', [TimesheetController::class, 'clockOut'])->name('clock-out');
        Route::post('/{timesheet}/start-break', [TimesheetController::class, 'startBreak'])->name('start-break');
        Route::post('/{timesheet}/end-break', [TimesheetController::class, 'endBreak'])->name('end-break');

        Route::patch('/{timesheet}', [TimesheetController::class, 'update'])->name('update');
        Route::post('/{timesheet}/submit', [TimesheetController::class, 'submit'])->name('submit');
        Route::post('/{timesheet}/approve', [TimesheetController::class, 'approve'])->name('approve');
        Route::post('/{timesheet}/reject', [TimesheetController::class, 'reject'])->name('reject');

        Route::delete('/{timesheet}', [TimesheetController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('fund-requests')->name('fund-requests.')->group(function () {
        Route::get('/', [FundRequestController::class, 'index'])->name('index');
        Route::get('/approval-queue', [FundRequestController::class, 'approvalQueue'])->name('approval-queue');
        Route::get('/create', [FundRequestController::class, 'create'])->name('create');
        Route::post('/', [FundRequestController::class, 'store'])->name('store');
        Route::get('/{fundRequest}', [FundRequestController::class, 'show'])->name('show');

        Route::patch('/{fundRequest}', [FundRequestController::class, 'update'])->name('update');
        Route::post('/{fundRequest}/approve', [FundRequestController::class, 'approve'])->name('approve');
        Route::post('/{fundRequest}/reject', [FundRequestController::class, 'reject'])->name('reject');
        Route::post('/{fundRequest}/disburse', [FundRequestController::class, 'disburse'])->name('disburse');
        Route::post('/{fundRequest}/cancel', [FundRequestController::class, 'cancel'])->name('cancel');

        Route::delete('/{fundRequest}', [FundRequestController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('wage-advances')->name('wage-advances.')->group(function () {
        Route::get('/', [WageAdvanceController::class, 'index'])->name('index');
        Route::get('/approval-queue', [WageAdvanceController::class, 'approvalQueue'])->name('approval-queue');
        Route::get('/create', [WageAdvanceController::class, 'create'])->name('create');
        Route::post('/', [WageAdvanceController::class, 'store'])->name('store');
        Route::get('/{wageAdvance}', [WageAdvanceController::class, 'show'])->name('show');

        Route::patch('/{wageAdvance}', [WageAdvanceController::class, 'update'])->name('update');
        Route::post('/{wageAdvance}/approve', [WageAdvanceController::class, 'approve'])->name('approve');
        Route::post('/{wageAdvance}/reject', [WageAdvanceController::class, 'reject'])->name('reject');
        Route::post('/{wageAdvance}/disburse', [WageAdvanceController::class, 'disburse'])->name('disburse');
        Route::post('/{wageAdvance}/record-repayment', [WageAdvanceController::class, 'recordRepayment'])->name('record-repayment');
        Route::post('/{wageAdvance}/cancel', [WageAdvanceController::class, 'cancel'])->name('cancel');

        Route::delete('/{wageAdvance}', [WageAdvanceController::class, 'destroy'])->name('destroy');
    });

    Route::resource('shops', ShopController::class);

    Route::prefix('shops/{shop}/storefront-settings')->name('shops.storefront-settings.')->group(function () {
        Route::get('/', [ShopController::class, 'editStorefrontSettings'])->name('edit');
        Route::patch('/', [ShopController::class, 'updateStorefrontSettings'])->name('update');
    });

    Route::prefix('shops/{shop}/tax-settings')->name('shops.tax-settings.')->group(function () {
        Route::get('/', [ShopSettingsController::class, 'show'])->name('show');
        Route::patch('/', [ShopSettingsController::class, 'update'])->name('update');
    });

    Route::resource('categories', ProductCategoryController::class);

    Route::resource('products', ProductController::class);

    // Image Management Routes
    Route::prefix('images')->name('images.')->group(function () {
        Route::post('/upload', [ImageController::class, 'upload'])->name('upload');
        Route::put('/{image}', [ImageController::class, 'update'])->name('update');
        Route::delete('/{image}', [ImageController::class, 'destroy'])->name('destroy');
        Route::post('/{image}/set-primary', [ImageController::class, 'setPrimary'])->name('set-primary');
        Route::post('/reorder', [ImageController::class, 'reorder'])->name('reorder');
    });

    // Service Management Routes
    Route::resource('service-categories', ServiceCategoryController::class);
    Route::resource('services', ServiceController::class);

    // Service Variants
    Route::prefix('services/{service}/variants')->name('services.variants.')->group(function () {
        Route::post('/', [ServiceVariantController::class, 'store'])->name('store');
        Route::put('/{variant}', [ServiceVariantController::class, 'update'])->name('update');
        Route::delete('/{variant}', [ServiceVariantController::class, 'destroy'])->name('destroy');
    });

    // Service Addons
    Route::prefix('services/{service}/addons')->name('services.addons.')->group(function () {
        Route::post('/', [ServiceAddonController::class, 'store'])->name('store');
    });

    // Category-wide Addons
    Route::prefix('service-categories/{category}/addons')->name('service-categories.addons.')->group(function () {
        Route::post('/', [ServiceAddonController::class, 'storeForCategory'])->name('store');
    });

    // Common Addon Routes
    Route::prefix('service-addons')->name('service-addons.')->group(function () {
        Route::put('/{addon}', [ServiceAddonController::class, 'update'])->name('update');
        Route::delete('/{addon}', [ServiceAddonController::class, 'destroy'])->name('destroy');
    });

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
