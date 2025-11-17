<?php

namespace App\Providers;

use App\Models\Service;
use App\Models\Shop;
use App\Models\User;
use App\Policies\ServicePolicy;
use App\Policies\StaffPolicy;
use App\Policies\StorefrontPolicy;
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
        // Register StaffPolicy for User model
        Gate::policy(User::class, StaffPolicy::class);

        // Register StorefrontPolicy for Shop model
        Gate::policy(Shop::class, StorefrontPolicy::class);

        // Register ServicePolicy for Service model
        Gate::policy(Service::class, ServicePolicy::class);
    }
}
