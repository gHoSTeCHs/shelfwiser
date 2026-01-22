<?php

namespace App\Services;

use App\Enums\UserRole;
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
                $staff = User::query()->create([
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

                // Invalidate only list cache, not individual staff caches
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

                $staff->update($updateData);

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

                $staff->update(['is_active' => false]);

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
}
