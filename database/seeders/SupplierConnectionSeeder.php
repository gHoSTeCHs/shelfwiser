<?php

namespace Database\Seeders;

use App\Enums\ConnectionStatus;
use App\Enums\UserRole;
use App\Models\SupplierConnection;
use App\Models\SupplierPricingTier;
use App\Models\SupplierProfile;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class SupplierConnectionSeeder extends Seeder
{
    public function run(): void
    {
        $supplierProfiles = SupplierProfile::with('tenant')->get();
        $allTenants = Tenant::all();

        foreach ($supplierProfiles as $supplierProfile) {
            $this->createConnectionsForSupplier($supplierProfile, $allTenants);
        }
    }

    protected function createConnectionsForSupplier(SupplierProfile $supplierProfile, $allTenants): void
    {

        $potentialBuyers = $allTenants->filter(function ($tenant) use ($supplierProfile) {
            return $tenant->id !== $supplierProfile->tenant_id;
        });

        foreach ($potentialBuyers as $buyerTenant) {

            if ($this->shouldCreateConnection()) {
                $this->createConnection($supplierProfile, $buyerTenant);
            }
        }
    }

    protected function createConnection(SupplierProfile $supplierProfile, Tenant $buyerTenant): void
    {
        $status = $this->getRandomStatus($supplierProfile);
        $requestedAt = now()->subDays(rand(5, 90));

        $approvedBy = null;
        $approvedAt = null;

        if (in_array($status, [ConnectionStatus::APPROVED, ConnectionStatus::ACTIVE, ConnectionStatus::SUSPENDED])) {
            $approvedBy = $this->getApproverUser($supplierProfile->tenant_id);
            $approvedAt = $requestedAt->copy()->addHours(rand(2, 48));
        }

        $connection = SupplierConnection::create([
            'supplier_tenant_id' => $supplierProfile->tenant_id,
            'buyer_tenant_id' => $buyerTenant->id,
            'status' => $status,
            'credit_limit' => $this->determineCreditLimit($status),
            'payment_terms_override' => $this->getPaymentTermsOverride(),
            'buyer_notes' => $this->getBuyerNotes(),
            'supplier_notes' => $this->getSupplierNotes($status),
            'requested_at' => $requestedAt,
            'approved_at' => $approvedAt,
            'approved_by' => $approvedBy?->id,
        ]);

        // For active connections, occasionally add connection-specific pricing
        if ($status === ConnectionStatus::ACTIVE && rand(1, 100) <= 30) {
            $this->createConnectionSpecificPricing($connection, $supplierProfile);
        }
    }

    protected function shouldCreateConnection(): bool
    {
        // 80% chance of creating a connection between any supplier-buyer pair
        return rand(1, 100) <= 80;
    }

    protected function getRandomStatus(SupplierProfile $supplierProfile): ConnectionStatus
    {
        // If supplier has auto-approval, higher chance of approved/active connections
        if ($supplierProfile->canAutoApproveConnections()) {
            $weights = [
                ConnectionStatus::PENDING->value => 5,
                ConnectionStatus::APPROVED->value => 20,
                ConnectionStatus::ACTIVE->value => 65,
                ConnectionStatus::SUSPENDED->value => 5,
                ConnectionStatus::REJECTED->value => 5,
            ];
        } else {
            $weights = [
                ConnectionStatus::PENDING->value => 25,
                ConnectionStatus::APPROVED->value => 15,
                ConnectionStatus::ACTIVE->value => 45,
                ConnectionStatus::SUSPENDED->value => 10,
                ConnectionStatus::REJECTED->value => 5,
            ];
        }

        $rand = rand(1, 100);
        $cumulative = 0;

        foreach ($weights as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return ConnectionStatus::from($status);
            }
        }

        return ConnectionStatus::ACTIVE;
    }

    protected function getApproverUser(int $tenantId): ?User
    {
        return User::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->whereIn('role', [
                UserRole::OWNER->value,
                UserRole::GENERAL_MANAGER->value,
                UserRole::ASSISTANT_MANAGER->value,
            ])
            ->inRandomOrder()
            ->first();
    }

    protected function determineCreditLimit(?ConnectionStatus $status): ?float
    {
        // Only active connections typically have credit limits
        if ($status !== ConnectionStatus::ACTIVE) {
            return null;
        }

        // 60% of active connections have credit limits
        if (rand(1, 100) > 60) {
            return null;
        }

        $limits = [500000, 1000000, 2000000, 5000000, 10000000];

        return $limits[array_rand($limits)];
    }

    protected function getPaymentTermsOverride(): ?string
    {
        // 20% chance of custom payment terms
        if (rand(1, 100) > 20) {
            return null;
        }

        $terms = ['Net 7', 'Net 10', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Prepaid'];

        return $terms[array_rand($terms)];
    }

    protected function getBuyerNotes(): ?string
    {
        $notes = [
            'Preferred supplier for electronics.',
            'Good delivery track record.',
            'Competitive pricing, reliable service.',
            'Contact for bulk orders.',
            'Negotiated special rates.',
            null,
            null, // More likely to have no notes
        ];

        return $notes[array_rand($notes)];
    }

    protected function getSupplierNotes(?ConnectionStatus $status): ?string
    {
        if ($status === ConnectionStatus::REJECTED) {
            $notes = [
                'Failed credit check.',
                'Incomplete business documentation.',
                'Outside delivery zone.',
            ];

            return $notes[array_rand($notes)];
        }

        if ($status === ConnectionStatus::SUSPENDED) {
            $notes = [
                'Payment overdue - suspended pending resolution.',
                'Multiple late payments - temporarily suspended.',
                'Under review for reactivation.',
            ];

            return $notes[array_rand($notes)];
        }

        $notes = [
            'Approved buyer with good credit history.',
            'Regular customer - priority shipping.',
            'Volume buyer - special pricing applied.',
            null,
            null,
            null, // More likely to have no notes
        ];

        return $notes[array_rand($notes)];
    }

    protected function createConnectionSpecificPricing(SupplierConnection $connection, SupplierProfile $supplierProfile): void
    {
        // Get a few random catalog items from this supplier
        $catalogItems = $supplierProfile->catalogItems()
            ->with('pricingTiers')
            ->inRandomOrder()
            ->limit(rand(3, 8))
            ->get();

        foreach ($catalogItems as $catalogItem) {
            // Get the base tier pricing
            $baseTier = $catalogItem->pricingTiers()->whereNull('connection_id')->first();

            if (! $baseTier) {
                continue;
            }

            // Create a special price for this connection (5-15% better than base)
            $discountPercent = rand(5, 15) / 100;
            $specialPrice = round($baseTier->price * (1 - $discountPercent), 2);

            SupplierPricingTier::create([
                'catalog_item_id' => $catalogItem->id,
                'connection_id' => $connection->id,
                'min_quantity' => $baseTier->min_quantity,
                'max_quantity' => $baseTier->max_quantity,
                'price' => $specialPrice,
            ]);
        }
    }
}
