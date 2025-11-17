<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt #{{ $receipt?->receipt_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #333; }
        .container { padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #000; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header .shop-name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
        .header .shop-details { font-size: 10px; color: #666; line-height: 1.5; }
        .receipt-info { margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .receipt-info table { width: 100%; }
        .receipt-info td { padding: 8px 0; }
        .receipt-info .label { font-weight: bold; width: 180px; color: #666; }
        .payment-amount { text-align: center; margin: 30px 0; padding: 30px; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 5px; }
        .payment-amount .label { font-size: 14px; color: #666; margin-bottom: 10px; }
        .payment-amount .amount { font-size: 32px; font-weight: bold; color: #2e7d32; }
        .section-title { font-size: 14px; font-weight: bold; margin: 25px 0 15px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
        .order-summary { background: #f9f9f9; padding: 15px; margin-bottom: 20px; }
        .order-summary table { width: 100%; }
        .order-summary td { padding: 5px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #666; padding-top: 20px; border-top: 1px solid #ddd; }
        .stamp { margin-top: 40px; text-align: center; }
        .stamp-box { display: inline-block; border: 2px solid #4caf50; padding: 15px 30px; border-radius: 5px; }
        .stamp-box .text { font-size: 24px; font-weight: bold; color: #4caf50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="shop-name">{{ $shop->name }}</div>
            <div class="shop-details">
                @if($shop->address) {{ $shop->address }}, @endif
                @if($shop->city) {{ $shop->city }}, @endif
                @if($shop->state) {{ $shop->state }} @endif
                @if($shop->country) {{ $shop->country }} @endif
                <br>
                @if($shop->phone) Phone: {{ $shop->phone }} | @endif
                @if($shop->email) Email: {{ $shop->email }} @endif
            </div>
            <h1 style="margin-top: 15px;">PAYMENT RECEIPT</h1>
        </div>

        <div class="receipt-info">
            <table>
                <tr>
                    <td class="label">Receipt Number:</td>
                    <td><strong>{{ $receipt?->receipt_number ?? 'N/A' }}</strong></td>
                </tr>
                <tr>
                    <td class="label">Payment Date:</td>
                    <td>{{ $payment->payment_date->format('F d, Y h:i A') }}</td>
                </tr>
                <tr>
                    <td class="label">Payment Method:</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}</td>
                </tr>
                @if($payment->reference_number)
                <tr>
                    <td class="label">Reference Number:</td>
                    <td>{{ $payment->reference_number }}</td>
                </tr>
                @endif
                @if($customer)
                <tr>
                    <td class="label">Received From:</td>
                    <td>{{ $customer->first_name }} {{ $customer->last_name }} - {{ $customer->email }}</td>
                </tr>
                @endif
                @if($payment->recordedBy)
                <tr>
                    <td class="label">Recorded By:</td>
                    <td>{{ $payment->recordedBy->first_name }} {{ $payment->recordedBy->last_name }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="payment-amount">
            <div class="label">AMOUNT PAID</div>
            <div class="amount">{{ $shop->currency_symbol }}{{ number_format($payment->amount, 2) }}</div>
        </div>

        @if($order)
        <div class="section-title">Order Information</div>
        <div class="order-summary">
            <table>
                <tr>
                    <td style="font-weight: bold; width: 180px;">Order Number:</td>
                    <td>{{ $order->order_number }}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Order Date:</td>
                    <td>{{ $order->created_at->format('F d, Y') }}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Order Total:</td>
                    <td>{{ $shop->currency_symbol }}{{ number_format($order->total_amount, 2) }}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Total Paid:</td>
                    <td>{{ $shop->currency_symbol }}{{ number_format($order->paid_amount, 2) }}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd;">
                    <td style="font-weight: bold; padding-top: 10px;">
                        @if($order->paid_amount >= $order->total_amount)
                            Status:
                        @else
                            Balance Due:
                        @endif
                    </td>
                    <td style="padding-top: 10px; font-weight: bold; {{ $order->paid_amount >= $order->total_amount ? 'color: #4caf50;' : 'color: #d9534f;' }}">
                        @if($order->paid_amount >= $order->total_amount)
                            PAID IN FULL
                        @else
                            {{ $shop->currency_symbol }}{{ number_format($order->total_amount - $order->paid_amount, 2) }}
                        @endif
                    </td>
                </tr>
            </table>
        </div>
        @endif

        @if($payment->notes)
        <div class="section-title">Notes</div>
        <div style="padding: 15px; background: #f9f9f9; margin-bottom: 20px;">
            {{ $payment->notes }}
        </div>
        @endif

        <div class="stamp">
            <div class="stamp-box">
                <div class="text">PAID</div>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your payment!</p>
            <p style="margin-top: 5px;">This is a computer-generated receipt and does not require a signature.</p>
            @if($receipt)
            <p style="margin-top: 5px;">Generated on {{ $receipt->generated_at->format('F d, Y h:i A') }}</p>
            @endif
        </div>
    </div>
</body>
</html>
