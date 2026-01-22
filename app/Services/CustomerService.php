<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class CustomerService
{
    /**
     * Get paginated list of customers with optional filters.
     */
    public function list(Tenant $tenant, User $requester, array $filters = []): LengthAwarePaginator
    {
        $query = Customer::query()
            ->where('tenant_id', $tenant->id)
            ->with(['preferredShop:id,name,slug'])
            ->withCount(['orders', 'addresses']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $isActive = $filters['status'] === 'active';
            $query->where('is_active', $isActive);
        }

        if (!empty($filters['has_credit'])) {
            if ($filters['has_credit'] === 'yes') {
                $query->whereNotNull('credit_limit')->where('credit_limit', '>', 0);
            } else {
                $query->where(function ($q) {
                    $q->whereNull('credit_limit')->orWhere('credit_limit', '<=', 0);
                });
            }
        }

        if (!empty($filters['shop_id'])) {
            $query->where('preferred_shop_id', $filters['shop_id']);
        }

        $sortField = $filters['sort'] ?? 'created_at';
        $sortDirection = $filters['direction'] ?? 'desc';
        $allowedSorts = ['first_name', 'last_name', 'email', 'created_at', 'account_balance', 'total_purchases'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query->paginate($filters['per_page'] ?? 15)->withQueryString();
    }

    /**
     * Find a single customer with relationships.
     */
    public function find(int $customerId, Tenant $tenant): ?Customer
    {
        return Customer::query()
            ->where('id', $customerId)
            ->where('tenant_id', $tenant->id)
            ->with([
                'preferredShop:id,name,slug',
                'addresses',
                'orders' => fn ($q) => $q->latest()->limit(5),
                'orders.shop:id,name',
            ])
            ->withCount(['orders', 'addresses'])
            ->first();
    }

    /**
     * Create a new customer.
     *
     * @throws Throwable
     */
    public function create(array $data, Tenant $tenant): Customer
    {
        Log::info('Customer creation started.', [
            'tenant_id' => $tenant->id,
            'email' => $data['email'],
        ]);

        try {
            return DB::transaction(function () use ($data, $tenant) {
                $customer = Customer::create([
                    'tenant_id' => $tenant->id,
                    'preferred_shop_id' => $data['preferred_shop_id'] ?? null,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'password' => Hash::make($data['password']),
                    'is_active' => $data['is_active'] ?? true,
                    'marketing_opt_in' => $data['marketing_opt_in'] ?? false,
                    'credit_limit' => !empty($data['credit_limit']) ? $data['credit_limit'] : null,
                    'account_balance' => 0,
                    'total_purchases' => 0,
                ]);

                if (!empty($data['address'])) {
                    $this->createAddress($customer, $data['address']);
                }

                $this->invalidateListCache($tenant->id);

                Log::info('Customer created successfully.', ['customer_id' => $customer->id]);

                return $customer->load(['preferredShop', 'addresses']);
            });
        } catch (Throwable $e) {
            Log::error('Customer creation failed.', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing customer.
     *
     * @throws Throwable
     */
    public function update(Customer $customer, array $data): Customer
    {
        Log::info('Customer update started.', ['customer_id' => $customer->id]);

        try {
            return DB::transaction(function () use ($customer, $data) {
                $updateData = array_filter([
                    'first_name' => $data['first_name'] ?? null,
                    'last_name' => $data['last_name'] ?? null,
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'preferred_shop_id' => array_key_exists('preferred_shop_id', $data) ? $data['preferred_shop_id'] : null,
                    'marketing_opt_in' => $data['marketing_opt_in'] ?? null,
                ], fn ($value) => $value !== null);

                if (isset($data['is_active'])) {
                    $updateData['is_active'] = $data['is_active'];
                }

                if (array_key_exists('credit_limit', $data)) {
                    $updateData['credit_limit'] = !empty($data['credit_limit']) ? $data['credit_limit'] : null;
                }

                $customer->update($updateData);

                if (!empty($data['address'])) {
                    $this->updateOrCreatePrimaryAddress($customer, $data['address']);
                }

                $this->invalidateCustomerCache($customer);

                Log::info('Customer updated successfully.', ['customer_id' => $customer->id]);

                return $customer->fresh(['preferredShop', 'addresses']);
            });
        } catch (Throwable $e) {
            Log::error('Customer update failed.', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Soft delete a customer.
     */
    public function delete(Customer $customer): bool
    {
        Log::info('Customer deletion started.', ['customer_id' => $customer->id]);

        try {
            $customer->delete();
            $this->invalidateCustomerCache($customer);

            Log::info('Customer deleted successfully.', ['customer_id' => $customer->id]);
            return true;
        } catch (Throwable $e) {
            Log::error('Customer deletion failed.', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get customer statistics for the tenant.
     */
    public function getStatistics(Tenant $tenant): array
    {
        $baseQuery = Customer::query()->where('tenant_id', $tenant->id);

        $totalCustomers = (clone $baseQuery)->count();
        $activeCustomers = (clone $baseQuery)->where('is_active', true)->count();
        $customersWithCredit = (clone $baseQuery)
            ->whereNotNull('credit_limit')
            ->where('credit_limit', '>', 0)
            ->count();
        $totalCreditBalance = (clone $baseQuery)->sum('account_balance');
        $newThisMonth = (clone $baseQuery)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        return [
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'customers_with_credit' => $customersWithCredit,
            'total_credit_balance' => number_format($totalCreditBalance, 2),
            'new_this_month' => $newThisMonth,
        ];
    }

    /**
     * Toggle customer active status.
     */
    public function toggleActive(Customer $customer, bool $active): Customer
    {
        $customer->update(['is_active' => $active]);
        $this->invalidateCustomerCache($customer);

        Log::info('Customer status toggled.', [
            'customer_id' => $customer->id,
            'is_active' => $active,
        ]);

        return $customer->fresh();
    }

    /**
     * Update customer credit limit.
     */
    public function setCreditLimit(Customer $customer, ?float $limit): Customer
    {
        $customer->update([
            'credit_limit' => $limit > 0 ? $limit : null,
        ]);

        $this->invalidateCustomerCache($customer);

        Log::info('Customer credit limit updated.', [
            'customer_id' => $customer->id,
            'credit_limit' => $limit,
        ]);

        return $customer->fresh();
    }

    /**
     * Generate quick customer data for rapid creation.
     */
    public function generateQuickCustomerData(Tenant $tenant): array
    {
        $timestamp = now()->timestamp;
        $uniqueId = strtoupper(Str::random(6));

        return [
            'first_name' => 'Customer',
            'last_name' => $uniqueId,
            'email' => "customer_{$timestamp}@{$tenant->slug}.local",
            'phone' => '',
            'password' => 'password',
            'address' => [
                'street' => 'Address pending update',
                'city' => 'City',
                'state' => 'State',
                'postal_code' => '000000',
            ],
            'is_active' => true,
            'marketing_opt_in' => false,
            'credit_limit' => null,
        ];
    }

    /**
     * Create an address for the customer.
     */
    protected function createAddress(Customer $customer, array $addressData): CustomerAddress
    {
        return $customer->addresses()->create([
            'tenant_id' => $customer->tenant_id,
            'label' => $addressData['label'] ?? 'Primary',
            'street' => $addressData['street'],
            'city' => $addressData['city'],
            'state' => $addressData['state'],
            'postal_code' => $addressData['postal_code'],
            'country' => $addressData['country'] ?? 'Nigeria',
            'is_default' => true,
        ]);
    }

    /**
     * Update or create the primary address.
     */
    protected function updateOrCreatePrimaryAddress(Customer $customer, array $addressData): CustomerAddress
    {
        $primaryAddress = $customer->addresses()->where('is_default', true)->first();

        if ($primaryAddress) {
            $primaryAddress->update([
                'street' => $addressData['street'],
                'city' => $addressData['city'],
                'state' => $addressData['state'],
                'postal_code' => $addressData['postal_code'],
            ]);
            return $primaryAddress;
        }

        return $this->createAddress($customer, $addressData);
    }

    /**
     * Invalidate customer list cache for tenant.
     */
    protected function invalidateListCache(int $tenantId): void
    {
        Cache::tags(["tenant:{$tenantId}:customers:list"])->flush();
    }

    /**
     * Invalidate specific customer cache.
     */
    protected function invalidateCustomerCache(Customer $customer): void
    {
        Cache::tags([
            "tenant:{$customer->tenant_id}:customers:list",
            "tenant:{$customer->tenant_id}:customers:{$customer->id}",
        ])->flush();
    }
}
