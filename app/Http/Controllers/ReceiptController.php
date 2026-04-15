<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmailReceiptRequest;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Receipt;
use App\Services\ReceiptService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
        Gate::authorize('viewAny', Receipt::class);

        return Inertia::render('Receipts/Index', [
            'receipts' => $this->receiptService->getPaginatedReceipts(
                search: $request->input('search'),
                type: $request->input('type'),
            ),
            'filters' => $request->only(['search', 'type']),
            'stats' => $this->receiptService->getReceiptStats(),
        ]);
    }

    /**
     * Generate and view order receipt
     */
    public function viewOrderReceipt(Order $order)
    {
        Gate::authorize('view', $order);

        $receipt = $this->receiptService->findOrCreateOrderReceipt($order, generatedBy: auth()->id());

        return $this->receiptService->generateOrderPdf($order, $receipt)->stream();
    }

    /**
     * Download order receipt as PDF
     */
    public function downloadOrderReceipt(Order $order)
    {
        Gate::authorize('view', $order);

        $receipt = $this->receiptService->findOrCreateOrderReceipt($order, savePdf: true, generatedBy: auth()->id());

        return $this->receiptService->generateOrderPdf($order, $receipt)->download("receipt-$order->order_number.pdf");
    }

    /**
     * Generate and view payment receipt
     */
    public function viewPaymentReceipt(OrderPayment $payment)
    {
        Gate::authorize('view', $payment->order);

        $receipt = $this->receiptService->findOrCreatePaymentReceipt($payment, generatedBy: auth()->id());

        return $this->receiptService->generatePaymentPdf($payment, $receipt)->stream();
    }

    /**
     * Download payment receipt as PDF
     */
    public function downloadPaymentReceipt(OrderPayment $payment)
    {
        Gate::authorize('view', $payment->order);

        $receipt = $this->receiptService->findOrCreatePaymentReceipt($payment, savePdf: true, generatedBy: auth()->id());

        return $this->receiptService->generatePaymentPdf($payment, $receipt)->download("payment-receipt-$payment->id.pdf");
    }

    /**
     * Email receipt to customer
     */
    public function emailReceipt(EmailReceiptRequest $request, Receipt $receipt): RedirectResponse
    {
        Gate::authorize('view', $receipt);

        $email = $request->validated()['email'];
        $sent = $this->receiptService->emailReceipt($receipt, $email);

        if ($sent) {
            return back()->with('success', "Receipt emailed to $email");
        }

        return back()->with('error', 'Failed to email receipt');
    }

    /**
     * Display receipt preview page
     */
    public function show(Receipt $receipt): Response
    {
        Gate::authorize('view', $receipt);

        $receipt->load(['order.items.productVariant.product', 'orderPayment', 'customer', 'shop', 'generatedBy']);

        return Inertia::render('Receipts/Show', [
            'receipt' => $receipt,
        ]);
    }
}
