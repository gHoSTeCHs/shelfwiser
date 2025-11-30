<?php

namespace App\Services;

use App\Enums\WageAdvanceStatus;
use App\Models\PayrollPeriod;
use App\Models\User;
use App\Models\WageAdvance;
use App\Models\WageAdvanceRepayment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WageAdvanceRepaymentService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Record a repayment for a wage advance
     */
    public function recordRepayment(
        WageAdvance $wageAdvance,
        User $recordedBy,
        array $data
    ): WageAdvanceRepayment {
        if (! in_array($wageAdvance->status, [
            WageAdvanceStatus::DISBURSED,
            WageAdvanceStatus::REPAYING,
        ])) {
            throw new \RuntimeException('Wage advance must be disbursed to record repayment');
        }

        $amount = (float) $data['amount'];
        $remainingBalance = $wageAdvance->getRemainingBalance();

        if ($amount > $remainingBalance) {
            throw new \RuntimeException("Repayment amount ({$amount}) exceeds remaining balance ({$remainingBalance})");
        }

        if ($amount <= 0) {
            throw new \RuntimeException('Repayment amount must be greater than zero');
        }

        return DB::transaction(function () use ($wageAdvance, $recordedBy, $data, $amount) {
            $repayment = WageAdvanceRepayment::create([
                'wage_advance_id' => $wageAdvance->id,
                'tenant_id' => $wageAdvance->tenant_id,
                'payroll_period_id' => $data['payroll_period_id'] ?? null,
                'amount' => $amount,
                'repayment_date' => $data['repayment_date'] ?? now(),
                'payment_method' => $data['payment_method'] ?? 'deducted_from_salary',
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $recordedBy->id,
            ]);

            $newAmountRepaid = (float) $wageAdvance->amount_repaid + $amount;
            $approvedAmount = (float) $wageAdvance->amount_approved;

            if ($newAmountRepaid >= $approvedAmount) {
                $wageAdvance->update([
                    'amount_repaid' => $approvedAmount,
                    'status' => WageAdvanceStatus::REPAID,
                    'fully_repaid_at' => now(),
                ]);
            } else {
                $wageAdvance->update([
                    'amount_repaid' => $newAmountRepaid,
                    'status' => WageAdvanceStatus::REPAYING,
                ]);
            }

            $this->clearCache($wageAdvance->tenant_id);

            Log::info('Wage advance repayment recorded', [
                'wage_advance_id' => $wageAdvance->id,
                'repayment_id' => $repayment->id,
                'amount' => $amount,
                'remaining_balance' => $wageAdvance->fresh()->getRemainingBalance(),
            ]);

            if ($wageAdvance->status === WageAdvanceStatus::REPAID) {
                $this->notificationService->notifyWageAdvanceFullyRepaid($wageAdvance->fresh(['user', 'shop']));
            }

            return $repayment->fresh(['wageAdvance', 'recordedBy', 'payrollPeriod']);
        });
    }

    /**
     * Delete a repayment record
     */
    public function deleteRepayment(WageAdvanceRepayment $repayment, User $deletedBy): void
    {
        $wageAdvance = $repayment->wageAdvance;

        if ($wageAdvance->status === WageAdvanceStatus::REPAID) {
            throw new \RuntimeException('Cannot delete repayments for fully repaid advances. Contact administrator.');
        }

        DB::transaction(function () use ($repayment, $wageAdvance) {
            $amount = (float) $repayment->amount;
            $newAmountRepaid = max(0, (float) $wageAdvance->amount_repaid - $amount);

            $wageAdvance->update([
                'amount_repaid' => $newAmountRepaid,
                'status' => $newAmountRepaid > 0 ? WageAdvanceStatus::REPAYING : WageAdvanceStatus::DISBURSED,
                'fully_repaid_at' => null,
            ]);

            $repayment->delete();

            $this->clearCache($wageAdvance->tenant_id);

            Log::info('Wage advance repayment deleted', [
                'wage_advance_id' => $wageAdvance->id,
                'repayment_id' => $repayment->id,
                'amount' => $amount,
            ]);
        });
    }

    /**
     * Get repayments for a wage advance
     */
    public function getRepayments(WageAdvance $wageAdvance): Collection
    {
        return $wageAdvance->repayments()
            ->with(['recordedBy:id,name,email', 'payrollPeriod:id,period_name,payment_date'])
            ->orderBy('repayment_date', 'desc')
            ->get();
    }

    /**
     * Calculate suggested repayment schedule
     */
    public function calculateRepaymentSchedule(WageAdvance $wageAdvance): array
    {
        $approvedAmount = (float) ($wageAdvance->amount_approved ?? $wageAdvance->amount_requested);
        $installments = $wageAdvance->repayment_installments;

        if ($installments <= 0) {
            return [];
        }

        $installmentAmount = $approvedAmount / $installments;
        $startDate = $wageAdvance->repayment_start_date
            ? new \DateTime($wageAdvance->repayment_start_date)
            : new \DateTime($wageAdvance->disbursed_at ?? 'now');

        $schedule = [];
        for ($i = 1; $i <= $installments; $i++) {
            $dueDate = clone $startDate;
            $dueDate->modify("+{$i} month");

            $schedule[] = [
                'installment_number' => $i,
                'amount' => $installmentAmount,
                'due_date' => $dueDate->format('Y-m-d'),
            ];
        }

        return $schedule;
    }

    /**
     * Process automatic deduction during payroll
     */
    public function processPayrollDeduction(
        WageAdvance $wageAdvance,
        PayrollPeriod $payrollPeriod,
        float $grossPay
    ): ?WageAdvanceRepayment {
        if (! in_array($wageAdvance->status, [
            WageAdvanceStatus::DISBURSED,
            WageAdvanceStatus::REPAYING,
        ])) {
            return null;
        }

        $remainingBalance = $wageAdvance->getRemainingBalance();
        if ($remainingBalance <= 0) {
            return null;
        }

        $installmentAmount = $wageAdvance->getInstallmentAmount();
        $deductionAmount = min($installmentAmount, $remainingBalance, $grossPay * 0.5);

        if ($deductionAmount <= 0) {
            return null;
        }

        return $this->recordRepayment(
            $wageAdvance,
            $payrollPeriod->processedBy ?? auth()->user(),
            [
                'amount' => $deductionAmount,
                'payroll_period_id' => $payrollPeriod->id,
                'repayment_date' => $payrollPeriod->payment_date,
                'payment_method' => 'deducted_from_salary',
                'notes' => "Automatic deduction from payroll period: {$payrollPeriod->period_name}",
            ]
        );
    }

    /**
     * Get repayment statistics
     */
    public function getRepaymentStatistics(WageAdvance $wageAdvance): array
    {
        $approvedAmount = (float) ($wageAdvance->amount_approved ?? $wageAdvance->amount_requested);
        $amountRepaid = (float) $wageAdvance->amount_repaid;
        $remainingBalance = $wageAdvance->getRemainingBalance();

        $repayments = $this->getRepayments($wageAdvance);
        $totalRepayments = $repayments->count();

        $percentageRepaid = $approvedAmount > 0 ? ($amountRepaid / $approvedAmount) * 100 : 0;

        $lastRepayment = $repayments->first();
        $averageRepaymentAmount = $totalRepayments > 0
            ? $repayments->avg('amount')
            : 0;

        return [
            'approved_amount' => $approvedAmount,
            'amount_repaid' => $amountRepaid,
            'remaining_balance' => $remainingBalance,
            'percentage_repaid' => round($percentageRepaid, 2),
            'total_repayments' => $totalRepayments,
            'last_repayment_date' => $lastRepayment?->repayment_date,
            'last_repayment_amount' => $lastRepayment?->amount,
            'average_repayment_amount' => round($averageRepaymentAmount, 2),
            'expected_installments' => $wageAdvance->repayment_installments,
            'installment_amount' => $wageAdvance->getInstallmentAmount(),
        ];
    }

    /**
     * Clear cache for tenant
     */
    private function clearCache(int $tenantId): void
    {
        Cache::tags(["tenant:{$tenantId}:wage-advances"])->flush();
    }
}
