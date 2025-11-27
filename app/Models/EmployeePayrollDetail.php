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

class EmployeePayrollDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'employment_type',
        'pay_type',
        'pay_amount',
        'pay_frequency',
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

    public function customDeductions(): HasMany
    {
        return $this->hasMany(EmployeeCustomDeduction::class, 'user_id', 'user_id');
    }
}
