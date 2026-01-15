<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Http\Requests\HoldSaleRequest;
use App\Models\HeldSale;
use App\Models\ProductPackagingType;
use App\Models\Shop;
use App\Services\HeldSaleService;
use App\Services\POSService;
use App\Services\ReceiptService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        $this->authorize('shop.manage', $shop);

        return Inertia::render('POS/Index', [
            'shop' => $shop,
            'paymentMethods' => PaymentMethod::posOptions(),
            'heldSalesCount' => $this->heldSaleService->getActiveCount($shop),
        ]);
    }

    public function searchProducts(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        $request->validate([
            'query' => ['required', 'string', 'min:1'],
        ]);

        $products = $this->posService->searchProducts(
            $shop,
            $request->query->has('query') ? $request->query->get('query') : null,
            20
        );

        return response()->json([
            'products' => $products,
        ]);
    }

    public function searchCustomers(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        $request->validate([
            'query' => ['required', 'string', 'min:1'],
        ]);

        $customers = $this->posService->searchCustomers(
            $request->input('query'),
            $shop,
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
    public function completeSale(Request $request, Shop $shop): JsonResponse|RedirectResponse
    {
        $this->authorize('shop.manage', $shop);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'decimal:0,2', 'min:0'],
            'items.*.packaging_type_id' => [
                'nullable',
                'exists:product_packaging_types,id',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $packagingType = ProductPackagingType::find($value);
                        if ($packagingType && $packagingType->productVariant?->product?->tenant_id !== auth()->user()->tenant_id) {
                            $fail('The selected packaging type does not belong to your organization.');
                        }
                    }
                },
            ],
            'items.*.discount_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'payment_method' => ['required', 'string', Rule::enum(PaymentMethod::class)],
            'amount_tendered' => ['nullable', 'decimal:0,2', 'min:0'],
            'discount_amount' => ['nullable', 'decimal:0,2', 'min:0'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $order = $this->posService->createQuickSale(
                shop: $shop,
                items: $validated['items'],
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

        } catch (Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Get POS session summary
     */
    public function sessionSummary(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        $summary = $this->posService->getSessionSummary(
            $shop,
            $request->start_date,
            $request->end_date
        );

        return response()->json($summary);
    }

    /**
     * Hold current sale for later
     */
    public function holdSale(HoldSaleRequest $request, Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        try {
            $heldSale = $this->heldSaleService->holdSale(
                shop: $shop,
                items: $request->validated('items'),
                customerId: $request->validated('customer_id'),
                notes: $request->validated('notes')
            );

            return response()->json([
                'held_sale' => $heldSale->load(['customer', 'heldByUser']),
                'message' => "Sale held as {$heldSale->hold_reference}",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retrieve held sale
     */
    public function retrieveHeldSale(Shop $shop, HeldSale $heldSale): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        if ($heldSale->tenant_id !== auth()->user()->tenant_id) {
            return response()->json([
                'error' => 'Unauthorized access.',
            ], 403);
        }

        if ($heldSale->shop_id !== $shop->id) {
            return response()->json([
                'error' => 'Held sale does not belong to this shop.',
            ], 403);
        }

        if ($heldSale->isRetrieved()) {
            return response()->json([
                'error' => 'This held sale has already been retrieved.',
            ], 400);
        }

        try {
            $retrievedSale = $this->heldSaleService->retrieveHeldSale($heldSale);

            return response()->json([
                'held_sale' => $retrievedSale->load(['customer', 'heldByUser']),
                'message' => "Sale {$retrievedSale->hold_reference} retrieved successfully.",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of held sales for a shop
     */
    public function heldSales(Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        $heldSales = $this->heldSaleService->getActiveHeldSales($shop);

        return response()->json([
            'held_sales' => $heldSales,
        ]);
    }

    /**
     * Get count of active held sales
     */
    public function heldSalesCount(Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        return response()->json([
            'count' => $this->heldSaleService->getActiveCount($shop),
        ]);
    }

    /**
     * Delete a held sale
     */
    public function deleteHeldSale(Shop $shop, HeldSale $heldSale): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        if ($heldSale->tenant_id !== auth()->user()->tenant_id) {
            return response()->json([
                'error' => 'Unauthorized access.',
            ], 403);
        }

        if ($heldSale->shop_id !== $shop->id) {
            return response()->json([
                'error' => 'Held sale does not belong to this shop.',
            ], 403);
        }

        try {
            $reference = $heldSale->hold_reference;
            $this->heldSaleService->deleteHeldSale($heldSale);

            return response()->json([
                'message' => "Held sale {$reference} deleted successfully.",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
