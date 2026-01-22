<?php

namespace App\Models;

use App\Enums\NotificationType;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'shop_id',
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'action_url',
        'is_read',
        'read_at',
        'notifiable_type',
        'notifiable_id',
        'minimum_role_level',
    ];

    protected $casts = [
        'type' => NotificationType::class,
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'minimum_role_level' => 'integer',
    ];

    /**
     * Get the tenant that owns the notification
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the shop associated with the notification
     */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /**
     * Get the user that the notification is for
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the notifiable entity (polymorphic)
     */
    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope to get unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope to get read notifications
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope to get notifications for a specific user
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere(function ($q) use ($user) {
                    $q->whereNull('user_id')
                        ->where('tenant_id', $user->tenant_id)
                        ->where(function ($q) use ($user) {
                            $q->whereNull('minimum_role_level')
                                ->orWhere('minimum_role_level', '<=', $user->role->level());
                        });
                });
        });
    }

    /**
     * Scope to get recent notifications (last 30 days)
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): void
    {
        if (! $this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(): void
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    /**
     * Check if the notification is for a specific user
     */
    public function isForUser(User $user): bool
    {
        if ($this->user_id) {
            return $this->user_id === $user->id;
        }

        if ($this->tenant_id !== $user->tenant_id) {
            return false;
        }

        if ($this->minimum_role_level) {
            return $user->role->level() >= $this->minimum_role_level;
        }

        return true;
    }
}
