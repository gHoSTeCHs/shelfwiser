<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'customer_id',
        'order_number',
        'status',
        'payment_status',
        'payment_method',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'customer_notes',
        'internal_notes',
        'shipping_address',
        'billing_address',
        'confirmed_at',
        'shipped_at',
        'delivered_at',
        'created_by',
    ];

    protected $casts = [
        'status' => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = self::generateOrderNumber($order->tenant_id);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForShop($query, int $shopId)
    {
        return $query->where('shop_id', $shopId);
    }

    public function scopeWithStatus($query, OrderStatus $status)
    {
        return $query->where('status', $status);
    }

    public function scopeWithPaymentStatus($query, PaymentStatus $paymentStatus)
    {
        return $query->where('payment_status', $paymentStatus);
    }

    public function scopePending($query)
    {
        return $query->where('status', OrderStatus::PENDING);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', OrderStatus::activeStatuses());
    }

    public function canEdit(): bool
    {
        return $this->status->canEdit();
    }

    public function canCancel(): bool
    {
        return $this->status->canCancel();
    }

    public function isComplete(): bool
    {
        return $this->status === OrderStatus::DELIVERED;
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(fn($item) => $item->unit_price * $item->quantity);
        $this->tax_amount = $this->items->sum('tax_amount');
        $this->discount_amount = $this->items->sum('discount_amount');
        $this->total_amount = $this->subtotal + $this->tax_amount - $this->discount_amount + $this->shipping_cost;
    }

    public static function generateOrderNumber(int $tenantId): string
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        $lastOrder = self::where('tenant_id', $tenantId)
            ->whereDate('created_at', today())
            ->latest()
            ->first();

        $sequence = $lastOrder ? (int) substr($lastOrder->order_number, -4) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }
}
