<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    protected $fillable = [
        'tenant_id',
        'shop_id',
        'order_id',
        'order_payment_id',
        'customer_id',
        'receipt_number',
        'type',
        'amount',
        'pdf_path',
        'generated_at',
        'emailed_at',
        'emailed_to',
        'generated_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'generated_at' => 'datetime',
        'emailed_at' => 'datetime',
    ];

    /**
     * Get the tenant this receipt belongs to
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the shop this receipt belongs to
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the order this receipt is for
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the payment this receipt is for
     */
    public function orderPayment(): BelongsTo
    {
        return $this->belongsTo(OrderPayment::class);
    }

    /**
     * Get the customer this receipt is for
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user who generated this receipt
     */
    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Generate unique receipt number
     */
    public static function generateReceiptNumber(): string
    {
        $prefix = 'REC';
        $date = now()->format('Ymd');
        $lastReceipt = self::where('receipt_number', 'like', "{$prefix}-{$date}-%")
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastReceipt
            ? ((int) substr($lastReceipt->receipt_number, -4)) + 1
            : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }
}
