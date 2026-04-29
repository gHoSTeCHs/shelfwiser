<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Http\Requests\CompleteSaleRequest;
use App\Http\Requests\HoldSaleRequest;
use App\Http\Requests\POSSessionSummaryRequest;
use App\Http\Requests\SearchCustomersRequest;
use App\Http\Requests\SearchProductsRequest;
use App\Models\HeldSale;
use App\Models\Shop;
use App\Services\HeldSaleService;
use App\Services\POSService;
use App\Services\ReceiptService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function __construct(
        protected POSService $posService,
        protected ReceiptService $receiptService,
        protected HeldSaleService $heldSaleService
    ) {}

    /**
     * Display POS interface
     */
    public function index(Shop $shop): Response
    {
        Gate::authorize('shop.manage', $shop);

        return Inertia::render('POS/Index', [
            'shop' => $shop,
            'paymentMethods' => PaymentMethod::posOptions(),
            'heldSalesCount' => $this->heldSaleService->getActiveCount($shop, auth()->user()->tenant_id),
        ]);
    }

    public function searchProducts(SearchProductsRequest $request, Shop $shop): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);

        $products = $this->posService->searchProducts(
            $shop,
            $request->validated('query'),
            $request->user(),
            20
        );

        return response()->json([
            'products' => $products,
        ]);
    }

    public function searchCustomers(SearchCustomersRequest $request, Shop $shop): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);

        $customers = $this->posService->searchCustomers(
            $request->validated('query'),
            $shop,
            $request->user(),
            10
        );

        return response()->json([
            'customers' => $customers,
        ]);
    }

    /**
     * Complete POS sale.
     * Returns JSON for AJAX/fetch requests, RedirectResponse for traditional form submissions.
     */
    public function completeSale(CompleteSaleRequest $request, Shop $shop): JsonResponse|RedirectResponse
    {
        Gate::authorize('shop.manage', $shop);

        $validated = $request->validated();

        try {
            $order = $this->posService->createQuickSale(
                shop: $shop,
                items: $validated['items'],
                user: $request->user(),
                customerId: $validated['customer_id'] ?? null,
                paymentMethod: $validated['payment_method'],
                amountTendered: $validated['amount_tendered'] ?? 0,
                options: [
                    'discount_amount' => $validated['discount_amount'] ?? 0,
                    'reference_number' => $validated['reference_number'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]
            );

            $this->receiptService->generateOrderReceipt($order);
            $receiptUrl = route('receipts.orders.view', $order);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'order' => [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                    ],
                    'receipt_url' => $receiptUrl,
                    'message' => "Sale completed! Order #{$order->order_number}",
                ]);
            }

            return redirect()
                ->route('pos.index', $shop)
                ->with('success', "Sale completed! Order #{$order->order_number}")
                ->with('receipt_url', $receiptUrl);

        } catch (\RuntimeException $e) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
            }

            return back()->with('error', $e->getMessage())->withInput();
        } catch (Exception $e) {
            Log::error('POS sale failed', ['shop_id' => $shop->id, 'error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => 'Sale could not be completed.'], 500);
            }

            return back()->with('error', 'Sale could not be completed.')->withInput();
        }
    }

    /**
     * Get POS session summary
     */
    public function sessionSummary(POSSessionSummaryRequest $request, Shop $shop): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);

        $summary = $this->posService->getSessionSummary(
            $shop,
            $request->user(),
            $request->validated('start_date'),
            $request->validated('end_date')
        );

        return response()->json($summary);
    }

    /**
     * Hold current sale for later
     */
    public function holdSale(HoldSaleRequest $request, Shop $shop): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);

        try {
            $heldSale = $this->heldSaleService->holdSale(
                user: $request->user(),
                shop: $shop,
                items: $request->validated('items'),
                customerId: $request->validated('customer_id'),
                notes: $request->validated('notes')
            );

            return response()->json([
                'held_sale' => $heldSale->loadHeldSaleRelations(),
                'message' => "Sale held as {$heldSale->hold_reference}",
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Exception $e) {
            Log::error('Hold sale failed', ['shop_id' => $shop->id, 'error' => $e->getMessage()]);

            return response()->json(['error' => 'Failed to hold sale.'], 500);
        }
    }

    /**
     * Retrieve held sale
     */
    public function retrieveHeldSale(Shop $shop, HeldSale $heldSale): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);
        abort_unless($heldSale->shop_id === $shop->id, 403, 'Held sale does not belong to this shop.');

        try {
            $retrievedSale = $this->heldSaleService->retrieveHeldSale($heldSale, auth()->user());

            return response()->json([
                'held_sale' => $retrievedSale->loadHeldSaleRelations(),
                'message' => "Sale {$retrievedSale->hold_reference} retrieved successfully.",
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Exception $e) {
            Log::error('Retrieve held sale failed', ['held_sale_id' => $heldSale->id, 'error' => $e->getMessage()]);

            return response()->json(['error' => 'Failed to retrieve held sale.'], 500);
        }
    }

    /**
     * Get list of held sales for a shop
     */
    public function heldSales(Shop $shop): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);

        $heldSales = $this->heldSaleService->getActiveHeldSales($shop, auth()->user()->tenant_id);

        return response()->json([
            'held_sales' => $heldSales,
        ]);
    }

    /**
     * Get count of active held sales
     */
    public function heldSalesCount(Shop $shop): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);

        return response()->json([
            'count' => $this->heldSaleService->getActiveCount($shop, auth()->user()->tenant_id),
        ]);
    }

    /**
     * Delete a held sale
     */
    public function deleteHeldSale(Shop $shop, HeldSale $heldSale): JsonResponse
    {
        Gate::authorize('shop.manage', $shop);
        abort_unless($heldSale->shop_id === $shop->id, 403, 'Held sale does not belong to this shop.');

        try {
            $reference = $heldSale->hold_reference;
            $this->heldSaleService->deleteHeldSale($heldSale);

            return response()->json([
                'message' => "Held sale {$reference} deleted successfully.",
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (Exception $e) {
            Log::error('Delete held sale failed', ['held_sale_id' => $heldSale->id, 'error' => $e->getMessage()]);

            return response()->json(['error' => 'Failed to delete held sale.'], 500);
        }
    }
}
