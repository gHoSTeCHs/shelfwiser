<?php

namespace App\Services;

use App\Enums\DeductionCalculationBase;
use App\Models\DeductionTypeModel;
use App\Models\EarningType;
use App\Models\PayCalendar;
use App\Models\TaxTable;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PayrollSettingsService
{
    public function __construct(
        private readonly PayrollAuditService $auditService
    ) {}

    public function getEarningTypes(): Collection
    {
        return EarningType::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();
    }

    public function createEarningType(array $validated, User $actor): void
    {
        $codeExists = EarningType::query()
            ->where('code', $validated['code'])
            ->exists();

        abort_if($codeExists, 422, 'This code is already in use.');

        $earningType = EarningType::query()->create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'calculation_type' => $validated['calculation_type'],
            'default_amount' => $validated['default_amount'] ?? 0,
            'default_rate' => $validated['default_rate'] ?? 0,
            'is_taxable' => $validated['is_taxable'] ?? true,
            'is_pensionable' => $validated['is_pensionable'] ?? true,
            'is_recurring' => $validated['is_recurring'] ?? true,
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        $this->auditService->logEarningTypeCreated($earningType, $actor);
    }

    public function updateEarningType(EarningType $earningType, array $validated, User $actor): void
    {
        $oldValues = $earningType->only(array_keys($validated));

        $earningType->update($validated);

        $this->auditService->logEarningTypeUpdated($earningType, $oldValues, $actor);
    }

    public function deleteEarningType(EarningType $earningType, User $actor): void
    {
        $this->auditService->logEarningTypeDeleted($earningType, $actor);

        $earningType->delete();
    }

    public function getDeductionTypes(): Collection
    {
        return DeductionTypeModel::query()
            ->orderedByPriority()
            ->get();
    }

    public function createDeductionType(array $validated, User $actor): void
    {
        $codeExists = DeductionTypeModel::query()
            ->where('code', $validated['code'])
            ->exists();

        abort_if($codeExists, 422, 'This code is already in use.');

        $deductionType = DeductionTypeModel::query()->create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'calculation_type' => $validated['calculation_type'],
            'calculation_base' => $validated['calculation_base'] ?? DeductionCalculationBase::GROSS->value,
            'default_amount' => $validated['default_amount'] ?? 0,
            'default_rate' => $validated['default_rate'] ?? 0,
            'max_amount' => $validated['max_amount'] ?? null,
            'annual_cap' => $validated['annual_cap'] ?? null,
            'is_pre_tax' => $validated['is_pre_tax'] ?? false,
            'is_mandatory' => $validated['is_mandatory'] ?? false,
            'is_system' => false,
            'is_active' => $validated['is_active'] ?? true,
            'priority' => $validated['priority'] ?? 100,
        ]);

        $this->auditService->logDeductionTypeCreated($deductionType, $actor);
    }

    public function updateDeductionType(DeductionTypeModel $deductionType, array $validated, User $actor): void
    {
        $oldValues = $deductionType->only(array_keys($validated));

        $deductionType->update($validated);

        $this->auditService->logDeductionTypeUpdated($deductionType, $oldValues, $actor);
    }

    public function deleteDeductionType(DeductionTypeModel $deductionType, User $actor): void
    {
        $this->auditService->logDeductionTypeDeleted($deductionType, $actor);

        $deductionType->delete();
    }

    public function getPayCalendars(): Collection
    {
        return PayCalendar::query()
            ->withCount('employees')
            ->orderBy('name')
            ->get();
    }

    public function createPayCalendar(array $validated, User $actor): void
    {
        $payCalendar = DB::transaction(function () use ($validated) {
            if ($validated['is_default'] ?? false) {
                PayCalendar::query()->update(['is_default' => false]);
            }

            return PayCalendar::query()->create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'frequency' => $validated['frequency'],
                'pay_day' => $validated['pay_day'],
                'cutoff_day' => $validated['cutoff_day'] ?? null,
                'is_default' => $validated['is_default'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
            ]);
        });

        $this->auditService->logPayCalendarCreated($payCalendar, $actor);
    }

    public function updatePayCalendar(PayCalendar $payCalendar, array $validated, User $actor): void
    {
        $oldValues = $payCalendar->only(array_keys($validated));

        DB::transaction(function () use ($payCalendar, $validated) {
            if ($validated['is_default'] ?? false) {
                PayCalendar::query()
                    ->where('id', '!=', $payCalendar->id)
                    ->update(['is_default' => false]);
            }

            $payCalendar->update($validated);
        });

        $this->auditService->logPayCalendarUpdated($payCalendar, $oldValues, $actor);
    }

    public function deletePayCalendar(PayCalendar $payCalendar, User $actor): void
    {
        $this->auditService->logPayCalendarDeleted($payCalendar, $actor);

        $payCalendar->delete();
    }

    /**
     * @return array{taxTables: \Illuminate\Support\Collection, currentTable: TaxTable|null, taxLawVersions: array, nta2025Countdown: int}
     */
    public function getTaxSettings(int $tenantId): array
    {
        $taxTables = TaxTable::query()
            ->forTenant($tenantId)
            ->active()
            ->with(['bands' => fn ($q) => $q->orderBy('band_order'), 'reliefs'])
            ->orderByDesc('effective_from')
            ->get()
            ->map(function (TaxTable $table) {
                $table->tax_law_version_label = $table->getTaxLawVersion()?->shortLabel();
                $table->is_current = $this->isCurrentTaxTable($table);

                return $table;
            });

        return [
            'taxTables' => $taxTables,
            'currentTable' => TaxTable::getActiveTableForDate($tenantId),
            'nta2025Countdown' => (int) Carbon::parse('2026-01-01')->diffInDays(now()),
        ];
    }

    public function estimateTax(array $validated, int $tenantId, TaxCalculationService $taxCalculationService): mixed
    {
        $effectiveDate = isset($validated['effective_date'])
            ? Carbon::parse($validated['effective_date'])
            : null;

        return $taxCalculationService->estimateTaxForSalary(
            $validated['annual_salary'],
            $tenantId,
            $effectiveDate
        );
    }

    private function isCurrentTaxTable(TaxTable $table): bool
    {
        $now = now();

        if (! $table->effective_from) {
            return true;
        }

        if ($table->effective_from > $now) {
            return false;
        }

        if ($table->effective_to && $table->effective_to < $now) {
            return false;
        }

        return true;
    }
}
