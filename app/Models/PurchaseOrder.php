<?php

namespace App\Models;

use App\Enums\PurchaseOrderPaymentStatus;
use App\Enums\PurchaseOrderStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'buyer_tenant_id',
        'supplier_tenant_id',
        'shop_id',
        'po_number',
        'status',
        'subtotal',
        'tax_amount',
        'shipping_amount',
        'discount_amount',
        'total_amount',
        'expected_delivery_date',
        'actual_delivery_date',
        'buyer_notes',
        'supplier_notes',
        'payment_status',
        'paid_amount',
        'payment_due_date',
        'payment_date',
        'payment_method',
        'payment_reference',
        'created_by',
        'approved_by',
        'shipped_by',
        'received_by',
        'submitted_at',
        'approved_at',
        'shipped_at',
        'received_at',
    ];

    protected $casts = [
        'status' => PurchaseOrderStatus::class,
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'payment_status' => PurchaseOrderPaymentStatus::class,
        'paid_amount' => 'decimal:2',
        'payment_due_date' => 'date',
        'payment_date' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function buyerTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'buyer_tenant_id');
    }

    public function supplierTenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'supplier_tenant_id');
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PurchaseOrderPayment::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function shippedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shipped_by');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function calculateTotals(): void
    {
        $itemsTotal = $this->items->sum('total_price');

        $this->subtotal = $itemsTotal;
        $this->total_amount = $itemsTotal + $this->tax_amount + $this->shipping_amount - $this->discount_amount;
        $this->save();
    }

    /**
     * Update payment status based on paid amount and due date.
     * Priority: CANCELLED (skip) > PAID > OVERDUE > PARTIAL > PENDING
     */
    public function updatePaymentStatus(): void
    {
        if ($this->payment_status === PurchaseOrderPaymentStatus::CANCELLED) {
            return;
        }

        $totalAmount = (float) $this->total_amount;
        $paidAmount = (float) $this->paid_amount;
        $isFullyPaid = $paidAmount >= $totalAmount && $totalAmount > 0;
        $hasPartialPayment = $paidAmount > 0 && $paidAmount < $totalAmount;
        $isOverdue = $this->payment_due_date && now()->startOfDay()->isAfter($this->payment_due_date);

        if ($isFullyPaid) {
            $this->payment_status = PurchaseOrderPaymentStatus::PAID;
            if (! $this->payment_date) {
                $this->payment_date = $this->payments()->latest('payment_date')->first()?->payment_date ?? now();
            }
        } elseif ($isOverdue) {
            $this->payment_status = PurchaseOrderPaymentStatus::OVERDUE;
        } elseif ($hasPartialPayment) {
            $this->payment_status = PurchaseOrderPaymentStatus::PARTIAL;
        } else {
            $this->payment_status = PurchaseOrderPaymentStatus::PENDING;
        }

        $this->save();
    }

    public function scopeForBuyer($query, $tenantId)
    {
        return $query->where('buyer_tenant_id', $tenantId);
    }

    public function scopeForSupplier($query, $tenantId)
    {
        return $query->where('supplier_tenant_id', $tenantId);
    }

    public function scopeForShop($query, $shopId)
    {
        return $query->where('shop_id', $shopId);
    }

    public function scopeByStatus($query, PurchaseOrderStatus $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if all items in the PO are fully received
     */
    public function isFullyReceived(): bool
    {
        return $this->items->every(fn ($item) => $item->isFullyReceived());
    }

    /**
     * Check if any items have been partially received
     */
    public function hasPartialReceipts(): bool
    {
        return $this->items->some(fn ($item) => $item->received_quantity > 0 && ! $item->isFullyReceived());
    }

    /**
     * Get the total quantity ordered across all items
     */
    public function getTotalOrderedQuantity(): int
    {
        return $this->items->sum('quantity');
    }

    /**
     * Get the total quantity received across all items
     */
    public function getTotalReceivedQuantity(): int
    {
        return $this->items->sum('received_quantity');
    }

    /**
     * Get the receipt completion percentage
     */
    public function getReceiptCompletionPercentage(): float
    {
        $totalOrdered = $this->getTotalOrderedQuantity();

        if ($totalOrdered === 0) {
            return 0;
        }

        return round(($this->getTotalReceivedQuantity() / $totalOrdered) * 100, 2);
    }
}
