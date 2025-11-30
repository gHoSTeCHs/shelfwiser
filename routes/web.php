<?php

use App\Http\Controllers\Admin\AdminApiController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminProductTemplateController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminSubscriptionController;
use App\Http\Controllers\Admin\AdminTenantController;
use App\Http\Controllers\CustomerCreditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeCustomDeductionController;
use App\Http\Controllers\FundRequestController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderPaymentController;
use App\Http\Controllers\OrderReturnController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductTemplateController;
use App\Http\Controllers\ProductVariantController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ServiceAddonController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceVariantController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\ShopSettingsController;
use App\Http\Controllers\StaffPayrollController;
use App\Http\Controllers\ReorderAlertController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockTakeController;
use App\Http\Controllers\SupplierCatalogController;
use App\Http\Controllers\SupplierConnectionController;
use App\Http\Controllers\SupplierProfileController;
use App\Http\Controllers\TimesheetController;
use App\Http\Controllers\WageAdvanceController;
use App\Http\Controllers\Web\StaffManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/offline', function () {
    return view('offline');
})->name('offline');

Route::middleware(['auth', 'super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

    Route::resource('tenants', AdminTenantController::class);

    Route::prefix('tenants/{tenant}')->name('tenants.')->group(function () {
        Route::post('/toggle-active', [AdminTenantController::class, 'toggleActive'])->name('toggle-active');
        Route::post('/extend-subscription', [AdminTenantController::class, 'extendSubscription'])->name('extend-subscription');
        Route::patch('/update-limits', [AdminTenantController::class, 'updateLimits'])->name('update-limits');
    });

    Route::resource('product-templates', AdminProductTemplateController::class);

    // Platform Settings
    Route::prefix('subscriptions')->name('subscriptions.')->group(function () {
        Route::get('/', [AdminSubscriptionController::class, 'index'])->name('index');
    });

    Route::prefix('api')->name('api.')->group(function () {
        Route::get('/', [AdminApiController::class, 'index'])->name('index');
        Route::post('/', [AdminApiController::class, 'store'])->name('store');
        Route::delete('/{key}', [AdminApiController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [AdminSettingsController::class, 'index'])->name('index');
        Route::patch('/', [AdminSettingsController::class, 'update'])->name('update');
        Route::post('/clear-cache', [AdminSettingsController::class, 'clearCache'])->name('clear-cache');
    });
});

Route::get('/payment/callback/{gateway}/{order}', [PaymentController::class, 'callback'])
    ->name('payment.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('payment')->name('payment.')->group(function () {
        Route::post('/orders/{order}/initialize', [PaymentController::class, 'initialize'])->name('initialize');
        Route::get('/orders/{order}/verify', [PaymentController::class, 'verify'])->name('verify');
    });

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/refresh', [DashboardController::class, 'refresh'])->name('dashboard.refresh');

    Route::get('/toast-demo', function () {
        return Inertia::render('ToastDemo');
    })->name('toast-demo');

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

        // Custom deductions
        Route::prefix('{employee}/deductions')->name('deductions.')->group(function () {
            Route::get('/', [EmployeeCustomDeductionController::class, 'index'])->name('index');
            Route::get('/create', [EmployeeCustomDeductionController::class, 'create'])->name('create');
            Route::post('/', [EmployeeCustomDeductionController::class, 'store'])->name('store');
            Route::get('/{deduction}/edit', [EmployeeCustomDeductionController::class, 'edit'])->name('edit');
            Route::put('/{deduction}', [EmployeeCustomDeductionController::class, 'update'])->name('update');
            Route::delete('/{deduction}', [EmployeeCustomDeductionController::class, 'destroy'])->name('destroy');
            Route::post('/{deduction}/toggle-status', [EmployeeCustomDeductionController::class, 'toggleStatus'])->name('toggle-status');
        });
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

    Route::prefix('payroll')->name('payroll.')->group(function () {
        Route::get('/', [PayrollController::class, 'index'])->name('index');
        Route::get('/create', [PayrollController::class, 'create'])->name('create');
        Route::post('/', [PayrollController::class, 'store'])->name('store');
        Route::get('/my-payslips', [PayrollController::class, 'myPayslips'])->name('my-payslips');
        Route::get('/payslip/{payslip}', [PayrollController::class, 'showPayslip'])->name('show-payslip');
        Route::get('/{payrollPeriod}', [PayrollController::class, 'show'])->name('show');

        Route::post('/{payrollPeriod}/process', [PayrollController::class, 'process'])->name('process');
        Route::post('/{payrollPeriod}/approve', [PayrollController::class, 'approve'])->name('approve');
        Route::post('/{payrollPeriod}/mark-as-paid', [PayrollController::class, 'markAsPaid'])->name('mark-as-paid');
        Route::post('/{payrollPeriod}/cancel', [PayrollController::class, 'cancel'])->name('cancel');

        Route::delete('/{payrollPeriod}', [PayrollController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-as-read');
        Route::post('/{notification}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('mark-as-read');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('destroy');
        Route::delete('/read/all', [NotificationController::class, 'deleteAllRead'])->name('delete-all-read');
    });

    Route::resource('shops', ShopController::class);

    Route::prefix('shops/{shop}/stock-take')->name('shops.stock-take.')->group(function () {
        Route::get('/', [StockTakeController::class, 'index'])->name('index');
        Route::post('/', [StockTakeController::class, 'store'])->name('store');
    });

    Route::get('/reorder-alerts', [ReorderAlertController::class, 'index'])->name('reorder-alerts.index');
    Route::get('/shops/{shop}/reorder-alerts', [ReorderAlertController::class, 'index'])->name('shops.reorder-alerts.index');

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

    // Product Variant Routes
    Route::prefix('variants')->name('variants.')->group(function () {
        Route::get('/{variant}/edit', [ProductVariantController::class, 'edit'])->name('edit');
        Route::put('/{variant}', [ProductVariantController::class, 'update'])->name('update');
    });

    // Product Templates (for tenants)
    Route::prefix('product-templates')->name('product-templates.')->group(function () {
        Route::get('/available', [ProductTemplateController::class, 'available'])->name('available');
        Route::get('/{productTemplate}', [ProductTemplateController::class, 'show'])->name('show');
        Route::post('/{productTemplate}/shops/{shop}/create-product', [ProductTemplateController::class, 'createProduct'])->name('create-product');
        Route::post('/save', [ProductTemplateController::class, 'saveAsTemplate'])->name('save');
    });

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
        Route::post('/{order}/refund', [OrderController::class, 'refund'])->name('refund');
        Route::post('/{order}/payments', [OrderPaymentController::class, 'store'])->name('payments.store');
        Route::delete('/payments/{orderPayment}', [OrderPaymentController::class, 'destroy'])->name('payments.destroy');
    });

    // Order Returns
    Route::prefix('returns')->name('returns.')->group(function () {
        Route::get('/', [OrderReturnController::class, 'index'])->name('index');
        Route::get('/{return}', [OrderReturnController::class, 'show'])->name('show');
        Route::post('/{return}/approve', [OrderReturnController::class, 'approve'])->name('approve');
        Route::post('/{return}/reject', [OrderReturnController::class, 'reject'])->name('reject');
        Route::post('/{return}/complete', [OrderReturnController::class, 'complete'])->name('complete');
    });

    Route::get('/orders/{order}/return', [OrderReturnController::class, 'create'])->name('orders.return.create');
    Route::post('/orders/{order}/return', [OrderReturnController::class, 'store'])->name('orders.return.store');

    Route::prefix('customers/{shop}')->name('customers.')->group(function () {
        Route::get('/credit', [CustomerCreditController::class, 'index'])->name('credit.index');
        Route::get('/credit/{customer}', [CustomerCreditController::class, 'show'])->name('credit.show');
        Route::get('/credit/{customer}/payment', [CustomerCreditController::class, 'createPayment'])->name('credit.payment.create');
        Route::post('/credit/{customer}/payment', [CustomerCreditController::class, 'storePayment'])->name('credit.payment.store');
        Route::get('/credit/{customer}/transactions', [CustomerCreditController::class, 'transactions'])->name('credit.transactions');
    });

    Route::prefix('receipts')->name('receipts.')->group(function () {
        Route::get('/', [ReceiptController::class, 'index'])->name('index');
        Route::get('/{receipt}', [ReceiptController::class, 'show'])->name('show');
        Route::post('/{receipt}/email', [ReceiptController::class, 'emailReceipt'])->name('email');
        Route::get('/orders/{order}/view', [ReceiptController::class, 'viewOrderReceipt'])->name('orders.view');
        Route::get('/orders/{order}/download', [ReceiptController::class, 'downloadOrderReceipt'])->name('orders.download');
        Route::get('/payments/{payment}/view', [ReceiptController::class, 'viewPaymentReceipt'])->name('payments.view');
        Route::get('/payments/{payment}/download', [ReceiptController::class, 'downloadPaymentReceipt'])->name('payments.download');
    });

    Route::prefix('pos/{shop}')->name('pos.')->group(function () {
        Route::get('/', [POSController::class, 'index'])->name('index');
        Route::get('/search/products', [POSController::class, 'searchProducts'])->name('search.products');
        Route::get('/search/customers', [POSController::class, 'searchCustomers'])->name('search.customers');
        Route::post('/complete', [POSController::class, 'completeSale'])->name('complete');
        Route::get('/session-summary', [POSController::class, 'sessionSummary'])->name('session-summary');
        Route::post('/hold', [POSController::class, 'holdSale'])->name('hold');
        Route::get('/held-sales', [POSController::class, 'heldSales'])->name('held-sales');
        Route::get('/held-sales/{holdId}', [POSController::class, 'retrieveHeldSale'])->name('retrieve-held-sale');
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

require __DIR__ . '/storefront.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

