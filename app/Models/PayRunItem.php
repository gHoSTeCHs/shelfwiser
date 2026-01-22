<?php

namespace App\Models;

use App\Enums\PayRunItemStatus;
use App\Enums\TaxLawVersion;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PayRunItem extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'pay_run_id',
        'user_id',
        'payslip_id',
        'status',
        'basic_salary',
        'gross_earnings',
        'taxable_earnings',
        'total_deductions',
        'net_pay',
        'employer_pension',
        'employer_nhf',
        'total_employer_cost',
        'earnings_breakdown',
        'deductions_breakdown',
        'tax_calculation',
        'error_message',
    ];

    protected $casts = [
        'status' => PayRunItemStatus::class,
        'earnings_breakdown' => 'array',
        'deductions_breakdown' => 'array',
        'tax_calculation' => 'array',
        'basic_salary' => 'decimal:2',
        'gross_earnings' => 'decimal:2',
        'taxable_earnings' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'employer_pension' => 'decimal:2',
        'employer_nhf' => 'decimal:2',
        'total_employer_cost' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function payRun(): BelongsTo
    {
        return $this->belongsTo(PayRun::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payslip(): BelongsTo
    {
        return $this->belongsTo(Payslip::class);
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForPayRun(Builder $query, int $payRunId): Builder
    {
        return $query->where('pay_run_id', $payRunId);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', PayRunItemStatus::PENDING);
    }

    public function scopeCalculated(Builder $query): Builder
    {
        return $query->where('status', PayRunItemStatus::CALCULATED);
    }

    public function scopeWithErrors(Builder $query): Builder
    {
        return $query->where('status', PayRunItemStatus::ERROR);
    }

    public function scopeExcluded(Builder $query): Builder
    {
        return $query->where('status', PayRunItemStatus::EXCLUDED);
    }

    public function scopeProcessable(Builder $query): Builder
    {
        return $query->whereIn('status', [PayRunItemStatus::PENDING, PayRunItemStatus::ERROR]);
    }

    public function isPending(): bool
    {
        return $this->status === PayRunItemStatus::PENDING;
    }

    public function isCalculated(): bool
    {
        return $this->status === PayRunItemStatus::CALCULATED;
    }

    public function hasError(): bool
    {
        return $this->status === PayRunItemStatus::ERROR;
    }

    public function isExcluded(): bool
    {
        return $this->status === PayRunItemStatus::EXCLUDED;
    }

    public function markAsCalculated(array $data): void
    {
        $this->update(array_merge($data, [
            'status' => PayRunItemStatus::CALCULATED,
            'error_message' => null,
        ]));
    }

    public function markAsError(string $message): void
    {
        $this->update([
            'status' => PayRunItemStatus::ERROR,
            'error_message' => $message,
        ]);
    }

    public function exclude(string $reason): void
    {
        $this->update([
            'status' => PayRunItemStatus::EXCLUDED,
            'error_message' => $reason,
        ]);
    }

    public function reset(): void
    {
        $this->update([
            'status' => PayRunItemStatus::PENDING,
            'basic_salary' => 0,
            'gross_earnings' => 0,
            'taxable_earnings' => 0,
            'total_deductions' => 0,
            'net_pay' => 0,
            'employer_pension' => 0,
            'employer_nhf' => 0,
            'total_employer_cost' => 0,
            'earnings_breakdown' => null,
            'deductions_breakdown' => null,
            'tax_calculation' => null,
            'error_message' => null,
        ]);
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->status->label();
    }

    public function getStatusColorAttribute(): string
    {
        return $this->status->color();
    }

    /**
     * Get the tax law version used for this pay run item.
     */
    public function getTaxLawVersion(): ?TaxLawVersion
    {
        $taxCalc = $this->tax_calculation ?? [];
        $version = $taxCalc['tax_law_version'] ?? null;

        if (! $version) {
            return null;
        }

        return TaxLawVersion::tryFrom($version);
    }

    /**
     * Check if this item was calculated with low-income exemption.
     */
    public function isLowIncomeExempt(): bool
    {
        $taxCalc = $this->tax_calculation ?? [];

        return (bool) ($taxCalc['is_low_income_exempt'] ?? $taxCalc['low_income_exempt'] ?? false);
    }

    /**
     * Get reliefs applied in this calculation.
     */
    public function getReliefsApplied(): array
    {
        $taxCalc = $this->tax_calculation ?? [];

        return $taxCalc['reliefs_applied'] ?? [];
    }

    /**
     * Get the tax law version label for display.
     */
    public function getTaxLawVersionLabelAttribute(): string
    {
        $version = $this->getTaxLawVersion();

        return $version?->shortLabel() ?? 'Unknown';
    }

    /**
     * Check if rent relief was applied.
     */
    public function hasRentRelief(): bool
    {
        $reliefs = $this->getReliefsApplied();

        return collect($reliefs)->contains(fn ($r) => ($r['code'] ?? '') === 'RENT_RELIEF');
    }

    /**
     * Get the effective tax rate for this item.
     */
    public function getEffectiveTaxRate(): float
    {
        if (! $this->gross_earnings || $this->gross_earnings <= 0) {
            return 0;
        }

        $taxCalc = $this->tax_calculation ?? [];
        $tax = $taxCalc['tax'] ?? 0;

        return round(($tax / $this->gross_earnings) * 100, 2);
    }
}
