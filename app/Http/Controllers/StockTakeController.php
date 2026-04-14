<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockTakeRequest;
use App\Models\Shop;
use App\Services\StockMovementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StockTakeController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovementService
    ) {}

    public function index(Shop $shop): Response
    {
        Gate::authorize('manage', $shop);

        return Inertia::render('StockTake/Index', [
            'shop' => $shop,
            'variants' => $this->stockMovementService->getVariantsForStockTake($shop),
        ]);
    }

    public function store(StoreStockTakeRequest $request, Shop $shop): RedirectResponse
    {
        Gate::authorize('manage', $shop);

        try {
            $validated = $request->validated();
            $adjustments = $this->stockMovementService->processBatchStockTake(
                counts: $validated['counts'],
                notes: $validated['notes'] ?? null,
                user: $request->user(),
            );

            $message = count($adjustments) > 0
                ? 'Stock take completed. ' . count($adjustments) . ' adjustment(s) made.'
                : 'Stock take completed. No adjustments needed.';

            return redirect()
                ->route('shops.show', $shop)
                ->with('success', $message);
        } catch (Throwable $e) {
            return redirect()
                ->back()
                ->with('error', 'Stock take failed: ' . $e->getMessage());
        }
    }
}
