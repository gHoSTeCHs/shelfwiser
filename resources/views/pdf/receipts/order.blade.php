<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Receipt #{{ $receipt?->receipt_number ?? $order->order_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #333; }
        .container { padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #000; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header .shop-name { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
        .header .shop-details { font-size: 10px; color: #666; line-height: 1.5; }
        .receipt-info { margin-bottom: 20px; }
        .receipt-info table { width: 100%; }
        .receipt-info td { padding: 5px 0; }
        .receipt-info .label { font-weight: bold; width: 150px; }
        .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #f5f5f5; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 10px; }
        .items-table td { padding: 8px; border-bottom: 1px solid #eee; }
        .items-table .text-right { text-align: right; }
        .totals { margin-top: 20px; }
        .totals table { width: 300px; margin-left: auto; }
        .totals td { padding: 5px 10px; }
        .totals .label { text-align: right; }
        .totals .amount { text-align: right; font-weight: bold; }
        .totals .grand-total { font-size: 14px; padding-top: 10px; border-top: 2px solid #000; }
        .payment-info { margin-top: 20px; padding: 15px; background: #f9f9f9; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; padding-top: 20px; border-top: 1px solid #ddd; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .badge-paid { background: #d4edda; color: #155724; }
        .badge-unpaid { background: #f8d7da; color: #721c24; }
        .badge-partial { background: #fff3cd; color: #856404; }
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
            <h1 style="margin-top: 15px;">ORDER RECEIPT</h1>
        </div>

        <div class="receipt-info">
            <table>
                <tr>
                    <td class="label">Receipt Number:</td>
                    <td>{{ $receipt?->receipt_number ?? 'N/A' }}</td>
                    <td class="label">Order Number:</td>
                    <td>{{ $order->order_number }}</td>
                </tr>
                <tr>
                    <td class="label">Date:</td>
                    <td>{{ $order->created_at->format('F d, Y h:i A') }}</td>
                    <td class="label">Payment Status:</td>
                    <td>
                        <span class="badge badge-{{ strtolower($order->payment_status->value) }}">
                            {{ strtoupper($order->payment_status->label()) }}
                        </span>
                    </td>
                </tr>
                @if($customer)
                <tr>
                    <td class="label">Customer:</td>
                    <td colspan="3">{{ $customer->first_name }} {{ $customer->last_name }} - {{ $customer->email }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="section-title">Order Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Item</th>
                    <th style="width: 15%;" class="text-right">Qty</th>
                    <th style="width: 20%;" class="text-right">Unit Price</th>
                    <th style="width: 25%;" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td>
                        @if($item->productVariant)
                            {{ $item->productVariant->product->name }}
                            @if($item->packagingType)
                                <br><small style="color: #666;">{{ $item->packagingType->name }}</small>
                            @endif
                        @elseif($item->sellable)
                            {{ $item->sellable->service->name ?? $item->sellable->name ?? 'Service' }}
                            <small style="color: #666;">(Service)</small>
                        @else
                            Item
                        @endif
                    </td>
                    <td class="text-right">{{ number_format($item->quantity, 0) }}</td>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-right">{{ $shop->currency_symbol }}{{ number_format($item->total_amount, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="amount">{{ $shop->currency_symbol }}{{ number_format($order->subtotal, 2) }}</td>
                </tr>
                @if($order->tax_amount > 0)
                <tr>
                    <td class="label">Tax:</td>
                    <td class="amount">{{ $shop->currency_symbol }}{{ number_format($order->tax_amount, 2) }}</td>
                </tr>
                @endif
                @if($order->discount_amount > 0)
                <tr>
                    <td class="label">Discount:</td>
                    <td class="amount">-{{ $shop->currency_symbol }}{{ number_format($order->discount_amount, 2) }}</td>
                </tr>
                @endif
                @if($order->shipping_cost > 0)
                <tr>
                    <td class="label">Shipping:</td>
                    <td class="amount">{{ $shop->currency_symbol }}{{ number_format($order->shipping_cost, 2) }}</td>
                </tr>
                @endif
                <tr class="grand-total">
                    <td class="label">TOTAL:</td>
                    <td class="amount">{{ $shop->currency_symbol }}{{ number_format($order->total_amount, 2) }}</td>
                </tr>
            </table>
        </div>

        @if($payments && $payments->count() > 0)
        <div class="payment-info">
            <div class="section-title" style="margin-top: 0;">Payment History</div>
            <table style="width: 100%;">
                @foreach($payments as $payment)
                <tr>
                    <td style="padding: 5px 0;">
                        {{ $payment->payment_date->format('M d, Y') }} -
                        {{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}
                    </td>
                    <td style="text-align: right; font-weight: bold;">
                        {{ $shop->currency_symbol }}{{ number_format($payment->amount, 2) }}
                    </td>
                </tr>
                @endforeach
                <tr style="border-top: 1px solid #ddd;">
                    <td style="padding-top: 8px;"><strong>Total Paid:</strong></td>
                    <td style="text-align: right; padding-top: 8px; font-weight: bold;">
                        {{ $shop->currency_symbol }}{{ number_format($order->paid_amount, 2) }}
                    </td>
                </tr>
                @if($order->paid_amount < $order->total_amount)
                <tr>
                    <td><strong>Balance Due:</strong></td>
                    <td style="text-align: right; color: #d9534f; font-weight: bold;">
                        {{ $shop->currency_symbol }}{{ number_format($order->total_amount - $order->paid_amount, 2) }}
                    </td>
                </tr>
                @endif
            </table>
        </div>
        @endif

        <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 5px;">This is a computer-generated receipt and does not require a signature.</p>
            @if($receipt)
            <p style="margin-top: 5px;">Generated on {{ $receipt->generated_at->format('F d, Y h:i A') }}</p>
            @endif
        </div>
    </div>
</body>
</html>
