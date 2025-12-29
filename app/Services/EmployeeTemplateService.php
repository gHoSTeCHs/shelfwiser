<?php

namespace App\Services;

use App\Enums\PayType;
use App\Enums\UserRole;
use App\Models\EmployeeTemplate;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EmployeeTemplateService
{
    public function getAvailableTemplates(int $tenantId): Collection
    {
        return Cache::tags(["tenant:{$tenantId}:employee-templates"])
            ->remember("available-templates", 3600, function () use ($tenantId) {
                return EmployeeTemplate::availableFor($tenantId)
                    ->orderByDesc('is_system')
                    ->orderByDesc('usage_count')
                    ->orderBy('name')
                    ->get();
            });
    }

    public function getSystemTemplates(): Collection
    {
        return Cache::remember('system-employee-templates', 3600, function () {
            return EmployeeTemplate::systemTemplates()
                ->orderBy('name')
                ->get();
        });
    }

    public function getTenantTemplates(int $tenantId): Collection
    {
        return Cache::tags(["tenant:{$tenantId}:employee-templates"])
            ->remember("tenant-templates", 3600, function () use ($tenantId) {
                return EmployeeTemplate::tenantTemplates($tenantId)
                    ->orderByDesc('usage_count')
                    ->orderBy('name')
                    ->get();
            });
    }

    public function applyTemplate(int $templateId, int $tenantId): ?array
    {
        $template = EmployeeTemplate::availableFor($tenantId)->find($templateId);

        if (!$template) {
            return null;
        }

        $template->incrementUsage();

        return $template->toFormData();
    }

    public function shouldAutoSaveAsTemplate(array $employeeData, int $tenantId): bool
    {
        return DB::transaction(function () use ($employeeData, $tenantId) {
            $existingTemplates = EmployeeTemplate::availableFor($tenantId)
                ->lockForUpdate()
                ->get();

            if ($existingTemplates->where('tenant_id', $tenantId)->isEmpty()) {
                return true;
            }

            foreach ($existingTemplates as $template) {
                $similarity = $this->calculateSimilarity($employeeData, $template);
                if ($similarity > 0.8) {
                    return false;
                }
            }

            return true;
        });
    }

    protected function calculateSimilarity(array $data, EmployeeTemplate $template): float
    {
        $fieldsToCompare = [
            'role',
            'employment_type',
            'pay_type',
            'pay_frequency',
            'pension_enabled',
            'nhf_enabled',
            'nhis_enabled',
        ];

        $matches = 0;
        foreach ($fieldsToCompare as $field) {
            if (($data[$field] ?? null) == $template->$field) {
                $matches++;
            }
        }

        $payDiff = abs(($data['pay_amount'] ?? 0) - (float) $template->pay_amount);
        $payTolerance = (float) $template->pay_amount * 0.2;
        if ($payDiff <= $payTolerance) {
            $matches++;
        }

        return $matches / (count($fieldsToCompare) + 1);
    }

    public function autoSaveTemplate(User $employee, array $originalData): void
    {
        dispatch(function () use ($employee, $originalData) {
            if ($this->shouldAutoSaveAsTemplate($originalData, $employee->tenant_id)) {
                $this->createTemplateFromEmployee($employee, $originalData);
            }
        })->afterResponse();
    }

    public function createTemplateFromEmployee(User $employee, array $data, ?string $customName = null): EmployeeTemplate
    {
        $roleName = UserRole::tryFrom($data['role'])?->label() ?? $data['role'];
        $payTypeName = PayType::tryFrom($data['pay_type'])?->label() ?? $data['pay_type'];
        $name = $customName ?? "{$roleName} - {$payTypeName}";

        $template = EmployeeTemplate::create([
            'tenant_id' => $employee->tenant_id,
            'name' => $name,
            'description' => "Auto-created from employee: {$employee->name}",
            'is_system' => false,
            'role' => $data['role'],
            'employment_type' => $data['employment_type'],
            'position_title' => $data['position_title'] ?? $roleName,
            'department' => $data['department'] ?? null,
            'pay_type' => $data['pay_type'],
            'pay_amount' => $data['pay_amount'],
            'pay_frequency' => $data['pay_frequency'],
            'standard_hours_per_week' => $data['standard_hours_per_week'] ?? 40,
            'commission_rate' => $data['commission_rate'] ?? null,
            'commission_cap' => $data['commission_cap'] ?? null,
            'tax_handling' => $data['tax_handling'] ?? null,
            'pension_enabled' => $data['pension_enabled'] ?? false,
            'pension_employee_rate' => $data['pension_employee_rate'] ?? 8.00,
            'nhf_enabled' => $data['nhf_enabled'] ?? false,
            'nhis_enabled' => $data['nhis_enabled'] ?? false,
            'usage_count' => 1,
        ]);

        $this->clearTenantCache($employee->tenant_id);

        return $template;
    }

    public function saveAsTemplate(int $tenantId, array $data, string $name, ?string $description = null): EmployeeTemplate
    {
        $template = EmployeeTemplate::create([
            'tenant_id' => $tenantId,
            'name' => $name,
            'description' => $description,
            'is_system' => false,
            'role' => $data['role'],
            'employment_type' => $data['employment_type'],
            'position_title' => $data['position_title'],
            'department' => $data['department'] ?? null,
            'pay_type' => $data['pay_type'],
            'pay_amount' => $data['pay_amount'],
            'pay_frequency' => $data['pay_frequency'],
            'standard_hours_per_week' => $data['standard_hours_per_week'] ?? 40,
            'commission_rate' => $data['commission_rate'] ?? null,
            'commission_cap' => $data['commission_cap'] ?? null,
            'tax_handling' => $data['tax_handling'] ?? null,
            'pension_enabled' => $data['pension_enabled'] ?? false,
            'pension_employee_rate' => $data['pension_employee_rate'] ?? 8.00,
            'nhf_enabled' => $data['nhf_enabled'] ?? false,
            'nhis_enabled' => $data['nhis_enabled'] ?? false,
            'usage_count' => 0,
        ]);

        $this->clearTenantCache($tenantId);

        return $template;
    }

    public function deleteTemplate(int $templateId, int $tenantId): bool
    {
        $template = EmployeeTemplate::tenantTemplates($tenantId)->find($templateId);

        if (!$template) {
            return false;
        }

        $template->delete();
        $this->clearTenantCache($tenantId);

        return true;
    }

    protected function clearTenantCache(int $tenantId): void
    {
        Cache::tags(["tenant:{$tenantId}:employee-templates"])->flush();
    }
}
