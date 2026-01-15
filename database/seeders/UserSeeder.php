<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        /**
         * Create Super Admin user (not tied to any tenant)
         * This user has platform-wide access for administration
         */
        User::updateOrCreate(
            ['email' => 'superadmin@shelfwiser.com'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => UserRole::SUPER_ADMIN,
                'is_super_admin' => true,
                'is_tenant_owner' => false,
                'is_active' => true,
                'tenant_id' => null,
            ]
        );

        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $users = $this->getUsersForTenant($tenant);

            foreach ($users as $userData) {
                User::updateOrCreate(
                    ['email' => $userData['email']],
                    array_merge($userData, [
                        'tenant_id' => $tenant->id,
                        'password' => Hash::make('password'),
                    ])
                );
            }
        }
    }

    protected function getUsersForTenant(Tenant $tenant): array
    {
        $slug = $tenant->slug;

        return [
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => "owner@{$slug}.com",
                'role' => UserRole::OWNER,
                'is_tenant_owner' => true,
                'is_active' => true,
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'email' => "gm@{$slug}.com",
                'role' => UserRole::GENERAL_MANAGER,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'Michael',
                'last_name' => 'Williams',
                'email' => "manager1@{$slug}.com",
                'role' => UserRole::STORE_MANAGER,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'Emily',
                'last_name' => 'Brown',
                'email' => "manager2@{$slug}.com",
                'role' => UserRole::STORE_MANAGER,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'David',
                'last_name' => 'Jones',
                'email' => "assistant@{$slug}.com",
                'role' => UserRole::ASSISTANT_MANAGER,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'Jessica',
                'last_name' => 'Garcia',
                'email' => "sales1@{$slug}.com",
                'role' => UserRole::SALES_REP,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'James',
                'last_name' => 'Martinez',
                'email' => "sales2@{$slug}.com",
                'role' => UserRole::SALES_REP,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'Lisa',
                'last_name' => 'Davis',
                'email' => "cashier1@{$slug}.com",
                'role' => UserRole::CASHIER,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'Robert',
                'last_name' => 'Rodriguez',
                'email' => "cashier2@{$slug}.com",
                'role' => UserRole::CASHIER,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
            [
                'first_name' => 'Maria',
                'last_name' => 'Wilson',
                'email' => "inventory@{$slug}.com",
                'role' => UserRole::INVENTORY_CLERK,
                'is_tenant_owner' => false,
                'is_active' => true,
            ],
        ];
    }
}
