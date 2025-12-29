<?php

namespace App\Services;

use App\Models\PayrollAuditLog;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\Payslip;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class PayrollAuditService
{
    public function logPayRunCreated(PayRun $payRun, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_CREATED,
            $actor,
            null,
            [
                'name' => $payRun->name,
                'status' => $payRun->status,
                'employee_count' => $payRun->employee_count,
                'payroll_period_id' => $payRun->payroll_period_id,
            ],
            ['period_name' => $payRun->payrollPeriod?->period_name]
        );
    }

    public function logPayRunCalculated(PayRun $payRun, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_CALCULATED,
            $actor,
            null,
            [
                'status' => $payRun->status,
                'total_gross' => $payRun->total_gross,
                'total_deductions' => $payRun->total_deductions,
                'total_net' => $payRun->total_net,
                'total_employer_costs' => $payRun->total_employer_costs,
            ],
            [
                'calculated_items' => $payRun->items()->calculated()->count(),
                'error_items' => $payRun->items()->withErrors()->count(),
            ]
        );
    }

    public function logPayRunSubmitted(PayRun $payRun, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_SUBMITTED,
            $actor,
            ['status' => PayRun::STATUS_PENDING_REVIEW],
            ['status' => PayRun::STATUS_PENDING_APPROVAL]
        );
    }

    public function logPayRunApproved(PayRun $payRun, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_APPROVED,
            $actor,
            ['status' => PayRun::STATUS_PENDING_APPROVAL],
            [
                'status' => PayRun::STATUS_APPROVED,
                'approved_at' => $payRun->approved_at?->toIso8601String(),
            ]
        );
    }

    public function logPayRunRejected(PayRun $payRun, ?User $actor = null, ?string $reason = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_REJECTED,
            $actor,
            ['status' => PayRun::STATUS_PENDING_APPROVAL],
            ['status' => PayRun::STATUS_PENDING_REVIEW],
            ['reason' => $reason]
        );
    }

    public function logPayRunCompleted(PayRun $payRun, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_COMPLETED,
            $actor,
            ['status' => PayRun::STATUS_APPROVED],
            [
                'status' => PayRun::STATUS_COMPLETED,
                'completed_at' => $payRun->completed_at?->toIso8601String(),
            ],
            [
                'payslips_generated' => $payRun->items()->whereNotNull('payslip_id')->count(),
                'total_net_paid' => $payRun->total_net,
            ]
        );
    }

    public function logPayRunCancelled(PayRun $payRun, ?User $actor = null, ?string $reason = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_PAY_RUN_CANCELLED,
            $actor,
            ['status' => $payRun->getOriginal('status')],
            ['status' => PayRun::STATUS_CANCELLED],
            ['reason' => $reason]
        );
    }

    public function logEmployeeExcluded(PayRun $payRun, User $employee, ?User $actor = null, ?string $reason = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_EMPLOYEE_EXCLUDED,
            $actor,
            null,
            null,
            [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'reason' => $reason,
            ]
        );
    }

    public function logEmployeeIncluded(PayRun $payRun, User $employee, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payRun,
            PayrollAuditLog::ACTION_EMPLOYEE_INCLUDED,
            $actor,
            null,
            null,
            [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
            ]
        );
    }

    public function logItemRecalculated(PayRunItem $item, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $item->payRun,
            PayrollAuditLog::ACTION_ITEM_RECALCULATED,
            $actor,
            null,
            [
                'gross_earnings' => $item->gross_earnings,
                'total_deductions' => $item->total_deductions,
                'net_pay' => $item->net_pay,
            ],
            [
                'employee_id' => $item->user_id,
                'employee_name' => $item->user?->name,
            ]
        );
    }

    public function logPayslipGenerated(Payslip $payslip, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payslip,
            PayrollAuditLog::ACTION_PAYSLIP_GENERATED,
            $actor,
            null,
            [
                'net_pay' => $payslip->net_pay,
                'status' => $payslip->status,
            ],
            [
                'employee_id' => $payslip->user_id,
                'employee_name' => $payslip->user?->name,
                'pay_run_id' => $payslip->pay_run_id,
            ]
        );
    }

    public function logPayslipCancelled(Payslip $payslip, ?User $actor = null, ?string $reason = null): PayrollAuditLog
    {
        return $this->createLog(
            $payslip,
            PayrollAuditLog::ACTION_PAYSLIP_CANCELLED,
            $actor,
            ['status' => $payslip->getOriginal('status')],
            ['status' => 'cancelled'],
            [
                'reason' => $reason,
                'employee_id' => $payslip->user_id,
            ]
        );
    }

    public function logSettingChanged(Model $model, string $field, $oldValue, $newValue, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $model,
            PayrollAuditLog::ACTION_SETTING_CHANGED,
            $actor,
            [$field => $oldValue],
            [$field => $newValue],
            ['field' => $field]
        );
    }

    public function logEarningTypeCreated(Model $earningType, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $earningType,
            PayrollAuditLog::ACTION_EARNING_TYPE_CREATED,
            $actor,
            null,
            [
                'name' => $earningType->name,
                'code' => $earningType->code,
                'category' => $earningType->category,
            ]
        );
    }

    public function logEarningTypeUpdated(Model $earningType, array $oldValues, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $earningType,
            PayrollAuditLog::ACTION_EARNING_TYPE_UPDATED,
            $actor,
            $oldValues,
            $earningType->only(array_keys($oldValues))
        );
    }

    public function logEarningTypeDeleted(Model $earningType, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $earningType,
            PayrollAuditLog::ACTION_EARNING_TYPE_DELETED,
            $actor,
            [
                'name' => $earningType->name,
                'code' => $earningType->code,
            ],
            null
        );
    }

    public function logDeductionTypeCreated(Model $deductionType, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $deductionType,
            PayrollAuditLog::ACTION_DEDUCTION_TYPE_CREATED,
            $actor,
            null,
            [
                'name' => $deductionType->name,
                'code' => $deductionType->code,
                'category' => $deductionType->category,
            ]
        );
    }

    public function logDeductionTypeUpdated(Model $deductionType, array $oldValues, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $deductionType,
            PayrollAuditLog::ACTION_DEDUCTION_TYPE_UPDATED,
            $actor,
            $oldValues,
            $deductionType->only(array_keys($oldValues))
        );
    }

    public function logDeductionTypeDeleted(Model $deductionType, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $deductionType,
            PayrollAuditLog::ACTION_DEDUCTION_TYPE_DELETED,
            $actor,
            [
                'name' => $deductionType->name,
                'code' => $deductionType->code,
            ],
            null
        );
    }

    public function logPayCalendarCreated(Model $payCalendar, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payCalendar,
            PayrollAuditLog::ACTION_PAY_CALENDAR_CREATED,
            $actor,
            null,
            [
                'name' => $payCalendar->name,
                'frequency' => $payCalendar->frequency,
            ]
        );
    }

    public function logPayCalendarUpdated(Model $payCalendar, array $oldValues, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payCalendar,
            PayrollAuditLog::ACTION_PAY_CALENDAR_UPDATED,
            $actor,
            $oldValues,
            $payCalendar->only(array_keys($oldValues))
        );
    }

    public function logPayCalendarDeleted(Model $payCalendar, ?User $actor = null): PayrollAuditLog
    {
        return $this->createLog(
            $payCalendar,
            PayrollAuditLog::ACTION_PAY_CALENDAR_DELETED,
            $actor,
            [
                'name' => $payCalendar->name,
                'frequency' => $payCalendar->frequency,
            ],
            null
        );
    }

    protected function createLog(
        Model $auditable,
        string $action,
        ?User $actor = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null
    ): PayrollAuditLog {
        $tenantId = $auditable->tenant_id ?? $actor?->tenant_id;

        return PayrollAuditLog::create([
            'tenant_id' => $tenantId,
            'auditable_type' => get_class($auditable),
            'auditable_id' => $auditable->id,
            'action' => $action,
            'actor_id' => $actor?->id ?? auth()->id(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
            'ip_address' => Request::ip(),
        ]);
    }

    public function getAuditTrail(Model $auditable, int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return PayrollAuditLog::forAuditable(get_class($auditable), $auditable->id)
            ->with('actor:id,name')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function getTenantAuditLog(int $tenantId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = PayrollAuditLog::forTenant($tenantId)
            ->with('actor:id,name')
            ->orderByDesc('created_at');

        if (!empty($filters['action'])) {
            $query->forAction($filters['action']);
        }

        if (!empty($filters['actor_id'])) {
            $query->byActor($filters['actor_id']);
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->inDateRange($filters['start_date'], $filters['end_date']);
        }

        if (!empty($filters['auditable_type'])) {
            $query->where('auditable_type', $filters['auditable_type']);
        }

        return $query->paginate($filters['per_page'] ?? 25);
    }
}
