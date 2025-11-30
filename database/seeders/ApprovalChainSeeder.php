<?php

namespace Database\Seeders;

use App\Models\ApprovalChain;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ApprovalChainSeeder extends Seeder
{
    /**
     * Seed approval chains for various entity types and amounts
     */
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->createApprovalChainsForTenant($tenant);
        }
    }

    /**
     * Create approval chains for a tenant
     */
    protected function createApprovalChainsForTenant(Tenant $tenant): void
    {
        $approvalChains = [
            // Purchase Order Approval Chains
            [
                'name' => 'PO - Small Amount (Under ₦100,000)',
                'entity_type' => 'App\\Models\\PurchaseOrder',
                'minimum_amount' => 0,
                'maximum_amount' => 100000,
                'approval_steps' => [
                    ['role_level' => 60], // Store Manager
                ],
                'priority' => 10,
                'description' => 'Single approval for purchase orders under ₦100,000',
            ],
            [
                'name' => 'PO - Medium Amount (₦100,001 - ₦500,000)',
                'entity_type' => 'App\\Models\\PurchaseOrder',
                'minimum_amount' => 100001,
                'maximum_amount' => 500000,
                'approval_steps' => [
                    ['role_level' => 60], // Store Manager
                    ['role_level' => 80], // General Manager
                ],
                'priority' => 20,
                'description' => 'Two-level approval for purchase orders between ₦100,001 and ₦500,000',
            ],
            [
                'name' => 'PO - Large Amount (Over ₦500,000)',
                'entity_type' => 'App\\Models\\PurchaseOrder',
                'minimum_amount' => 500001,
                'maximum_amount' => null,
                'approval_steps' => [
                    ['role_level' => 60], // Store Manager
                    ['role_level' => 80], // General Manager
                    ['role_level' => 100], // Owner
                ],
                'priority' => 30,
                'description' => 'Three-level approval for purchase orders over ₦500,000',
            ],

            // Wage Advance Approval Chains
            [
                'name' => 'Wage Advance - Small Amount (Under ₦30,000)',
                'entity_type' => 'App\\Models\\WageAdvance',
                'minimum_amount' => 0,
                'maximum_amount' => 30000,
                'approval_steps' => [
                    ['role_level' => 60], // Store Manager
                ],
                'priority' => 10,
                'description' => 'Single approval for wage advances under ₦30,000',
            ],
            [
                'name' => 'Wage Advance - Large Amount (Over ₦30,000)',
                'entity_type' => 'App\\Models\\WageAdvance',
                'minimum_amount' => 30001,
                'maximum_amount' => null,
                'approval_steps' => [
                    ['role_level' => 60], // Store Manager
                    ['role_level' => 80], // General Manager
                ],
                'priority' => 20,
                'description' => 'Two-level approval for wage advances over ₦30,000',
            ],
        ];

        foreach ($approvalChains as $chainData) {
            ApprovalChain::create(array_merge($chainData, [
                'tenant_id' => $tenant->id,
                'is_active' => true,
            ]));
        }
    }
}
