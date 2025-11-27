<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShopUserSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::with(['users', 'shops'])->get();

        foreach ($tenants as $tenant) {
            $this->assignUsersToShops($tenant);
        }
    }

    protected function assignUsersToShops($tenant): void
    {
        $users = $tenant->users;
        $shops = $tenant->shops;

        $owner = $users->where('role', UserRole::OWNER)->first();
        $generalManager = $users->where('role', UserRole::GENERAL_MANAGER)->first();
        $storeManagers = $users->where('role', UserRole::STORE_MANAGER);
        $assistantManager = $users->where('role', UserRole::ASSISTANT_MANAGER)->first();
        $salesReps = $users->where('role', UserRole::SALES_REP);
        $cashiers = $users->where('role', UserRole::CASHIER);
        $inventoryClerk = $users->where('role', UserRole::INVENTORY_CLERK)->first();

        foreach ($shops as $index => $shop) {
            $this->attachUser($tenant, $owner, $shop);
            $this->attachUser($tenant, $generalManager, $shop);

            $manager = $storeManagers->get($index % $storeManagers->count());
            if ($manager) {
                $this->attachUser($tenant, $manager, $shop);
            }

            if ($index === 0 && $assistantManager) {
                $this->attachUser($tenant, $assistantManager, $shop);
            }

            $salesRep = $salesReps->get($index % $salesReps->count());
            if ($salesRep) {
                $this->attachUser($tenant, $salesRep, $shop);
            }

            $cashier = $cashiers->get($index % $cashiers->count());
            if ($cashier) {
                $this->attachUser($tenant, $cashier, $shop);
            }

            if ($inventoryClerk) {
                $this->attachUser($tenant, $inventoryClerk, $shop);
            }
        }
    }

    protected function attachUser($tenant, $user, $shop): void
    {
        if (! $user || ! $shop) {
            return;
        }

        DB::table('shop_user')->updateOrInsert(
            ['user_id' => $user->id, 'shop_id' => $shop->id],
            [
                'tenant_id' => $tenant->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
