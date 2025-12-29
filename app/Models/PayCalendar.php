<?php

namespace App\Models;

use App\Enums\PayFrequency;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class PayCalendar extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'frequency',
        'pay_day',
        'cutoff_day',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'frequency' => PayFrequency::class,
        'pay_day' => 'integer',
        'cutoff_day' => 'integer',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(EmployeePayrollDetail::class);
    }

    public function payPeriods(): HasMany
    {
        return $this->hasMany(PayrollPeriod::class);
    }

    /**
     * Scope to filter active pay calendars
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter for a specific tenant
     */
    public function scopeForTenant($query, int $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get the default calendar for a tenant
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Get the next pay date from a given date
     */
    public function getNextPayDate(Carbon $from = null): Carbon
    {
        $from = $from ?? now();
        $payDay = $this->pay_day;

        $nextPayDate = $from->copy()->setDay(min($payDay, $from->daysInMonth));

        if ($nextPayDate->lte($from)) {
            $nextPayDate->addMonth();
            $nextPayDate->setDay(min($payDay, $nextPayDate->daysInMonth));
        }

        return $nextPayDate;
    }

    /**
     * Get the period start and end dates for a given pay date
     */
    public function getPeriodDates(Carbon $payDate): array
    {
        return match ($this->frequency) {
            PayFrequency::WEEKLY => [
                'start' => $payDate->copy()->subWeek()->startOfDay(),
                'end' => $payDate->copy()->subDay()->endOfDay(),
            ],
            PayFrequency::BI_WEEKLY => [
                'start' => $payDate->copy()->subWeeks(2)->startOfDay(),
                'end' => $payDate->copy()->subDay()->endOfDay(),
            ],
            PayFrequency::SEMI_MONTHLY => $this->getSemiMonthlyDates($payDate),
            PayFrequency::MONTHLY => [
                'start' => $payDate->copy()->subMonth()->addDay()->startOfDay(),
                'end' => $payDate->copy()->endOfDay(),
            ],
            default => [
                'start' => $payDate->copy()->startOfMonth(),
                'end' => $payDate->copy()->endOfMonth(),
            ],
        };
    }

    /**
     * Get semi-monthly period dates
     */
    protected function getSemiMonthlyDates(Carbon $payDate): array
    {
        if ($payDate->day <= 15) {
            return [
                'start' => $payDate->copy()->subMonth()->setDay(16)->startOfDay(),
                'end' => $payDate->copy()->endOfDay(),
            ];
        }

        return [
            'start' => $payDate->copy()->setDay(1)->startOfDay(),
            'end' => $payDate->copy()->setDay(15)->endOfDay(),
        ];
    }
}
