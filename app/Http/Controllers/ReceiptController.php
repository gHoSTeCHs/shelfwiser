<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Receipt;
use App\Services\ReceiptService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function __construct(
        protected ReceiptService $receiptService
    ) {}

    /**
     * Display receipt list
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Receipt::class);

        $receipts = Receipt::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->with(['order', 'orderPayment', 'customer', 'shop', 'generatedBy'])
            ->when($request->type, fn($q, $type) => $q->where('type', $type))
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('receipt_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function ($q) use ($search) {
                          $q->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Receipts/Index', [
            'receipts' => $receipts,
            'filters' => $request->only(['search', 'type']),
            'stats' => [
                'total_receipts' => Receipt::where('tenant_id', auth()->user()->tenant_id)->count(),
                'order_receipts' => Receipt::where('tenant_id', auth()->user()->tenant_id)->where('type', 'order')->count(),
                'payment_receipts' => Receipt::where('tenant_id', auth()->user()->tenant_id)->where('type', 'payment')->count(),
            ],
        ]);
    }

    /**
     * Generate and view order receipt
     */
    public function viewOrderReceipt(Order $order)
    {
        $this->authorize('view', $order);

        $receipt = Receipt::where('order_id', $order->id)
            ->where('type', 'order')
            ->first();

        if (!$receipt) {
            $receipt = $this->receiptService->generateOrderReceipt($order);
        }

        return $this->receiptService->generateOrderPdf($order, $receipt)->stream();
    }

    /**
     * Download order receipt as PDF
     */
    public function downloadOrderReceipt(Order $order)
    {
        $this->authorize('view', $order);

        $receipt = Receipt::where('order_id', $order->id)
            ->where('type', 'order')
            ->first();

        if (!$receipt) {
            $receipt = $this->receiptService->generateOrderReceipt($order, true);
        }

        $filename = "receipt-{$order->order_number}.pdf";

        return $this->receiptService->generateOrderPdf($order, $receipt)->download($filename);
    }

    /**
     * Generate and view payment receipt
     */
    public function viewPaymentReceipt(OrderPayment $payment)
    {
        $this->authorize('view', $payment->order);

        $receipt = Receipt::where('order_payment_id', $payment->id)
            ->where('type', 'payment')
            ->first();

        if (!$receipt) {
            $receipt = $this->receiptService->generatePaymentReceipt($payment);
        }

        return $this->receiptService->generatePaymentPdf($payment, $receipt)->stream();
    }

    /**
     * Download payment receipt as PDF
     */
    public function downloadPaymentReceipt(OrderPayment $payment)
    {
        $this->authorize('view', $payment->order);

        $receipt = Receipt::where('order_payment_id', $payment->id)
            ->where('type', 'payment')
            ->first();

        if (!$receipt) {
            $receipt = $this->receiptService->generatePaymentReceipt($payment, true);
        }

        $filename = "payment-receipt-{$payment->id}.pdf";

        return $this->receiptService->generatePaymentPdf($payment, $receipt)->download($filename);
    }

    /**
     * Email receipt to customer
     */
    public function emailReceipt(Request $request, Receipt $receipt): RedirectResponse
    {
        $this->authorize('view', $receipt);

        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $sent = $this->receiptService->emailReceipt($receipt, $request->email);

        if ($sent) {
            return back()->with('success', "Receipt emailed to {$request->email}");
        }

        return back()->with('error', 'Failed to email receipt');
    }

    /**
     * Display receipt preview page
     */
    public function show(Receipt $receipt): Response
    {
        $this->authorize('view', $receipt);

        $receipt->load(['order.items.productVariant.product', 'orderPayment', 'customer', 'shop', 'generatedBy']);

        return Inertia::render('Receipts/Show', [
            'receipt' => $receipt,
        ]);
    }
}
