<?php

namespace App\Services;

use App\Enums\DeductionCalculationBase;
use App\Enums\DeductionCategory;
use App\Models\DeductionTypeModel;
use App\Models\EmployeeDeduction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DeductionsService
{
    public function getActiveDeductions(User $employee, ?Carbon $asOfDate = null): Collection
    {
        $date = $asOfDate ?? now();

        return $employee->employeeDeductions()
            ->with('deductionType')
            ->activeOn($date)
            ->whereHas('deductionType', fn ($q) => $q->active())
            ->get()
            ->sortBy(fn ($d) => $d->deductionType->priority);
    }

    public function calculateEmployeeDeductions(
        User $employee,
        Carbon $periodStart,
        Carbon $periodEnd,
        array $earningsData
    ): array {
        $deductions = $this->getActiveDeductions($employee, $periodEnd);

        $baseAmounts = [
            'gross' => $earningsData['total_gross'] ?? 0,
            'basic' => $earningsData['basic_salary'] ?? $earningsData['total_gross'] ?? 0,
            'taxable' => $earningsData['total_taxable'] ?? 0,
            'pensionable' => $earningsData['total_pensionable'] ?? 0,
            'net' => 0,
        ];

        $breakdown = [];
        $totalDeductions = 0;
        $totalPreTax = 0;
        $totalPostTax = 0;
        $statutoryTotal = 0;
        $voluntaryTotal = 0;

        $preTaxDeductions = $deductions->filter(fn ($d) => $d->deductionType->is_pre_tax);
        $postTaxDeductions = $deductions->filter(fn ($d) => ! $d->deductionType->is_pre_tax);

        foreach ($preTaxDeductions as $deduction) {
            $type = $deduction->deductionType;
            $amount = $deduction->calculateAmount($baseAmounts);

            if ($amount < 0) {
                \Log::warning('Negative deduction amount calculated, skipping', [
                    'deduction_type' => $type->code,
                    'amount' => $amount,
                    'employee_id' => $employee->id,
                ]);

                continue;
            }

            $breakdown[] = [
                'type' => $type->name,
                'code' => $type->code,
                'category' => $type->category->value,
                'amount' => $amount,
                'is_pre_tax' => true,
                'is_statutory' => $type->isStatutory(),
            ];

            $totalDeductions += $amount;
            $totalPreTax += $amount;

            if ($type->isStatutory()) {
                $statutoryTotal += $amount;
            } else {
                $voluntaryTotal += $amount;
            }
        }

        $adjustedTaxable = $baseAmounts['taxable'] - $totalPreTax;
        $postTaxAmounts = array_merge($baseAmounts, ['taxable' => $adjustedTaxable]);

        foreach ($postTaxDeductions as $deduction) {
            $type = $deduction->deductionType;
            $amount = $deduction->calculateAmount($postTaxAmounts);

            if ($amount < 0) {
                \Log::warning('Negative deduction amount calculated, skipping', [
                    'deduction_type' => $type->code,
                    'amount' => $amount,
                    'employee_id' => $employee->id,
                ]);

                continue;
            }

            $breakdown[] = [
                'type' => $type->name,
                'code' => $type->code,
                'category' => $type->category->value,
                'amount' => $amount,
                'is_pre_tax' => false,
                'is_statutory' => $type->isStatutory(),
            ];

            $totalDeductions += $amount;
            $totalPostTax += $amount;

            if ($type->isStatutory()) {
                $statutoryTotal += $amount;
            } else {
                $voluntaryTotal += $amount;
            }
        }

        return [
            'breakdown' => $breakdown,
            'total_deductions' => $totalDeductions,
            'total_pre_tax' => $totalPreTax,
            'total_post_tax' => $totalPostTax,
            'statutory_total' => $statutoryTotal,
            'voluntary_total' => $voluntaryTotal,
            'adjusted_taxable' => $adjustedTaxable,
        ];
    }

    public function assignDeduction(
        User $employee,
        DeductionTypeModel $deductionType,
        array $data
    ): EmployeeDeduction {
        if (isset($data['amount']) && $data['amount'] < 0) {
            throw new \InvalidArgumentException('Deduction amount cannot be negative');
        }

        if (isset($data['rate']) && ($data['rate'] < 0 || $data['rate'] > 100)) {
            throw new \InvalidArgumentException('Deduction rate must be between 0 and 100');
        }

        if (isset($data['total_target']) && $data['total_target'] < 0) {
            throw new \InvalidArgumentException('Total target cannot be negative');
        }

        if (isset($data['total_deducted']) && $data['total_deducted'] < 0) {
            throw new \InvalidArgumentException('Total deducted cannot be negative');
        }

        if (isset($data['total_target'], $data['total_deducted']) && $data['total_deducted'] > $data['total_target']) {
            throw new \InvalidArgumentException('Total deducted cannot exceed total target');
        }

        if (isset($data['effective_from'], $data['effective_to'])) {
            $effectiveFrom = Carbon::parse($data['effective_from']);
            $effectiveTo = Carbon::parse($data['effective_to']);
            if ($effectiveTo->lt($effectiveFrom)) {
                throw new \InvalidArgumentException('Effective end date must be after start date');
            }
        }

        return DB::transaction(function () use ($employee, $deductionType, $data) {
            return EmployeeDeduction::create([
                'tenant_id' => $employee->tenant_id,
                'user_id' => $employee->id,
                'deduction_type_id' => $deductionType->id,
                'amount' => $data['amount'] ?? null,
                'rate' => $data['rate'] ?? null,
                'total_target' => $data['total_target'] ?? null,
                'total_deducted' => $data['total_deducted'] ?? 0,
                'effective_from' => $data['effective_from'] ?? now(),
                'effective_to' => $data['effective_to'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'custom_rules' => $data['custom_rules'] ?? null,
            ]);
        });
    }

    public function createDeductionType(int $tenantId, array $data): DeductionTypeModel
    {
        return DeductionTypeModel::create([
            'tenant_id' => $tenantId,
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'],
            'calculation_type' => $data['calculation_type'],
            'calculation_base' => $data['calculation_base'] ?? DeductionCalculationBase::GROSS->value,
            'default_amount' => $data['default_amount'] ?? null,
            'default_rate' => $data['default_rate'] ?? null,
            'max_amount' => $data['max_amount'] ?? null,
            'annual_cap' => $data['annual_cap'] ?? null,
            'is_pre_tax' => $data['is_pre_tax'] ?? false,
            'is_mandatory' => $data['is_mandatory'] ?? false,
            'is_system' => false,
            'is_active' => true,
            'priority' => $data['priority'] ?? 100,
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    public function getStatutoryDeductionTypes(int $tenantId): Collection
    {
        return DeductionTypeModel::forTenant($tenantId)
            ->statutory()
            ->active()
            ->orderedByPriority()
            ->get();
    }

    public function getVoluntaryDeductionTypes(int $tenantId): Collection
    {
        return DeductionTypeModel::forTenant($tenantId)
            ->voluntary()
            ->active()
            ->orderedByPriority()
            ->get();
    }

    public function recordDeductionPayment(EmployeeDeduction $deduction, float $amount): void
    {
        $deduction->recordDeduction($amount);
    }

    public function getOutstandingLoanBalance(User $employee): float
    {
        return $employee->employeeDeductions()
            ->whereHas('deductionType', function ($q) {
                $q->whereIn('category', [
                    DeductionCategory::LOAN->value,
                    DeductionCategory::ADVANCE->value,
                ]);
            })
            ->whereNotNull('total_target')
            ->get()
            ->sum(fn ($d) => $d->getRemainingBalance() ?? 0);
    }

    public function assignStatutoryDeductions(User $employee): void
    {
        $statutoryTypes = $this->getStatutoryDeductionTypes($employee->tenant_id);

        foreach ($statutoryTypes as $type) {
            $exists = EmployeeDeduction::where('user_id', $employee->id)
                ->where('deduction_type_id', $type->id)
                ->where('is_active', true)
                ->exists();

            if (! $exists) {
                $this->assignDeduction($employee, $type, [
                    'effective_from' => now(),
                ]);
            }
        }
    }
}
