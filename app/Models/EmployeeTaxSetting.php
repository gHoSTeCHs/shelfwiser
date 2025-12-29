<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class EmployeeTaxSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'tax_id_number',
        'tax_state',
        'is_tax_exempt',
        'exemption_reason',
        'exemption_expires_at',
        'active_reliefs',
    ];

    protected $casts = [
        'is_tax_exempt' => 'boolean',
        'exemption_expires_at' => 'date',
        'active_reliefs' => 'array',
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
        if (!$this->is_tax_exempt) {
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
        if (!in_array($code, $reliefs)) {
            $reliefs[] = $code;
            $this->active_reliefs = $reliefs;
            $this->save();
        }
    }

    public function removeRelief(string $code): void
    {
        $reliefs = $this->active_reliefs ?? [];
        $this->active_reliefs = array_values(array_filter($reliefs, fn($r) => $r !== $code));
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
}
