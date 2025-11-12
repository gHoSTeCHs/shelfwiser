<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TenantService extends Controller
{
    /**
     * @throws \Throwable
     */
    public function createTenant(array $tenantData, array $ownerData): array
    {
        return DB::transaction(function () use ($tenantData, $ownerData) {
            $tenant = Tenant::query()->create([
                'name' => $tenantData['name'],
                'slug' => $this->generateUniqueSlug($tenantData['name']),
                'owner_email' => $tenantData['email'],
                'phone' => $tenantData['phone'] ?? null,
                'address' => $tenantData['address'] ?? null,
                'is_active' => true,
                'max_users' => $tenantData['max_users'] ?? 10,
                'trial_ends_at' => now()->addDays(50),
            ]);

            $owner = User::query()->create([
                'first_name' => $ownerData['first_name'],
                'last_name' => $ownerData['last_name'],
                'email' => $ownerData['email'],
                'password' => Hash::make($ownerData['password']),
                'tenant_id' => $tenant->id,
                'role' => UserRole::OWNER->value,
                'is_tenant_owner' => true,

                'is_active' => true,
            ]);

            return [
                'tenant' => $tenant,
                'owner' => $owner,
            ];
        });
    }

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

}
