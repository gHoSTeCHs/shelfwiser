<?php

namespace App\Services;

use App\Enums\DeductionType;
use App\Models\EmployeeCustomDeduction;
use App\Models\User;
use Illuminate\Support\Collection;

class EmployeeCustomDeductionService
{
    public function getDeductionsForEmployee(User $employee): Collection
    {
        return EmployeeCustomDeduction::query()
            ->forUser($employee->id)
            ->with(['user:id,name,email'])
            ->latest()
            ->get();
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public function getDeductionTypeOptions(): array
    {
        return collect(DeductionType::cases())
            ->map(fn (DeductionType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ])
            ->all();
    }

    public function createDeduction(User $employee, array $validated): void
    {
        EmployeeCustomDeduction::query()->create([
            'user_id' => $employee->id,
            'deduction_name' => $validated['deduction_name'],
            'deduction_type' => $validated['deduction_type'],
            'amount' => $validated['amount'] ?? 0,
            'percentage' => $validated['percentage'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
        ]);
    }

    public function updateDeduction(EmployeeCustomDeduction $deduction, User $employee, array $validated): void
    {
        $this->verifyOwnership($deduction, $employee);

        $deduction->update([
            'deduction_name' => $validated['deduction_name'],
            'deduction_type' => $validated['deduction_type'],
            'amount' => $validated['amount'] ?? 0,
            'percentage' => $validated['percentage'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'effective_from' => $validated['effective_from'],
            'effective_to' => $validated['effective_to'] ?? null,
        ]);
    }

    public function deleteDeduction(EmployeeCustomDeduction $deduction, User $employee): void
    {
        $this->verifyOwnership($deduction, $employee);

        $deduction->delete();
    }

    public function toggleDeductionStatus(EmployeeCustomDeduction $deduction, User $employee): string
    {
        $this->verifyOwnership($deduction, $employee);

        $deduction->update(['is_active' => ! $deduction->is_active]);

        $deduction->refresh();

        return $deduction->is_active ? 'activated' : 'deactivated';
    }

    private function verifyOwnership(EmployeeCustomDeduction $deduction, User $employee): void
    {
        abort_if($deduction->user_id !== $employee->id, 403);
    }
}
