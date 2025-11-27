<?php

namespace Database\Seeders;

use App\Enums\ConnectionApprovalMode;
use App\Models\SupplierProfile;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class SupplierProfileSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        // Enable supplier mode for first 2 tenants (leaving one as buyer-only)
        $suppliersConfig = [
            [
                'tenant_slug' => 'sunshine-retail',
                'business_registration' => 'RC-123456',
                'tax_id' => 'TIN-987654321',
                'payment_terms' => 'Net 30',
                'lead_time_days' => 5,
                'minimum_order_value' => 50000.00,
                'connection_approval_mode' => ConnectionApprovalMode::AUTO,
            ],
            [
                'tenant_slug' => 'fresh-mart',
                'business_registration' => 'RC-789012',
                'tax_id' => 'TIN-456789123',
                'payment_terms' => 'Net 15',
                'lead_time_days' => 3,
                'minimum_order_value' => 25000.00,
                'connection_approval_mode' => ConnectionApprovalMode::GENERAL_MANAGER,
            ],
        ];

        foreach ($suppliersConfig as $config) {
            $tenant = $tenants->firstWhere('slug', $config['tenant_slug']);

            if (! $tenant) {
                continue;
            }

            SupplierProfile::create([
                'tenant_id' => $tenant->id,
                'is_enabled' => true,
                'business_registration' => $config['business_registration'],
                'tax_id' => $config['tax_id'],
                'payment_terms' => $config['payment_terms'],
                'lead_time_days' => $config['lead_time_days'],
                'minimum_order_value' => $config['minimum_order_value'],
                'connection_approval_mode' => $config['connection_approval_mode'],
                'settings' => [
                    'allow_backorders' => true,
                    'require_po_number' => false,
                    'auto_send_invoice' => true,
                ],
            ]);
        }
    }
}
