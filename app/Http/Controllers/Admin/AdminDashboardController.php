<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardService $dashboardService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => $this->dashboardService->getPlatformStats(),
            'subscriptionBreakdown' => $this->dashboardService->getSubscriptionBreakdown(),
            'recentTenants' => $this->dashboardService->getRecentTenants(),
            'expiringTrials' => $this->dashboardService->getExpiringTrials(),
        ]);
    }
}
