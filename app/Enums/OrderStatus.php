<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case PROCESSING = 'processing';
    case PACKED = 'packed';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::CONFIRMED => 'Confirmed',
            self::PROCESSING => 'Processing',
            self::PACKED => 'Packed',
            self::SHIPPED => 'Shipped',
            self::DELIVERED => 'Delivered',
            self::CANCELLED => 'Cancelled',
            self::REFUNDED => 'Refunded',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PENDING => 'Order created, awaiting confirmation',
            self::CONFIRMED => 'Order confirmed, awaiting processing',
            self::PROCESSING => 'Order is being prepared',
            self::PACKED => 'Order has been packed and ready for shipment',
            self::SHIPPED => 'Order has been shipped',
            self::DELIVERED => 'Order has been delivered to customer',
            self::CANCELLED => 'Order has been cancelled',
            self::REFUNDED => 'Order has been refunded',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::CONFIRMED => 'info',
            self::PROCESSING => 'brand',
            self::PACKED => 'blue',
            self::SHIPPED => 'purple',
            self::DELIVERED => 'success',
            self::CANCELLED => 'error',
            self::REFUNDED => 'gray',
        };
    }

    public function canTransitionTo(self $newStatus): bool
    {
        return match ($this) {
            self::PENDING => in_array($newStatus, [self::CONFIRMED, self::CANCELLED]),
            self::CONFIRMED => in_array($newStatus, [self::PROCESSING, self::CANCELLED]),
            self::PROCESSING => in_array($newStatus, [self::PACKED, self::CANCELLED]),
            self::PACKED => in_array($newStatus, [self::SHIPPED, self::CANCELLED]),
            self::SHIPPED => in_array($newStatus, [self::DELIVERED]),
            self::DELIVERED => in_array($newStatus, [self::REFUNDED]),
            self::CANCELLED => false,
            self::REFUNDED => false,
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::DELIVERED, self::CANCELLED, self::REFUNDED]);
    }

    public function canEdit(): bool
    {
        return in_array($this, [self::PENDING, self::CONFIRMED]);
    }

    public function canCancel(): bool
    {
        return !in_array($this, [self::DELIVERED, self::CANCELLED, self::REFUNDED]);
    }

    public static function forSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($status) => [$status->value => $status->label()])
            ->toArray();
    }

    public static function activeStatuses(): array
    {
        return [
            self::PENDING,
            self::CONFIRMED,
            self::PROCESSING,
            self::PACKED,
            self::SHIPPED,
        ];
    }
}
