<?php

declare(strict_types=1);

use App\Enums\PayRunStatus;
use App\Enums\PayrollStatus;
use App\Models\PayRun;
use App\Models\PayrollPeriod;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PayrollReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('produces a balanced journal when NHF and NHIS deductions are present', function () {
    $tenant = Tenant::factory()->create();
    $user   = User::factory()->create(['tenant_id' => $tenant->id]);
    $shop   = Shop::factory()->create(['tenant_id' => $tenant->id]);

    $period = PayrollPeriod::query()->forceCreate([
        'tenant_id'                => $tenant->id,
        'period_name'              => 'April 2026',
        'start_date'               => '2026-04-01',
        'end_date'                 => '2026-04-30',
        'payment_date'             => '2026-04-30',
        'status'                   => PayrollStatus::PROCESSED,
        'employee_count'           => 1,
        'total_gross_pay'          => 100_000,
        'total_deductions'         => 20_000,
        'total_net_pay'            => 80_000,
        'includes_general_manager' => false,
        'requires_owner_approval'  => false,
    ]);

    $payRun = PayRun::query()->forceCreate([
        'tenant_id'            => $tenant->id,
        'payroll_period_id'    => $period->id,
        'reference'            => 'PR-TEST-0001',
        'name'                 => 'April 2026 Pay Run',
        'status'               => PayRunStatus::COMPLETED,
        'total_gross'          => 100_000,
        'total_net'            => 80_000,
        'total_employer_costs' => 105_000,
        'total_deductions'     => 20_000,
        'completed_at'         => now(),
    ]);

    DB::table('payslips')->insert([
        'tenant_id'          => $tenant->id,
        'payroll_period_id'  => $period->id,
        'pay_run_id'         => $payRun->id,
        'user_id'            => $user->id,
        'shop_id'            => $shop->id,
        'income_tax'         => 10_000,
        'pension_employee'   => 3_000,
        'pension_employer'   => 5_000,
        'nhf'                => 2_500,
        'nhis'               => 4_500,
        'net_pay'            => 80_000,
        'gross_pay'          => 100_000,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $journal = app(PayrollReportService::class)->getPayrollJournal();

    expect($journal['totals']['balanced'])->toBeTrue();
});
