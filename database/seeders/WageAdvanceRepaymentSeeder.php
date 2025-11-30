<?php

namespace Database\Seeders;

use App\Enums\WageAdvanceStatus;
use App\Models\User;
use App\Models\WageAdvance;
use App\Models\WageAdvanceRepayment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class WageAdvanceRepaymentSeeder extends Seeder
{
    /**
     * Seed wage advance repayments for disbursed and repaid advances
     */
    public function run(): void
    {
        $wageAdvances = WageAdvance::whereIn('status', [
            WageAdvanceStatus::REPAYING,
            WageAdvanceStatus::REPAID,
        ])->with('user')->get();

        foreach ($wageAdvances as $wageAdvance) {
            $this->createRepaymentsForAdvance($wageAdvance);
        }
    }

    /**
     * Create repayment records for a wage advance
     */
    protected function createRepaymentsForAdvance(WageAdvance $wageAdvance): void
    {
        $approvedAmount = (float) $wageAdvance->amount_approved;
        $amountRepaid = (float) $wageAdvance->amount_repaid;
        $installmentAmount = $wageAdvance->getInstallmentAmount();

        $approver = User::where('tenant_id', $wageAdvance->tenant_id)
            ->whereIn('role', ['store_manager', 'general_manager'])
            ->first();

        if (! $approver) {
            return;
        }

        $startDate = Carbon::parse($wageAdvance->repayment_start_date ?? $wageAdvance->disbursed_at);

        $totalPaid = 0;
        $paymentCount = 0;

        while ($totalPaid < $amountRepaid && $paymentCount < 12) {
            $repaymentDate = $startDate->copy()->addMonths($paymentCount);

            $remainingAmount = $amountRepaid - $totalPaid;
            $paymentAmount = min($installmentAmount, $remainingAmount);

            if ($paymentAmount <= 0) {
                break;
            }

            $paymentMethod = $this->getPaymentMethod($paymentCount);

            WageAdvanceRepayment::create([
                'wage_advance_id' => $wageAdvance->id,
                'tenant_id' => $wageAdvance->tenant_id,
                'payroll_period_id' => null,
                'amount' => $paymentAmount,
                'repayment_date' => $repaymentDate,
                'payment_method' => $paymentMethod,
                'reference_number' => $paymentMethod === 'deducted_from_salary'
                    ? null
                    : 'REF-' . strtoupper(uniqid()),
                'notes' => $this->getRepaymentNotes($paymentMethod, $paymentCount + 1),
                'recorded_by' => $approver->id,
                'created_at' => $repaymentDate,
                'updated_at' => $repaymentDate,
            ]);

            $totalPaid += $paymentAmount;
            $paymentCount++;
        }
    }

    /**
     * Determine payment method (mostly salary deduction)
     */
    protected function getPaymentMethod(int $paymentCount): string
    {
        if ($paymentCount === 0) {
            return rand(1, 4) === 1 ? 'cash' : 'deducted_from_salary';
        }

        return rand(1, 10) <= 8 ? 'deducted_from_salary' : 'bank_transfer';
    }

    /**
     * Generate appropriate notes for repayment
     */
    protected function getRepaymentNotes(string $paymentMethod, int $installmentNumber): string
    {
        return match ($paymentMethod) {
            'deducted_from_salary' => "Installment #{$installmentNumber} - Automatic deduction from monthly salary",
            'cash' => "Installment #{$installmentNumber} - Cash payment received",
            'bank_transfer' => "Installment #{$installmentNumber} - Bank transfer payment",
            default => "Installment #{$installmentNumber}",
        };
    }
}
