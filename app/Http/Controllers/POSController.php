<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Services\POSService;
use App\Services\ReceiptService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function __construct(
        protected POSService     $posService,
        protected ReceiptService $receiptService
    )
    {
    }

    /**
     * Display POS interface
     */
    public function index(Shop $shop): Response
    {
        $this->authorize('shop.manage', $shop);

        return Inertia::render('POS/Index', [
            'shop' => $shop,
            'paymentMethods' => [
                'cash' => 'Cash',
                'card' => 'Card',
                'mobile_money' => 'Mobile Money',
                'bank_transfer' => 'Bank Transfer',
            ],
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
            10
        );

        return response()->json([
            'customers' => $customers,
        ]);
    }

    /**
     * Complete POS sale
     */
    public function completeSale(Request $request, Shop $shop): RedirectResponse
    {
        $this->authorize('shop.manage', $shop);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.packaging_type_id' => ['nullable', 'exists:product_packaging_types,id'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'payment_method' => ['required', 'string', 'in:cash,card,mobile_money,bank_transfer'],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
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

            $receipt = $this->receiptService->generateOrderReceipt($order);

            return redirect()
                ->route('pos.index', $shop)
                ->with('success', "Sale completed! Order #$order->order_number")
                ->with('receipt_url', route('receipts.orders.view', $order));

        } catch (Exception $e) {
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
    public function holdSale(Request $request, Shop $shop): JsonResponse
    {
        $this->authorize('shop.manage', $shop);

        $validated = $request->validate([
            'items' => ['required', 'array'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $holdId = uniqid('hold_');

        session()->put("pos_hold_$holdId", [
            'shop_id' => $shop->id,
            'items' => $validated['items'],
            'customer_id' => $validated['customer_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'held_at' => now()->toDateTimeString(),
        ]);

        return response()->json([
            'hold_id' => $holdId,
            'message' => 'Sale held successfully',
        ]);
    }

    /**
     * Retrieve held sale
     */
    public function retrieveHeldSale(string $holdId): JsonResponse
    {
        $heldSale = session()->get("pos_hold_$holdId");

        if (!$heldSale) {
            return response()->json([
                'error' => 'Held sale not found',
            ], 404);
        }

        session()->forget("pos_hold_$holdId");

        return response()->json([
            'sale' => $heldSale,
            'message' => 'Sale retrieved successfully',
        ]);
    }

    /**
     * Get list of held sales
     */
    public function heldSales(): JsonResponse
    {
        $allSessions = session()->all();
        $heldSales = [];

        foreach ($allSessions as $key => $value) {
            if (str_starts_with($key, 'pos_hold_')) {
                $heldSales[] = array_merge($value, ['hold_id' => str_replace('pos_hold_', '', $key)]);
            }
        }

        return response()->json([
            'held_sales' => $heldSales,
        ]);
    }
}
