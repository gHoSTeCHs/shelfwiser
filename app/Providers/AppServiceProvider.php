<?php

namespace App\Providers;

use App\Models\FundRequest;
use App\Models\Service;
use App\Models\Shop;
use App\Models\Timesheet;
use App\Models\User;
use App\Models\WageAdvance;
use App\Policies\FundRequestPolicy;
use App\Policies\ServicePolicy;
use App\Policies\StaffPolicy;
use App\Policies\StorefrontPolicy;
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
        Gate::policy(Shop::class, StorefrontPolicy::class);
        Gate::policy(Service::class, ServicePolicy::class);
        Gate::policy(Timesheet::class, TimesheetPolicy::class);
        Gate::policy(FundRequest::class, FundRequestPolicy::class);
        Gate::policy(WageAdvance::class, WageAdvancePolicy::class);
    }
}
