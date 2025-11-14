<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderPayment extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'amount',
        'payment_date',
        'payment_method',
        'reference_number',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    protected static function booted(): void
    {
        static::created(function (PurchaseOrderPayment $payment) {
            $po = $payment->purchaseOrder;
            $po->paid_amount = $po->payments()->sum('amount');
            $po->save();
            $po->updatePaymentStatus();
        });

        static::deleted(function (PurchaseOrderPayment $payment) {
            $po = $payment->purchaseOrder;
            $po->paid_amount = $po->payments()->sum('amount');
            $po->save();
            $po->updatePaymentStatus();
        });
    }
}
