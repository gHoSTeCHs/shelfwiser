<?php

namespace App\Services;

use App\Models\ApprovalChain;
use App\Models\ApprovalRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApprovalService
{
    /**
     * Create an approval request for an entity
     */
    public function createApprovalRequest(
        Model $approvable,
        Tenant $tenant,
        User $requestedBy,
        ?float $amount = null
    ): ?ApprovalRequest {
        $entityType = get_class($approvable);

        // Find the appropriate approval chain
        $chain = $this->findApplicableChain($tenant, $entityType, $amount);

        // If no chain found, no approval needed
        if (! $chain) {
            return null;
        }

        return DB::transaction(function () use ($approvable, $tenant, $requestedBy, $chain) {
            $approvalRequest = ApprovalRequest::create([
                'tenant_id' => $tenant->id,
                'approval_chain_id' => $chain->id,
                'approvable_type' => get_class($approvable),
                'approvable_id' => $approvable->id,
                'requested_by' => $requestedBy->id,
                'status' => 'pending',
                'current_step' => 0,
                'approval_history' => [],
            ]);

            Log::info('Approval request created', [
                'approval_request_id' => $approvalRequest->id,
                'approvable_type' => get_class($approvable),
                'approvable_id' => $approvable->id,
                'chain_id' => $chain->id,
            ]);

            return $approvalRequest;
        });
    }

    /**
     * Approve an approval request
     */
    public function approve(ApprovalRequest $request, User $approver, ?string $notes = null): ApprovalRequest
    {
        if (! $request->isPending()) {
            throw new \Exception('Only pending approval requests can be approved');
        }

        if (! $this->canUserApprove($request, $approver)) {
            throw new \Exception('You do not have permission to approve this request');
        }

        return DB::transaction(function () use ($request, $approver, $notes) {
            // Record the approval action
            $request->recordApprovalAction($approver, 'approved', $notes);

            // Move to next step
            $request->current_step++;

            // Check if all steps are completed
            $chain = $request->approvalChain;
            if ($request->current_step >= $chain->getStepCount()) {
                // All approvals complete
                $request->status = 'approved';
                $request->approved_by = $approver->id;
                $request->approved_at = now();

                Log::info('Approval request fully approved', [
                    'approval_request_id' => $request->id,
                    'approved_by' => $approver->id,
                ]);
            }

            $request->save();

            return $request->fresh();
        });
    }

    /**
     * Reject an approval request
     */
    public function reject(ApprovalRequest $request, User $rejector, string $reason): ApprovalRequest
    {
        if (! $request->isPending()) {
            throw new \Exception('Only pending approval requests can be rejected');
        }

        if (! $this->canUserApprove($request, $rejector)) {
            throw new \Exception('You do not have permission to reject this request');
        }

        return DB::transaction(function () use ($request, $rejector, $reason) {
            $request->recordApprovalAction($rejector, 'rejected', $reason);

            $request->status = 'rejected';
            $request->rejected_by = $rejector->id;
            $request->rejected_at = now();
            $request->rejection_reason = $reason;
            $request->save();

            Log::info('Approval request rejected', [
                'approval_request_id' => $request->id,
                'rejected_by' => $rejector->id,
                'reason' => $reason,
            ]);

            return $request->fresh();
        });
    }

    /**
     * Cancel an approval request
     */
    public function cancel(ApprovalRequest $request, User $user): ApprovalRequest
    {
        if (! $request->isPending()) {
            throw new \Exception('Only pending approval requests can be cancelled');
        }

        // Only the requester or a high-level admin can cancel
        if ($request->requested_by !== $user->id && $user->role->level() < 80) {
            throw new \Exception('You do not have permission to cancel this request');
        }

        $request->update(['status' => 'cancelled']);

        Log::info('Approval request cancelled', [
            'approval_request_id' => $request->id,
            'cancelled_by' => $user->id,
        ]);

        return $request->fresh();
    }

    /**
     * Check if a user can approve the current step
     */
    public function canUserApprove(ApprovalRequest $request, User $user): bool
    {
        $chain = $request->approvalChain;
        $requiredRoleLevel = $chain->getRequiredRoleLevel($request->current_step);

        if (! $requiredRoleLevel) {
            return false;
        }

        // User must have role level >= required level
        return $user->role->level() >= $requiredRoleLevel;
    }

    /**
     * Find the applicable approval chain for an entity
     */
    protected function findApplicableChain(
        Tenant $tenant,
        string $entityType,
        ?float $amount = null
    ): ?ApprovalChain {
        $query = ApprovalChain::forTenant($tenant->id)
            ->forEntityType($entityType)
            ->active()
            ->byPriority();

        $chains = $query->get();

        // Find the first chain that applies to this amount
        foreach ($chains as $chain) {
            if (is_null($amount) || $chain->appliesTo($amount)) {
                return $chain;
            }
        }

        return null;
    }

    /**
     * Get pending approval requests for a user
     */
    public function getPendingApprovalsForUser(User $user): \Illuminate\Support\Collection
    {
        $tenant = $user->tenant;

        return ApprovalRequest::forTenant($tenant->id)
            ->pending()
            ->with(['approvalChain', 'approvable', 'requestedBy'])
            ->get()
            ->filter(function ($request) use ($user) {
                return $this->canUserApprove($request, $user);
            });
    }

    /**
     * Get approval status for an entity
     */
    public function getApprovalStatus(Model $approvable): ?ApprovalRequest
    {
        return ApprovalRequest::where('approvable_type', get_class($approvable))
            ->where('approvable_id', $approvable->id)
            ->latest()
            ->first();
    }

    /**
     * Check if entity needs approval
     */
    public function needsApproval(Model $approvable, Tenant $tenant, ?float $amount = null): bool
    {
        $entityType = get_class($approvable);
        $chain = $this->findApplicableChain($tenant, $entityType, $amount);

        return $chain !== null;
    }
}
