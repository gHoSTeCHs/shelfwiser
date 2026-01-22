<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\ReorderAlertService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReorderAlertController extends Controller
{
    public function __construct(
        private readonly ReorderAlertService $reorderAlertService
    ) {}

    public function index(?Shop $shop = null): Response
    {
        $tenant = auth()->user()->tenant;

        if ($shop) {
            Gate::authorize('view', $shop);
        }

        $lowStock = $this->reorderAlertService->getLowStockVariants($tenant, $shop);
        $summary = $this->reorderAlertService->getAlertSummary($tenant, $shop);

        return Inertia::render('ReorderAlerts/Index', [
            'shop' => $shop,
            'low_stock_items' => $lowStock,
            'summary' => $summary,
        ]);
    }
}
