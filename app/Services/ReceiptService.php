<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Receipt;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReceiptService
{
    /**
     * Generate receipt for an order
     */
    public function generateOrderReceipt(Order $order, bool $savePdf = false): Receipt
    {
        $receiptNumber = Receipt::generateReceiptNumber();

        $receipt = Receipt::create([
            'tenant_id' => $order->tenant_id,
            'shop_id' => $order->shop_id,
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'receipt_number' => $receiptNumber,
            'type' => 'order',
            'amount' => $order->total_amount,
            'generated_at' => now(),
            'generated_by' => auth()->id(),
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
    public function generatePaymentReceipt(OrderPayment $payment, bool $savePdf = false): Receipt
    {
        $receiptNumber = Receipt::generateReceiptNumber();

        $receipt = Receipt::create([
            'tenant_id' => $payment->tenant_id,
            'shop_id' => $payment->shop_id,
            'order_id' => $payment->order_id,
            'order_payment_id' => $payment->id,
            'customer_id' => $payment->order->customer_id ?? null,
            'receipt_number' => $receiptNumber,
            'type' => 'payment',
            'amount' => $payment->amount,
            'generated_at' => now(),
            'generated_by' => auth()->id(),
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
        $filename = "receipts/orders/{$receipt->receipt_number}.pdf";

        Storage::put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Generate and save payment PDF to storage
     */
    protected function generateAndSavePaymentPdf(OrderPayment $payment, Receipt $receipt): string
    {
        $pdf = $this->generatePaymentPdf($payment, $receipt);
        $filename = "receipts/payments/{$receipt->receipt_number}.pdf";

        Storage::put($filename, $pdf->output());

        return $filename;
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
            return false;
        }
    }
}
