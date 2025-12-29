<?php

namespace App\Models;

use App\Enums\EmploymentType;
use App\Enums\PayFrequency;
use App\Enums\PayType;
use App\Enums\TaxHandling;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeePayrollDetail extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'employment_type',
        'pay_type',
        'pay_amount',
        'pay_frequency',
        'pay_calendar_id',
        'standard_hours_per_week',
        'overtime_multiplier',
        'weekend_multiplier',
        'holiday_multiplier',
        'commission_rate',
        'commission_basis',
        'commission_cap',
        'tax_handling',
        'enable_tax_calculations',
        'tax_id_number',
        'pension_enabled',
        'pension_employee_rate',
        'pension_employer_rate',
        'nhf_enabled',
        'nhf_rate',
        'nhis_enabled',
        'nhis_amount',
        'other_deductions_enabled',
        'bank_account_number',
        'bank_name',
        'routing_number',
        'emergency_contact_name',
        'emergency_contact_phone',
        'position_title',
        'department',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'employment_type' => EmploymentType::class,
        'pay_type' => PayType::class,
        'pay_amount' => 'decimal:2',
        'pay_frequency' => PayFrequency::class,
        'standard_hours_per_week' => 'decimal:2',
        'overtime_multiplier' => 'decimal:2',
        'weekend_multiplier' => 'decimal:2',
        'holiday_multiplier' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_cap' => 'decimal:2',
        'tax_handling' => TaxHandling::class,
        'enable_tax_calculations' => 'boolean',
        'tax_id_number' => 'encrypted',
        'pension_enabled' => 'boolean',
        'pension_employee_rate' => 'decimal:2',
        'pension_employer_rate' => 'decimal:2',
        'nhf_enabled' => 'boolean',
        'nhf_rate' => 'decimal:2',
        'nhis_enabled' => 'boolean',
        'nhis_amount' => 'decimal:2',
        'other_deductions_enabled' => 'boolean',
        'bank_account_number' => 'encrypted',
        'routing_number' => 'encrypted',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function payCalendar(): BelongsTo
    {
        return $this->belongsTo(PayCalendar::class);
    }

    public function customDeductions(): HasMany
    {
        return $this->hasMany(EmployeeCustomDeduction::class, 'user_id', 'user_id');
    }

    /**
     * Calculate monthly working hours based on standard hours per week
     */
    public function getMonthlyHours(): float
    {
        $weeksPerMonth = 4.33;
        $standardHours = $this->standard_hours_per_week ?? 40;
        return $standardHours * $weeksPerMonth;
    }

    /**
     * Calculate effective hourly rate from salary or return hourly rate for hourly workers
     */
    public function calculateHourlyRate(): float
    {
        if ($this->pay_type?->value === 'hourly') {
            return (float) $this->pay_amount;
        }

        $monthlyHours = $this->getMonthlyHours();
        return $monthlyHours > 0 ? (float) $this->pay_amount / $monthlyHours : 0;
    }

    /**
     * Calculate commission based on sales amount, applying rate and cap
     */
    public function calculateCommission(float $salesAmount): float
    {
        if (!$this->commission_rate || $this->commission_rate <= 0) {
            return 0;
        }

        $commission = $salesAmount * ($this->commission_rate / 100);

        if ($this->commission_cap && $commission > $this->commission_cap) {
            return (float) $this->commission_cap;
        }

        return $commission;
    }

    /**
     * Calculate overtime pay for given hours
     */
    public function calculateOvertimePay(float $overtimeHours): float
    {
        $hourlyRate = $this->calculateHourlyRate();
        $multiplier = $this->overtime_multiplier ?? 1.5;
        return $overtimeHours * $hourlyRate * $multiplier;
    }

    /**
     * Calculate weekend pay for given hours
     */
    public function calculateWeekendPay(float $weekendHours): float
    {
        $hourlyRate = $this->calculateHourlyRate();
        $multiplier = $this->weekend_multiplier ?? 2.0;
        return $weekendHours * $hourlyRate * $multiplier;
    }

    /**
     * Calculate holiday pay for given hours
     */
    public function calculateHolidayPay(float $holidayHours): float
    {
        $hourlyRate = $this->calculateHourlyRate();
        $multiplier = $this->holiday_multiplier ?? 2.5;
        return $holidayHours * $hourlyRate * $multiplier;
    }
}
