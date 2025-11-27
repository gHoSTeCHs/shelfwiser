<?php

namespace App\Services;

use App\Enums\ConnectionStatus;
use App\Models\SupplierConnection;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SupplierConnectionService
{
    public function requestConnection(Tenant $buyerTenant, Tenant $supplierTenant, array $data): SupplierConnection
    {
        return DB::transaction(function () use ($buyerTenant, $supplierTenant, $data) {
            $supplierProfile = $supplierTenant->supplierProfile;

            if (! $supplierProfile || ! $supplierProfile->is_enabled) {
                throw new \Exception('Supplier mode not enabled for this tenant');
            }

            $connection = SupplierConnection::create([
                'supplier_tenant_id' => $supplierTenant->id,
                'buyer_tenant_id' => $buyerTenant->id,
                'status' => ConnectionStatus::PENDING,
                'buyer_notes' => $data['buyer_notes'] ?? null,
                'requested_at' => now(),
            ]);

            if ($supplierProfile->canAutoApproveConnections()) {
                $this->approveConnection($connection, null);
            }

            Log::info('Supplier connection requested', [
                'connection_id' => $connection->id,
                'buyer_tenant_id' => $buyerTenant->id,
                'supplier_tenant_id' => $supplierTenant->id,
                'auto_approved' => $supplierProfile->canAutoApproveConnections(),
            ]);

            return $connection->fresh();
        });
    }

    public function approveConnection(SupplierConnection $connection, ?User $approver): SupplierConnection
    {
        return DB::transaction(function () use ($connection, $approver) {
            if ($approver) {
                $supplierProfile = $connection->supplierTenant->supplierProfile;

                if (! $supplierProfile->canUserApproveConnection($approver)) {
                    throw new \Exception('User does not have permission to approve connections');
                }
            }

            $connection->approve($approver?->id);

            Log::info('Supplier connection approved', [
                'connection_id' => $connection->id,
                'approved_by' => $approver?->id,
            ]);

            return $connection->fresh();
        });
    }

    public function rejectConnection(SupplierConnection $connection): SupplierConnection
    {
        return DB::transaction(function () use ($connection) {
            $connection->reject();

            Log::info('Supplier connection rejected', [
                'connection_id' => $connection->id,
            ]);

            return $connection->fresh();
        });
    }

    public function suspendConnection(SupplierConnection $connection, ?string $reason = null): SupplierConnection
    {
        return DB::transaction(function () use ($connection, $reason) {
            $connection->suspend();

            if ($reason) {
                $connection->update(['supplier_notes' => $reason]);
            }

            Log::info('Supplier connection suspended', [
                'connection_id' => $connection->id,
                'reason' => $reason,
            ]);

            return $connection->fresh();
        });
    }

    public function activateConnection(SupplierConnection $connection): SupplierConnection
    {
        return DB::transaction(function () use ($connection) {
            $connection->activate();

            Log::info('Supplier connection activated', [
                'connection_id' => $connection->id,
            ]);

            return $connection->fresh();
        });
    }

    public function updateConnectionTerms(SupplierConnection $connection, array $data): SupplierConnection
    {
        return DB::transaction(function () use ($connection, $data) {
            $connection->update([
                'credit_limit' => $data['credit_limit'] ?? $connection->credit_limit,
                'payment_terms_override' => $data['payment_terms_override'] ?? $connection->payment_terms_override,
                'supplier_notes' => $data['supplier_notes'] ?? $connection->supplier_notes,
            ]);

            Log::info('Supplier connection terms updated', [
                'connection_id' => $connection->id,
            ]);

            return $connection->fresh();
        });
    }

    public function getConnectionsForSupplier(Tenant $supplierTenant, ?ConnectionStatus $status = null): Collection
    {
        $query = SupplierConnection::forSupplier($supplierTenant->id)
            ->with(['buyerTenant', 'approvedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('requested_at', 'desc')->get();
    }

    public function getConnectionsForBuyer(Tenant $buyerTenant, ?ConnectionStatus $status = null): Collection
    {
        $query = SupplierConnection::forBuyer($buyerTenant->id)
            ->with(['supplierTenant.supplierProfile', 'approvedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('requested_at', 'desc')->get();
    }

    public function getConnection(Tenant $buyerTenant, Tenant $supplierTenant): ?SupplierConnection
    {
        return SupplierConnection::where('buyer_tenant_id', $buyerTenant->id)
            ->where('supplier_tenant_id', $supplierTenant->id)
            ->first();
    }

    public function canOrder(Tenant $buyerTenant, Tenant $supplierTenant): bool
    {
        $connection = $this->getConnection($buyerTenant, $supplierTenant);

        return $connection && $connection->status->canOrder();
    }
}
