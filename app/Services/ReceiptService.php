<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Receipt;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReceiptService
{
    public function getPaginatedReceipts(?string $search, ?string $type): LengthAwarePaginator
    {
        return Receipt::query()
            ->with(['order', 'orderPayment', 'customer', 'shop', 'generatedBy'])
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('receipt_number', 'like', "%$search%")
                        ->orWhereHas('customer', function ($c) use ($search) {
                            $c->where('first_name', 'like', "%$search%")
                                ->orWhere('last_name', 'like', "%$search%")
                                ->orWhere('email', 'like', "%$search%");
                        });
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();
    }

    public function getReceiptStats(): array
    {
        $counts = Receipt::query()
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return [
            'total_receipts' => $counts->sum(),
            'order_receipts' => $counts->get('order', 0),
            'payment_receipts' => $counts->get('payment', 0),
        ];
    }

    public function findOrCreateOrderReceipt(Order $order, bool $savePdf = false, ?int $generatedBy = null): Receipt
    {
        return DB::transaction(function () use ($order, $savePdf, $generatedBy) {
            $existing = Receipt::query()
                ->where('order_id', $order->id)
                ->where('type', 'order')
                ->lockForUpdate()
                ->first();

            return $existing ?? $this->generateOrderReceipt($order, $savePdf, $generatedBy);
        });
    }

    public function findOrCreatePaymentReceipt(OrderPayment $payment, bool $savePdf = false, ?int $generatedBy = null): Receipt
    {
        return DB::transaction(function () use ($payment, $savePdf, $generatedBy) {
            $existing = Receipt::query()
                ->where('order_payment_id', $payment->id)
                ->where('type', 'payment')
                ->lockForUpdate()
                ->first();

            return $existing ?? $this->generatePaymentReceipt($payment, $savePdf, $generatedBy);
        });
    }

    /**
     * Generate receipt for an order
     */
    public function generateOrderReceipt(Order $order, bool $savePdf = false, ?int $generatedBy = null): Receipt
    {
        $receiptNumber = Receipt::generateReceiptNumber();

        $receipt = Receipt::query()->create([
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'receipt_number' => $receiptNumber,
            'type' => 'order',
            'amount' => $order->total_amount,
            'generated_at' => now(),
            'generated_by' => $generatedBy,
        ]);

        if ($savePdf) {
            $pdfPath = $this->generateAndSaveOrderPdf($order, $receipt);
            $receipt->update(['pdf_path' => $pdfPath]);
        }

        return $receipt;
    }

    /**
     * Generate receipt for a payment
     */
    public function generatePaymentReceipt(OrderPayment $payment, bool $savePdf = false, ?int $generatedBy = null): Receipt
    {
        $receiptNumber = Receipt::generateReceiptNumber();

        $receipt = Receipt::query()->create([
            'tenant_id' => $payment->tenant_id,
            'shop_id' => $payment->shop_id,
            'order_id' => $payment->order_id,
            'order_payment_id' => $payment->id,
            'customer_id' => $payment->order?->customer_id,
            'receipt_number' => $receiptNumber,
            'type' => 'payment',
            'amount' => $payment->amount,
            'generated_at' => now(),
            'generated_by' => $generatedBy,
        ]);

        if ($savePdf) {
            $pdfPath = $this->generateAndSavePaymentPdf($payment, $receipt);
            $receipt->update(['pdf_path' => $pdfPath]);
        }

        return $receipt;
    }

    /**
     * Generate PDF for order receipt
     */
    public function generateOrderPdf(Order $order, ?Receipt $receipt = null)
    {
        $order->load([
            'shop',
            'customer',
            'items.productVariant.product',
            'items.sellable',
            'items.packagingType',
            'payments',
        ]);

        $data = [
            'receipt' => $receipt,
            'order' => $order,
            'shop' => $order->shop,
            'customer' => $order->customer,
            'items' => $order->items,
            'payments' => $order->payments,
        ];

        return Pdf::loadView('pdf.receipts.order', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);
    }

    /**
     * Generate PDF for payment receipt
     */
    public function generatePaymentPdf(OrderPayment $payment, ?Receipt $receipt = null)
    {
        $payment->load([
            'order.shop',
            'order.customer',
            'order.items.productVariant.product',
            'recordedBy',
        ]);

        $data = [
            'receipt' => $receipt,
            'payment' => $payment,
            'order' => $payment->order,
            'shop' => $payment->order->shop,
            'customer' => $payment->order->customer,
        ];

        return Pdf::loadView('pdf.receipts.payment', $data)
            ->setPaper('a4')
            ->setOption('margin-top', 10)
            ->setOption('margin-bottom', 10)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10);
    }

    /**
     * Generate and save order PDF to storage
     */
    protected function generateAndSaveOrderPdf(Order $order, Receipt $receipt): string
    {
        $pdf = $this->generateOrderPdf($order, $receipt);
        $filename = 'receipts/orders/'.$this->safeReceiptFilename($receipt).'.pdf';

        Storage::put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Generate and save payment PDF to storage
     */
    protected function generateAndSavePaymentPdf(OrderPayment $payment, Receipt $receipt): string
    {
        $pdf = $this->generatePaymentPdf($payment, $receipt);
        $filename = 'receipts/payments/'.$this->safeReceiptFilename($receipt).'.pdf';

        Storage::put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Whitelist the characters allowed in a receipt filename to defeat any path
     * traversal attempt that ever creeps into receipt_number generation.
     */
    private function safeReceiptFilename(Receipt $receipt): string
    {
        $base = basename($receipt->receipt_number);

        return preg_replace('/[^A-Za-z0-9_-]+/', '_', $base) ?: 'receipt';
    }

    /**
     * Email receipt to customer
     */
    public function emailReceipt(Receipt $receipt, string $email): bool
    {
        try {
            $pdf = $receipt->type === 'order'
                ? $this->generateOrderPdf($receipt->order, $receipt)
                : $this->generatePaymentPdf($receipt->orderPayment, $receipt);

            $receipt->update([
                'emailed_at' => now(),
                'emailed_to' => $email,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to email receipt', [
                'receipt_id' => $receipt->id,
                'receipt_type' => $receipt->type,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
