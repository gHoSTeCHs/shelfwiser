<?php

namespace Database\Seeders;

use App\Enums\PayrollStatus;
use App\Enums\UserRole;
use App\Models\PayrollPeriod;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PayRunService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PayrollPeriodSeeder extends Seeder
{
    /**
     * Seed payroll periods with processed payslips using modern PayRunService
     */
    public function run(): void
    {
        $payRunService = app(PayRunService::class);
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

            $this->createPayrollPeriodsForTenant($tenant, $shop, $processor, $payRunService);
        }
    }

    /**
     * Create multiple payroll periods with different statuses using PayRunService
     */
    protected function createPayrollPeriodsForTenant(
        Tenant $tenant,
        Shop $shop,
        User $processor,
        PayRunService $payRunService
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
            $payRun1 = $payRunService->createPayRun($tenant->id, $period1->fresh());
            $payRunService->calculatePayRun($payRun1);
            $payRun1->refresh();

            $payRunService->submitForApproval($payRun1);
            $payRun1->refresh();

            $payRunService->approvePayRun($payRun1);
            $payRun1->refresh();

            $payRunService->completePayRun($payRun1);
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
            $payRun2 = $payRunService->createPayRun($tenant->id, $period2->fresh());
            $payRunService->calculatePayRun($payRun2);
        } catch (\Exception $e) {
        }
    }
}
