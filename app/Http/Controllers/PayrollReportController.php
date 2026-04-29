<?php

namespace App\Http\Controllers;

use App\DTOs\DateRange;
use App\Http\Requests\PayrollReportFilterRequest;
use App\Models\PayRun;
use App\Models\Payslip;
use App\Services\PayrollExportService;
use App\Services\PayrollReportService;
use App\Services\PayslipPdfService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollReportController extends Controller
{
    public function __construct(
        protected PayrollReportService $reportService,
        protected PayrollExportService $exportService,
        protected PayslipPdfService $payslipPdfService,
    ) {}

    public function summary(PayrollReportFilterRequest $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $validated = $request->validated();

        return Inertia::render('Payroll/Reports/Summary', [
            'reportData' => $this->reportService->getPayrollSummary(
                periodId: $request->integer('period_id') ?: null,
                dateRange: DateRange::fromRequest($validated, 'start_date', 'end_date'),
                shopIds: $validated['shop_ids'] ?? null,
            ),
            'periods' => $this->reportService->getPeriods(),
            'filters' => $request->only(['period_id', 'start_date', 'end_date', 'shop_ids']),
        ]);
    }

    public function exportSummary(PayrollReportFilterRequest $request): mixed
    {
        Gate::authorize('export_payroll_reports');

        $validated = $request->validated();

        return $this->exportService->exportReport(
            type: 'summary',
            reportData: $this->reportService->getPayrollSummary(
                periodId: $request->integer('period_id') ?: null,
                dateRange: DateRange::fromRequest($validated, 'start_date', 'end_date'),
                shopIds: $validated['shop_ids'] ?? null,
            ),
            format: $validated['format'] ?? 'csv',
            filename: 'payroll_summary_'.now()->format('Ymd'),
        );
    }

    public function taxRemittance(PayrollReportFilterRequest $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $validated = $request->validated();

        return Inertia::render('Payroll/Reports/Tax', [
            'reportData' => $this->reportService->getTaxRemittanceReport(
                periodId: $request->integer('period_id') ?: null,
                dateRange: DateRange::fromRequest($validated, 'start_date', 'end_date'),
            ),
            'periods' => $this->reportService->getPeriods(),
            'filters' => $request->only(['period_id', 'start_date', 'end_date']),
        ]);
    }

    public function exportTaxRemittance(PayrollReportFilterRequest $request): mixed
    {
        Gate::authorize('export_payroll_reports');

        $validated = $request->validated();

        return $this->exportService->exportReport(
            type: 'tax',
            reportData: $this->reportService->getTaxRemittanceReport(
                periodId: $request->integer('period_id') ?: null,
                dateRange: DateRange::fromRequest($validated, 'start_date', 'end_date'),
            ),
            format: $validated['format'] ?? 'csv',
            filename: 'tax_remittance_'.now()->format('Ymd'),
        );
    }

    public function pension(PayrollReportFilterRequest $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $validated = $request->validated();

        return Inertia::render('Payroll/Reports/Pension', [
            'reportData' => $this->reportService->getPensionReport(
                periodId: $request->integer('period_id') ?: null,
                dateRange: DateRange::fromRequest($validated, 'start_date', 'end_date'),
            ),
            'periods' => $this->reportService->getPeriods(),
            'filters' => $request->only(['period_id', 'start_date', 'end_date']),
        ]);
    }

    public function exportPension(PayrollReportFilterRequest $request): mixed
    {
        Gate::authorize('export_payroll_reports');

        $validated = $request->validated();

        return $this->exportService->exportReport(
            type: 'pension',
            reportData: $this->reportService->getPensionReport(
                periodId: $request->integer('period_id') ?: null,
                dateRange: DateRange::fromRequest($validated, 'start_date', 'end_date'),
            ),
            format: $validated['format'] ?? 'csv',
            filename: 'pension_report_'.now()->format('Ymd'),
        );
    }

    public function bankSchedule(PayrollReportFilterRequest $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $payRunId = $request->integer('pay_run_id') ?: null;
        $reportData = null;
        $validation = null;

        if ($payRunId) {
            $payRun = $this->reportService->getPayRun($payRunId);
            $reportData = $this->reportService->getBankSchedule($payRunId);
            $validation = $this->exportService->validateBankDetails($payRun);
        }

        return Inertia::render('Payroll/Reports/BankSchedule', [
            'payRuns'    => $this->reportService->getApprovedPayRuns(),
            'reportData' => $reportData,
            'validation' => $validation,
            'filters'    => ['pay_run_id' => $payRunId],
        ]);
    }

    public function exportBankSchedule(PayrollReportFilterRequest $request): mixed
    {
        Gate::authorize('export_payroll_reports');

        $validated = $request->validated();
        $payRunId = $request->integer('pay_run_id') ?: null;

        if (! $payRunId) {
            return back()->with('error', 'Please select a pay run.');
        }

        $reportData = $this->reportService->getBankSchedule($payRunId);
        $payRun = $this->reportService->getPayRun($payRunId);
        $filename = 'bank_schedule_'.$reportData['summary']['pay_run_reference'].'_'.now()->format('Ymd');

        return $this->exportService->exportReport(
            type: 'bankSchedule',
            reportData: $reportData,
            format: $validated['format'] ?? 'csv',
            filename: $filename,
            payRun: $payRun,
        );
    }

    public function downloadPayslip(Payslip $payslip): mixed
    {
        Gate::authorize('view', $payslip);

        return $this->payslipPdfService->downloadPayslip($payslip);
    }

    public function downloadBulkPayslips(PayRun $payRun): mixed
    {
        Gate::authorize('view', $payRun);

        return $this->payslipPdfService->downloadBulkPayslips($payRun);
    }

    public function validateNibss(PayRun $payRun): \Illuminate\Http\JsonResponse
    {
        Gate::authorize('view_payroll_reports');

        return response()->json($this->exportService->validateBankDetails($payRun));
    }
}
