<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'tenant_id',
        'is_tenant_owner',
        'is_super_admin',
        'role',
        'is_active',
        'is_customer',
        'marketing_opt_in',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_tenant_owner' => 'boolean',
            'is_super_admin' => 'boolean',
            'is_active' => 'boolean',
            'is_customer' => 'boolean',
            'marketing_opt_in' => 'boolean',
        ];
    }

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function isTenantOwner(): bool
    {
        return $this->is_tenant_owner;
    }

    /**
     * Check if the user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin || $this->role === UserRole::SUPER_ADMIN;
    }

    /**
     * Check if the user belongs to a tenant.
     */
    public function hasTenant(): bool
    {
        return $this->tenant_id !== null;
    }

    /**
     * Check if the user can access a specific tenant.
     */
    public function canAccessTenant(?int $tenantId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->tenant_id === $tenantId;
    }

    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->role->hasPermission($permission);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function shops(): BelongsToMany
    {
        return $this->belongsToMany(Shop::class, 'shop_user')
            ->withTimestamps();
    }

    /**
     * Get the customer's cart for a specific shop.
     */
    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class, 'customer_id');
    }

    /**
     * Get the customer's addresses.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class, 'customer_id');
    }

    /**
     * Get the customer's default shipping address.
     */
    public function defaultShippingAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class, 'customer_id')
            ->where('is_default', true)
            ->ofType('shipping');
    }

    /**
     * Get the customer's default billing address.
     */
    public function defaultBillingAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class, 'customer_id')
            ->where('is_default', true)
            ->ofType('billing');
    }

    public function employeePayrollDetail(): HasOne
    {
        return $this->hasOne(EmployeePayrollDetail::class);
    }

    public function customDeductions(): HasMany
    {
        return $this->hasMany(EmployeeCustomDeduction::class);
    }

    public function timesheets(): HasMany
    {
        return $this->hasMany(Timesheet::class);
    }

    public function fundRequests(): HasMany
    {
        return $this->hasMany(FundRequest::class);
    }

    public function wageAdvances(): HasMany
    {
        return $this->hasMany(WageAdvance::class);
    }

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

}
