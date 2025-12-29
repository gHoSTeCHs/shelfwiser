<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderPayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_id',
        'tenant_id',
        'shop_id',
        'amount',
        'currency',
        'gateway_fee',
        'payment_method',
        'gateway',
        'gateway_reference',
        'gateway_status',
        'gateway_response',
        'verified_at',
        'payment_date',
        'reference_number',
        'notes',
        'recorded_by',
        'refund_amount',
        'refund_status',
        'refund_reference',
        'refund_reason',
        'refund_notes',
        'refunded_at',
        'refunded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'gateway_fee' => 'decimal:2',
        'gateway_response' => 'array',
        'payment_date' => 'date',
        'verified_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    protected static function booted(): void
    {
        static::created(function (OrderPayment $payment) {
            $order = $payment->order;
            $order->paid_amount = $order->payments()->sum('amount');
            $order->updatePaymentStatus();
            $order->save();
        });

        static::deleted(function (OrderPayment $payment) {
            $order = $payment->order;
            $order->paid_amount = $order->payments()->sum('amount');
            $order->updatePaymentStatus();
            $order->save();
        });

        static::restored(function (OrderPayment $payment) {
            $order = $payment->order;
            $order->paid_amount = $order->payments()->sum('amount');
            $order->updatePaymentStatus();
            $order->save();
        });
    }
}
