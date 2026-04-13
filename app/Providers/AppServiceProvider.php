<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\EmployeeDeduction;
use App\Models\EmployeeEarning;
use App\Models\FundRequest;
use App\Models\HeldSale;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductVariant;
use App\Models\Receipt;
use App\Models\Service;
use App\Models\Shop;
use App\Models\StockMovement;
use App\Models\Timesheet;
use App\Models\User;
use App\Models\WageAdvance;
use App\Policies\CustomerPolicy;
use App\Policies\DashboardPolicy;
use App\Policies\EmployeeDeductionPolicy;
use App\Policies\EmployeeEarningPolicy;
use App\Policies\EmployeePayrollPolicy;
use App\Policies\FundRequestPolicy;
use App\Policies\HeldSalePolicy;
use App\Policies\NotificationPolicy;
use App\Policies\OrderItemPolicy;
use App\Policies\OrderPaymentPolicy;
use App\Policies\OrderPolicy;
use App\Policies\PayrollPolicy;
use App\Policies\PayRunPolicy;
use App\Policies\ProductOptionPolicy;
use App\Policies\ProductPolicy;
use App\Policies\ProductVariantPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\ReceiptPolicy;
use App\Policies\ReportPolicy;
use App\Policies\ServicePolicy;
use App\Policies\ShopPolicy;
use App\Policies\StaffPolicy;
use App\Policies\StockMovementPolicy;
use App\Policies\StorefrontPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\SyncPolicy;
use App\Policies\TimesheetPolicy;
use App\Policies\WageAdvancePolicy;
use App\Support\Cache\TaggableDatabaseStore;
use Illuminate\Cache\DatabaseStore;
use Illuminate\Cache\Repository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->booting(function () {
            Cache::extend('database', function ($app, $config) {
                $connection = $app['db']->connection($config['connection'] ?? null);

                $inner = new DatabaseStore(
                    $connection,
                    $config['table'] ?? 'cache',
                    $app['config']['cache.prefix'] ?? '',
                    $config['lock_connection'] ?? null,
                    $config['lock_table'] ?? null,
                );

                return new Repository(new TaggableDatabaseStore($inner));
            });
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols();
        });

        Gate::policy(User::class, StaffPolicy::class);
        Gate::policy(Shop::class, ShopPolicy::class);
        Gate::policy(Shop::class, StorefrontPolicy::class);
        Gate::policy(Service::class, ServicePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(ProductOption::class, ProductOptionPolicy::class);
        Gate::policy(ProductVariant::class, ProductVariantPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(OrderItem::class, OrderItemPolicy::class);
        Gate::policy(OrderPayment::class, OrderPaymentPolicy::class);
        Gate::policy(Receipt::class, ReceiptPolicy::class);
        Gate::policy(HeldSale::class, HeldSalePolicy::class);
        Gate::policy(Timesheet::class, TimesheetPolicy::class);
        Gate::policy(FundRequest::class, FundRequestPolicy::class);
        Gate::policy(WageAdvance::class, WageAdvancePolicy::class);
        Gate::policy(PayrollPeriod::class, PayrollPolicy::class);
        Gate::policy(PayRun::class, PayRunPolicy::class);
        Gate::policy(EmployeeDeduction::class, EmployeeDeductionPolicy::class);
        Gate::policy(EmployeeEarning::class, EmployeeEarningPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);
        Gate::policy(StockMovement::class, StockMovementPolicy::class);

        Gate::define('payRun.viewAny', [PayRunPolicy::class, 'viewAny']);
        Gate::define('payRun.create', [PayRunPolicy::class, 'create']);
        Gate::define('payRun.viewReports', [PayRunPolicy::class, 'viewReports']);
        Gate::define('payRun.exportReports', [PayRunPolicy::class, 'exportReports']);
        Gate::define('payRun.manageSettings', [PayRunPolicy::class, 'manageSettings']);

        // Dashboard polices
        Gate::define('dashboard.view', [DashboardPolicy::class, 'view']);
        Gate::define('dashboard.view_financials', [DashboardPolicy::class, 'viewFinancials']);
        Gate::define('dashboard.view_profits', [DashboardPolicy::class, 'viewProfits']);
        Gate::define('dashboard.view_costs', [DashboardPolicy::class, 'viewCosts']);
        Gate::define('dashboard.refresh_cache', [DashboardPolicy::class, 'refreshCache']);

        // Shop polices
        Gate::define('shop.view', [ShopPolicy::class, 'view']);
        Gate::define('shop.manage', [ShopPolicy::class, 'manage']);

        // Catalog polices
        Gate::define('catalog.manage', [SupplierPolicy::class, 'manageCatalog']);
        Gate::define('catalog.viewAny', [SupplierPolicy::class, 'viewAny']);
        Gate::define('catalog.view', [SupplierPolicy::class, 'view']);
        Gate::define('catalog.enableSupplierMode', [SupplierPolicy::class, 'enableSupplierMode']);
        Gate::define('catalog.updateProfile', [SupplierPolicy::class, 'updateProfile']);
        Gate::define('catalog.viewCatalog', [SupplierPolicy::class, 'viewCatalog']);

        // PurchaseOrder Polices
        Gate::define('purchaseOrder.viewAny', [PurchaseOrderPolicy::class, 'viewAny']);
        Gate::define('purchaseOrder.view', [PurchaseOrderPolicy::class, 'view']);
        Gate::define('purchaseOrder.create', [PurchaseOrderPolicy::class, 'create']);
        Gate::define('purchaseOrder.update', [PurchaseOrderPolicy::class, 'update']);
        Gate::define('purchaseOrder.delete', [PurchaseOrderPolicy::class, 'delete']);
        Gate::define('purchaseOrder.submit', [PurchaseOrderPolicy::class, 'submit']);
        Gate::define('purchaseOrder.approve', [PurchaseOrderPolicy::class, 'approve']);
        Gate::define('purchaseOrder.ship', [PurchaseOrderPolicy::class, 'ship']);
        Gate::define('purchaseOrder.receive', [PurchaseOrderPolicy::class, 'receive']);
        Gate::define('purchaseOrder.cancel', [PurchaseOrderPolicy::class, 'cancel']);
        Gate::define('purchaseOrder.recordPayment', [PurchaseOrderPolicy::class, 'recordPayment']);
        Gate::define('purchaseOrder.viewAsSupplier', [PurchaseOrderPolicy::class, 'viewAsSupplier']);
        Gate::define('purchaseOrder.viewAsBuyer', [PurchaseOrderPolicy::class, 'viewAsBuyer']);

        // Report Polices
        Gate::define('reports.view', [ReportPolicy::class, 'view']);

        // TimeSheet
        Gate::define('timesheet.viewAny', [TimesheetPolicy::class, 'viewAny']);

        // Payroll settings — view_payroll permission covers read access
        Gate::define('view_payroll_settings', fn (User $user) => $user->role->hasPermission('view_payroll'));
        Gate::define('manage_payroll_settings', fn (User $user) => $user->role->hasPermission('manage_payroll_settings'));

        // Payroll reports
        Gate::define('view_payroll_reports', fn (User $user) => $user->role->hasPermission('view_payroll_reports'));
        Gate::define('export_payroll_reports', fn (User $user) => $user->role->hasPermission('export_payroll_reports'));

        // Employee payroll detail access (User model bound to StaffPolicy, so use named gates)
        Gate::define('viewPayrollDetails', [EmployeePayrollPolicy::class, 'viewPayrollDetails']);
        Gate::define('updatePayrollDetails', [EmployeePayrollPolicy::class, 'updatePayrollDetails']);

        // Sync (POS offline) — controller passes [Shop::class, $shop] so handle the class hint arg
        Gate::define('syncProducts', function (User $user, $_, Shop $shop) {
            return (new SyncPolicy)->syncProducts($user, $shop);
        });
        Gate::define('syncCustomers', fn (User $user) => (new SyncPolicy)->syncCustomers($user));

        // Admin gates - super admin only actions
        Gate::define('admin.tenants.viewAny', fn (User $user) => $user->isSuperAdmin());
        Gate::define('admin.tenants.view', fn (User $user) => $user->isSuperAdmin());
        Gate::define('admin.tenants.create', fn (User $user) => $user->isSuperAdmin());
        Gate::define('admin.tenants.update', fn (User $user) => $user->isSuperAdmin());
        Gate::define('admin.tenants.delete', fn (User $user) => $user->isSuperAdmin());
    }
}
