<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeTaxSetting extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'tax_id_number',
        'tax_state',
        'is_tax_exempt',
        'exemption_reason',
        'exemption_expires_at',
        'active_reliefs',
        'is_homeowner',
        'annual_rent_paid',
        'rent_proof_document',
        'rent_proof_expiry',
        'relief_claims',
        'low_income_auto_exempt',
        'rent_relief_percentage',
    ];

    protected $casts = [
        'is_tax_exempt' => 'boolean',
        'exemption_expires_at' => 'date',
        'active_reliefs' => 'array',
        'is_homeowner' => 'boolean',
        'annual_rent_paid' => 'decimal:2',
        'rent_proof_expiry' => 'date',
        'relief_claims' => 'array',
        'low_income_auto_exempt' => 'boolean',
        'rent_relief_percentage' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeExempt(Builder $query): Builder
    {
        return $query->where('is_tax_exempt', true);
    }

    public function scopeNonExempt(Builder $query): Builder
    {
        return $query->where('is_tax_exempt', false);
    }

    public function isCurrentlyExempt(): bool
    {
        if (! $this->is_tax_exempt) {
            return false;
        }

        if ($this->exemption_expires_at && $this->exemption_expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function hasRelief(string $code): bool
    {
        return in_array($code, $this->active_reliefs ?? []);
    }

    public function addRelief(string $code): void
    {
        $reliefs = $this->active_reliefs ?? [];
        if (! in_array($code, $reliefs)) {
            $reliefs[] = $code;
            $this->active_reliefs = $reliefs;
            $this->save();
        }
    }

    public function removeRelief(string $code): void
    {
        $reliefs = $this->active_reliefs ?? [];
        $this->active_reliefs = array_values(array_filter($reliefs, fn ($r) => $r !== $code));
        $this->save();
    }

    public function getActiveReliefCodes(): array
    {
        return $this->active_reliefs ?? [];
    }

    public function setExemption(string $reason, ?\DateTimeInterface $expiresAt = null): void
    {
        $this->is_tax_exempt = true;
        $this->exemption_reason = $reason;
        $this->exemption_expires_at = $expiresAt;
        $this->save();
    }

    public function clearExemption(): void
    {
        $this->is_tax_exempt = false;
        $this->exemption_reason = null;
        $this->exemption_expires_at = null;
        $this->save();
    }

    /**
     * Check if employee can claim rent relief (NTA 2025).
     * Eligible if: not a homeowner, has rent paid, and has valid proof.
     */
    public function canClaimRentRelief(): bool
    {
        if ($this->is_homeowner) {
            return false;
        }

        if (! $this->annual_rent_paid || $this->annual_rent_paid <= 0) {
            return false;
        }

        return $this->hasValidRentProof();
    }

    /**
     * Check if employee has valid rent proof documentation.
     */
    public function hasValidRentProof(): bool
    {
        if (! $this->rent_proof_document) {
            return false;
        }

        if ($this->rent_proof_expiry && $this->rent_proof_expiry->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Calculate rent relief amount (NTA 2025).
     * Uses employee-specific rent_relief_percentage if set, otherwise uses provided rate parameter.
     *
     * @param  float|null  $rate  Relief rate override (uses rent_relief_percentage if null)
     * @param  float  $cap  Maximum relief cap (default 500000)
     */
    public function getRentReliefAmount(?float $rate = null, float $cap = 500000): float
    {
        if (! $this->canClaimRentRelief()) {
            return 0;
        }

        $effectiveRate = $rate ?? ($this->rent_relief_percentage / 100) ?? 0.20;

        $reliefAmount = (float) $this->annual_rent_paid * $effectiveRate;

        return min($reliefAmount, $cap);
    }

    /**
     * Get eligibility settings for relief checking.
     */
    public function getEligibilitySettings(): array
    {
        return [
            'is_homeowner' => (bool) $this->is_homeowner,
            'has_valid_proof' => $this->hasValidRentProof(),
            'annual_rent_paid' => (float) ($this->annual_rent_paid ?? 0),
            'is_tax_exempt' => (bool) $this->is_tax_exempt,
            'low_income_auto_exempt' => (bool) $this->low_income_auto_exempt,
        ];
    }

    /**
     * Record a relief claim for audit purposes.
     */
    public function recordReliefClaim(string $code, float $amount, string $period): void
    {
        $claims = $this->relief_claims ?? [];
        $claims[] = [
            'code' => $code,
            'amount' => $amount,
            'period' => $period,
            'claimed_at' => now()->toIso8601String(),
        ];
        $this->relief_claims = $claims;
        $this->save();
    }

    /**
     * Update rent proof information.
     */
    public function updateRentProof(string $documentPath, ?\DateTimeInterface $expiresAt = null): void
    {
        $this->rent_proof_document = $documentPath;
        $this->rent_proof_expiry = $expiresAt ?? now()->addYear();
        $this->save();
    }

    /**
     * Scope to get employees eligible for rent relief.
     */
    public function scopeEligibleForRentRelief(Builder $query): Builder
    {
        return $query->where('is_homeowner', false)
            ->where('annual_rent_paid', '>', 0)
            ->whereNotNull('rent_proof_document')
            ->where(function ($q) {
                $q->whereNull('rent_proof_expiry')
                    ->orWhere('rent_proof_expiry', '>=', now());
            });
    }
}
