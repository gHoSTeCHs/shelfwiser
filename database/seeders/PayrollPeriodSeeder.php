<?php

namespace Database\Seeders;

use App\Enums\PayrollStatus;
use App\Enums\UserRole;
use App\Models\PayrollPeriod;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PayrollService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PayrollPeriodSeeder extends Seeder
{
    /**
     * Seed payroll periods with processed payslips
     */
    public function run(): void
    {
        $payrollService = app(PayrollService::class);
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $shop = Shop::where('tenant_id', $tenant->id)->first();

            if (! $shop) {
                continue;
            }

            $processor = User::where('tenant_id', $tenant->id)
                ->whereIn('role', [UserRole::OWNER, UserRole::GENERAL_MANAGER])
                ->first();

            if (! $processor) {
                continue;
            }

            $this->createPayrollPeriodsForTenant($tenant, $shop, $processor, $payrollService);
        }
    }

    /**
     * Create multiple payroll periods with different statuses
     */
    protected function createPayrollPeriodsForTenant(
        Tenant $tenant,
        Shop $shop,
        User $processor,
        PayrollService $payrollService
    ): void {
        $lastMonth = Carbon::now()->subMonth();
        $currentMonth = Carbon::now();

        $period1 = PayrollPeriod::create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'period_name' => $lastMonth->format('F Y'),
            'start_date' => $lastMonth->copy()->startOfMonth(),
            'end_date' => $lastMonth->copy()->endOfMonth(),
            'payment_date' => $lastMonth->copy()->endOfMonth()->addDays(5),
            'status' => PayrollStatus::DRAFT,
        ]);

        try {
            $payrollService->processPayroll($period1->fresh(), $processor);
            $period1->refresh();

            if ($period1->status === PayrollStatus::PROCESSED) {
                $payrollService->approvePayroll($period1, $processor);
                $period1->refresh();

                if ($period1->status === PayrollStatus::APPROVED) {
                    $payrollService->markAsPaid($period1);
                }
            }
        } catch (\Exception $e) {
        }

        $period2 = PayrollPeriod::create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'period_name' => $currentMonth->format('F Y'),
            'start_date' => $currentMonth->copy()->startOfMonth(),
            'end_date' => $currentMonth->copy()->endOfMonth(),
            'payment_date' => $currentMonth->copy()->endOfMonth()->addDays(5),
            'status' => PayrollStatus::DRAFT,
        ]);

        try {
            $payrollService->processPayroll($period2->fresh(), $processor);
        } catch (\Exception $e) {
        }
    }
}
