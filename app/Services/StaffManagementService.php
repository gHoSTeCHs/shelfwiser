<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\EmployeePayrollDetail;
use App\Models\EmployeeTemplate;
use App\Models\PayCalendar;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class StaffManagementService
{
    /**
     * Create a new staff member.
     *
     * @throws Throwable
     */
    public function create(array $data, Tenant $tenant, User $creator): User
    {
        Log::info('Staff creation process started.', [
            'tenant_id' => $tenant->id,
            'creator_id' => $creator->id,
            'role' => $data['role'],
        ]);

        try {
            return DB::transaction(function () use ($data, $tenant) {
                $staff = User::query()->forceCreate([
                    'tenant_id' => $tenant->id,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'role' => $this->normalizeRole($data['role']),
                    'password' => Hash::make($data['password']),
                    'is_tenant_owner' => false,
                ]);

                if (! empty($data['shop_ids'])) {
                    $this->assignShops($staff, $data['shop_ids'], $tenant);
                }

                // TODO: Send invitation email if requested
                if ($data['send_invitation'] ?? false) {
                    Log::info('Invitation email queued for staff.', ['staff_id' => $staff->id]);
                }

                Cache::tags(["tenant:$tenant->id:staff:list"])->flush();

                Log::info('Staff member created successfully.', [
                    'staff_id' => $staff->id,
                    'role' => $staff->role->value,
                ]);

                return $staff->load('shops');
            });
        } catch (Throwable $e) {
            Log::error('Staff creation failed.', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Update an existing staff member.
     *
     * @throws Throwable
     */
    public function update(User $staff, array $data, User $updater): User
    {
        Log::info('Staff update process started.', [
            'staff_id' => $staff->id,
            'updater_id' => $updater->id,
        ]);

        try {
            return DB::transaction(function () use ($staff, $data) {
                $updateData = array_filter([
                    'first_name' => $data['first_name'] ?? null,
                    'last_name' => $data['last_name'] ?? null,
                    'email' => $data['email'] ?? null,
                    'role' => isset($data['role']) ? $this->normalizeRole($data['role']) : null,
                ], fn ($value) => $value !== null);

                if (isset($data['is_active'])) {
                    $updateData['is_active'] = $data['is_active'];
                }

                $staff->forceFill($updateData)->save();

                if (isset($data['shop_ids'])) {
                    $this->assignShops($staff, $data['shop_ids'], $staff->tenant);
                }

                // Invalidate specific staff cache and list cache
                Cache::tags([
                    "tenant:$staff->tenant_id:staff:list",
                    "tenant:$staff->tenant_id:staff:$staff->id",
                ])->flush();

                Log::info('Staff member updated successfully.', ['staff_id' => $staff->id]);

                return $staff->load('shops');
            });
        } catch (Throwable $e) {
            Log::error('Staff update failed.', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Get all staff members for a tenant with optional filters.
     */
    public function list(Tenant $tenant, User $requester, array $filters = []): Collection
    {
        $query = User::query()
            ->where('tenant_id', $tenant->id)
            ->with([
                'shops' => fn ($q) => $q->select('shops.id', 'shops.name', 'shops.slug'),
                'employeePayrollDetail' => fn ($q) => $q->select('id', 'user_id', 'employment_type', 'pay_type'),
            ])
            ->orderBy('created_at', 'desc');

        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (! empty($filters['shop_id'])) {
            $query->whereHas('shops', fn ($q) => $q->where('shops.id', $filters['shop_id']));
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if ($requester->role->value === UserRole::STORE_MANAGER->value) {
            $shopIds = $requester->shops()->pluck('shops.id');
            $query->whereHas('shops', fn ($q) => $q->whereIn('shops.id', $shopIds));
        }

        return $query->get();
    }

    /**
     * Get a single staff member with relationships.
     */
    public function find(int $staffId, Tenant $tenant): ?User
    {
        return User::query()
            ->where('id', $staffId)
            ->where('tenant_id', $tenant->id)
            ->with(['shops'])
            ->first();
    }

    /**
     * Delete a staff member (soft delete by deactivating).
     */
    public function delete(User $staff): bool
    {
        Log::info('Staff deletion process started.', ['staff_id' => $staff->id]);

        try {
            DB::transaction(function () use ($staff) {
                $staff->shops()->detach();

                $staff->forceFill(['is_active' => false])->save();

                // Invalidate specific staff cache and list cache
                Cache::tags([
                    "tenant:$staff->tenant_id:staff:list",
                    "tenant:$staff->tenant_id:staff:$staff->id",
                ])->flush();
            });

            Log::info('Staff member deleted successfully.', ['staff_id' => $staff->id]);

            return true;
        } catch (Throwable $e) {
            Log::error('Staff deletion failed.', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Assign shops to a staff member.
     */
    protected function assignShops(User $staff, array $shopIds, Tenant $tenant): void
    {
        $validShops = Shop::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $shopIds)
            ->pluck('id');

        if ($validShops->count() !== count($shopIds)) {
            Log::warning('Some shop IDs were invalid for staff assignment.', [
                'staff_id' => $staff->id,
                'requested_shops' => $shopIds,
                'valid_shops' => $validShops->toArray(),
            ]);
        }

        $syncData = $validShops->mapWithKeys(function ($shopId) use ($tenant) {
            return [$shopId => ['tenant_id' => $tenant->id]];
        })->toArray();

        $staff->shops()->sync($syncData);

        Log::info('Shops assigned to staff member.', [
            'staff_id' => $staff->id,
            'shop_count' => $validShops->count(),
        ]);
    }

    /**
     * Get staff statistics for a tenant.
     */
    public function getStatistics(Tenant $tenant): array
    {
        $totalStaff = User::query()->where('tenant_id', $tenant->id)->count();
        $activeStaff = User::query()->where('tenant_id', $tenant->id)->where('is_active', true)->count();

        $roleDistribution = User::query()
            ->where('tenant_id', $tenant->id)
            ->select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->mapWithKeys(function ($item) {
                // Handle both string and enum values
                $role = $item->role instanceof UserRole
                    ? $item->role
                    : UserRole::from($item->role);

                return [$role->label() => $item->count];
            });

        return [
            'total_staff' => $totalStaff,
            'active_staff' => $activeStaff,
            'inactive_staff' => $totalStaff - $activeStaff,
            'role_distribution' => $roleDistribution,
        ];
    }

    /**
     * Normalize role input to UserRole enum.
     * Handles both string values and UserRole enum instances.
     */
    protected function normalizeRole(mixed $role): UserRole
    {
        if ($role instanceof UserRole) {
            return $role;
        }

        return UserRole::from($role);
    }

    public function getAssignableRoles(User $currentUser): \Illuminate\Support\Collection
    {
        return collect(UserRole::cases())
            ->filter(fn ($role) => $role !== UserRole::OWNER && $currentUser->role->level() > $role->level())
            ->map(fn ($role) => [
                'value' => $role->value,
                'label' => $role->label(),
                'description' => $role->description(),
                'level' => $role->level(),
                'can_access_multiple_shops' => $role->canAccessMultipleStores(),
            ])
            ->values();
    }

    public function getShopsForForm(): Collection
    {
        return Shop::query()
            ->where('is_active', true)
            ->select('id', 'name', 'slug', 'city', 'state')
            ->get();
    }

    public function getShopsForIndex(): Collection
    {
        return Shop::query()
            ->select('id', 'name', 'slug')
            ->get();
    }

    public function getPayCalendars(): array
    {
        return PayCalendar::query()
            ->where('is_active', true)
            ->select('id', 'name', 'frequency', 'pay_day', 'is_default')
            ->get()
            ->toArray();
    }

    public function getDepartments(): array
    {
        return EmployeePayrollDetail::query()
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->filter()
            ->values()
            ->toArray();
    }

    public function getTemplates(int $tenantId): array
    {
        return EmployeeTemplate::availableFor($tenantId)
            ->orderByDesc('is_system')
            ->orderByDesc('usage_count')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    public function getTaxConfigurationStatus(User $staff): array
    {
        $taxSettings = $staff->taxSettings;

        if (! $taxSettings) {
            return [
                'status' => 'not_configured',
                'label' => 'Not Configured',
                'color' => 'warning',
                'is_homeowner' => null,
                'has_rent_proof' => false,
            ];
        }

        $isComplete = $taxSettings->tax_id_number !== null;

        return [
            'status' => $isComplete ? 'complete' : 'partial',
            'label' => $isComplete ? 'Configured' : 'Needs Attention',
            'color' => $isComplete ? 'success' : 'info',
            'is_homeowner' => $taxSettings->is_homeowner,
            'has_rent_proof' => $taxSettings->hasValidRentProof(),
        ];
    }
}
