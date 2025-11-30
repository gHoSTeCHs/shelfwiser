<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\FundRequest;
use App\Models\Notification;
use App\Models\PayrollPeriod;
use App\Models\ProductVariant;
use App\Models\Receipt;
use App\Models\Service;
use App\Models\Shop;
use App\Models\Timesheet;
use App\Models\User;
use App\Models\WageAdvance;
use App\Policies\CustomerPolicy;
use App\Policies\DashboardPolicy;
use App\Policies\FundRequestPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\PayrollPolicy;
use App\Policies\ProductVariantPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\ReceiptPolicy;
use App\Policies\ReportPolicy;
use App\Policies\ServicePolicy;
use App\Policies\ShopPolicy;
use App\Policies\StaffPolicy;
use App\Policies\StorefrontPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\TimesheetPolicy;
use App\Policies\WageAdvancePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, StaffPolicy::class);
        Gate::policy(Shop::class, ShopPolicy::class);
        Gate::policy(Shop::class, StorefrontPolicy::class);
        Gate::policy(Service::class, ServicePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(ProductVariant::class, ProductVariantPolicy::class);
        Gate::policy(Receipt::class, ReceiptPolicy::class);
        Gate::policy(Timesheet::class, TimesheetPolicy::class);
        Gate::policy(FundRequest::class, FundRequestPolicy::class);
        Gate::policy(WageAdvance::class, WageAdvancePolicy::class);
        Gate::policy(PayrollPeriod::class, PayrollPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);

        // Dashboard polices
        Gate::define('dashboard.view', [DashboardPolicy::class, 'view']);
        Gate::define('dashboard.view_financials', [DashboardPolicy::class, 'viewFinancials']);
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
    }
}
