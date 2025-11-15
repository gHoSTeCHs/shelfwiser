<x-mail::message>
# Order Confirmation

Thank you for your order, {{ $customer->first_name }}!

Your order **{{ $order->order_number }}** has been received and is being processed.

## Order Details

**Order Number:** {{ $order->order_number }}
**Order Date:** {{ $order->created_at->format('F j, Y g:i A') }}
**Payment Method:** {{ ucfirst(str_replace('_', ' ', $order->payment_method)) }}
**Payment Status:** {{ ucfirst($order->payment_status) }}

## Order Summary

@foreach($items as $item)
**{{ $item->productVariant->product->name }}**
{{ $item->productVariant->sku }} × {{ $item->quantity }}
{{ number_format($item->total_amount, 2) }} {{ $shop->currency }}

@endforeach

---

**Subtotal:** {{ number_format($order->subtotal, 2) }} {{ $shop->currency }}
@if($order->tax_amount > 0)
**Tax:** {{ number_format($order->tax_amount, 2) }} {{ $shop->currency }}
@endif
@if($order->shipping_cost > 0)
**Shipping:** {{ number_format($order->shipping_cost, 2) }} {{ $shop->currency }}
@endif
**Total:** {{ number_format($order->total_amount, 2) }} {{ $shop->currency }}

## Shipping Address

{{ json_decode($order->shipping_address)->first_name }} {{ json_decode($order->shipping_address)->last_name }}
{{ json_decode($order->shipping_address)->address_line_1 }}
@if(json_decode($order->shipping_address)->address_line_2)
{{ json_decode($order->shipping_address)->address_line_2 }}
@endif
{{ json_decode($order->shipping_address)->city }}, {{ json_decode($order->shipping_address)->state }} {{ json_decode($order->shipping_address)->postal_code }}
{{ json_decode($order->shipping_address)->country }}
{{ json_decode($order->shipping_address)->phone }}

<x-mail::button :url="route('storefront.account.orders.show', [$shop->slug, $order->id])">
View Order
</x-mail::button>

We'll send you another email when your order ships.

Thanks,<br>
{{ $shop->name }}
</x-mail::message>
