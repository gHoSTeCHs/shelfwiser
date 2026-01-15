<?php

namespace App\Models;

use App\Enums\TimesheetStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Timesheet extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'shop_id',
        'tenant_id',
        'date',
        'clock_in',
        'clock_out',
        'break_start',
        'break_end',
        'break_duration_minutes',
        'regular_hours',
        'overtime_hours',
        'total_hours',
        'notes',
        'status',
        'approved_by_user_id',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'break_start' => 'datetime',
        'break_end' => 'datetime',
        'break_duration_minutes' => 'integer',
        'regular_hours' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'total_hours' => 'decimal:2',
        'status' => TimesheetStatus::class,
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * Check if the timesheet is currently clocked in
     */
    public function isClockedIn(): bool
    {
        return $this->clock_in !== null && $this->clock_out === null;
    }

    /**
     * Check if the timesheet is on break
     */
    public function isOnBreak(): bool
    {
        return $this->break_start !== null && $this->break_end === null;
    }

    /**
     * Get the duration in minutes
     */
    public function getDurationMinutes(): int
    {
        if (! $this->clock_in || ! $this->clock_out) {
            return 0;
        }

        $totalMinutes = $this->clock_out->diffInMinutes($this->clock_in);

        return max(0, $totalMinutes - $this->break_duration_minutes);
    }
}
