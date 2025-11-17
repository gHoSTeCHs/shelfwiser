<x-mail::message>
# Order Status Update

Hi {{ $customer->first_name }},

Your order **{{ $order->order_number }}** status has been updated.

**Previous Status:** {{ ucfirst(str_replace('_', ' ', $previousStatus)) }}
**Current Status:** {{ ucfirst(str_replace('_', ' ', $currentStatus)) }}

@if($currentStatus === 'processing')
Great news! We're now processing your order. We'll notify you once it ships.
@elseif($currentStatus === 'shipped')
Your order has been shipped! You should receive it soon.

@if($order->tracking_number)
**Tracking Number:** {{ $order->tracking_number }}
@endif
@elseif($currentStatus === 'delivered')
Your order has been delivered! We hope you enjoy your purchase.

If you have any issues, please don't hesitate to contact us.
@elseif($currentStatus === 'cancelled')
Your order has been cancelled.

@if($order->staff_notes)
**Reason:** {{ $order->staff_notes }}
@endif

If you have any questions, please contact us.
@endif

## Order Details

**Order Number:** {{ $order->order_number }}
**Order Date:** {{ $order->created_at->format('F j, Y g:i A') }}
**Total Amount:** {{ number_format($order->total_amount, 2) }} {{ $shop->currency }}

<x-mail::button :url="route('storefront.account.orders.show', [$shop->slug, $order->id])">
View Order Details
</x-mail::button>

Thanks,<br>
{{ $shop->name }}
</x-mail::message>
