<?php

namespace App\Http\Controllers;

use App\Enums\PayRunStatus;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\Payslip;
use App\Services\NibssExportService;
use App\Services\PayrollExportService;
use App\Services\PayrollReportService;
use App\Services\PayslipPdfService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollReportController extends Controller
{
    public function __construct(
        protected PayrollReportService $reportService,
        protected PayrollExportService $exportService,
        protected PayslipPdfService $payslipPdfService,
        protected NibssExportService $nibssService
    ) {}

    public function summary(Request $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $tenantId = auth()->user()->tenant_id;

        $filters = $this->getFilters($request);
        $reportData = $this->reportService->getPayrollSummary(
            $tenantId,
            $filters['period_id'],
            $filters['start_date'],
            $filters['end_date'],
            $filters['shop_ids']
        );

        $periods = PayrollPeriod::where('tenant_id', $tenantId)
            ->orderByDesc('start_date')
            ->get(['id', 'period_name', 'start_date', 'end_date']);

        return Inertia::render('Payroll/Reports/Summary', [
            'reportData' => $reportData,
            'periods' => $periods,
            'filters' => $request->only(['period_id', 'start_date', 'end_date', 'shop_ids']),
        ]);
    }

    public function exportSummary(Request $request)
    {
        Gate::authorize('export_payroll_reports');

        $tenantId = auth()->user()->tenant_id;
        $filters = $this->getFilters($request);
        $format = $request->get('format', 'csv');

        $reportData = $this->reportService->getPayrollSummary(
            $tenantId,
            $filters['period_id'],
            $filters['start_date'],
            $filters['end_date'],
            $filters['shop_ids']
        );

        $filename = 'payroll_summary_'.now()->format('Ymd');

        return match ($format) {
            'excel' => $this->exportService->exportSummaryToExcel($reportData, $filename.'.xlsx'),
            'pdf' => $this->exportService->exportSummaryToPdf($reportData, $filename.'.pdf', 'Payroll Summary Report'),
            default => $this->exportService->exportSummaryToCsv($reportData, $filename.'.csv'),
        };
    }

    public function taxRemittance(Request $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $tenantId = auth()->user()->tenant_id;
        $filters = $this->getFilters($request);

        $reportData = $this->reportService->getTaxRemittanceReport(
            $tenantId,
            $filters['period_id'],
            $filters['start_date'],
            $filters['end_date']
        );

        $periods = PayrollPeriod::where('tenant_id', $tenantId)
            ->orderByDesc('start_date')
            ->get(['id', 'period_name', 'start_date', 'end_date']);

        return Inertia::render('Payroll/Reports/Tax', [
            'reportData' => $reportData,
            'periods' => $periods,
            'filters' => $request->only(['period_id', 'start_date', 'end_date']),
        ]);
    }

    public function exportTaxRemittance(Request $request)
    {
        Gate::authorize('export_payroll_reports');

        $tenantId = auth()->user()->tenant_id;
        $filters = $this->getFilters($request);
        $format = $request->get('format', 'csv');

        $reportData = $this->reportService->getTaxRemittanceReport(
            $tenantId,
            $filters['period_id'],
            $filters['start_date'],
            $filters['end_date']
        );

        $filename = 'tax_remittance_'.now()->format('Ymd');

        return match ($format) {
            'excel' => $this->exportService->exportTaxToExcel($reportData, $filename.'.xlsx'),
            'pdf' => $this->exportService->exportTaxToPdf($reportData, $filename.'.pdf', 'Tax Remittance Report'),
            default => $this->exportService->exportTaxToCsv($reportData, $filename.'.csv'),
        };
    }

    public function pension(Request $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $tenantId = auth()->user()->tenant_id;
        $filters = $this->getFilters($request);

        $reportData = $this->reportService->getPensionReport(
            $tenantId,
            $filters['period_id'],
            $filters['start_date'],
            $filters['end_date']
        );

        $periods = PayrollPeriod::where('tenant_id', $tenantId)
            ->orderByDesc('start_date')
            ->get(['id', 'period_name', 'start_date', 'end_date']);

        return Inertia::render('Payroll/Reports/Pension', [
            'reportData' => $reportData,
            'periods' => $periods,
            'filters' => $request->only(['period_id', 'start_date', 'end_date']),
        ]);
    }

    public function exportPension(Request $request)
    {
        Gate::authorize('export_payroll_reports');

        $tenantId = auth()->user()->tenant_id;
        $filters = $this->getFilters($request);
        $format = $request->get('format', 'csv');

        $reportData = $this->reportService->getPensionReport(
            $tenantId,
            $filters['period_id'],
            $filters['start_date'],
            $filters['end_date']
        );

        $filename = 'pension_report_'.now()->format('Ymd');

        return match ($format) {
            'excel' => $this->exportService->exportPensionToExcel($reportData, $filename.'.xlsx'),
            'pdf' => $this->exportService->exportPensionToPdf($reportData, $filename.'.pdf', 'Pension Contributions Report'),
            default => $this->exportService->exportPensionToCsv($reportData, $filename.'.csv'),
        };
    }

    public function bankSchedule(Request $request): Response
    {
        Gate::authorize('view_payroll_reports');

        $tenantId = auth()->user()->tenant_id;

        $payRuns = PayRun::forTenant($tenantId)
            ->whereIn('status', [PayRunStatus::APPROVED, PayRunStatus::COMPLETED])
            ->with('payrollPeriod:id,period_name')
            ->orderByDesc('created_at')
            ->get(['id', 'reference', 'name', 'payroll_period_id', 'status', 'total_net']);

        $selectedPayRunId = $request->get('pay_run_id');
        $reportData = null;
        $validation = null;

        if ($selectedPayRunId) {
            $reportData = $this->reportService->getBankSchedule($tenantId, $selectedPayRunId);
            $payRun = PayRun::findOrFail($selectedPayRunId);
            $validation = $this->nibssService->validateBankDetails($payRun);
        }

        return Inertia::render('Payroll/Reports/BankSchedule', [
            'payRuns' => $payRuns,
            'reportData' => $reportData,
            'validation' => $validation,
            'filters' => ['pay_run_id' => $selectedPayRunId],
        ]);
    }

    public function exportBankSchedule(Request $request)
    {
        Gate::authorize('export_payroll_reports');

        $tenantId = auth()->user()->tenant_id;
        $payRunId = $request->get('pay_run_id');
        $format = $request->get('format', 'csv');

        if (! $payRunId) {
            return back()->with('error', 'Please select a pay run.');
        }

        $reportData = $this->reportService->getBankSchedule($tenantId, $payRunId);
        $payRun = PayRun::findOrFail($payRunId);

        $filename = 'bank_schedule_'.$payRun->reference.'_'.now()->format('Ymd');

        if ($format === 'nibss') {
            return $this->nibssService->downloadNibssFile($payRun);
        }

        return match ($format) {
            'excel' => $this->exportService->exportBankScheduleToExcel($reportData, $filename.'.xlsx'),
            'pdf' => $this->exportService->exportBankScheduleToPdf($reportData, $filename.'.pdf', 'Bank Payment Schedule'),
            default => $this->exportService->exportBankScheduleToCsv($reportData, $filename.'.csv'),
        };
    }

    public function downloadPayslip(Payslip $payslip)
    {
        Gate::authorize('view', $payslip);

        if ($payslip->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        return $this->payslipPdfService->downloadPayslip($payslip);
    }

    public function downloadBulkPayslips(PayRun $payRun)
    {
        Gate::authorize('view', $payRun);

        if ($payRun->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        return $this->payslipPdfService->downloadBulkPayslips($payRun);
    }

    public function validateNibss(PayRun $payRun)
    {
        Gate::authorize('view_payroll_reports');

        if ($payRun->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $validation = $this->nibssService->validateBankDetails($payRun);

        return response()->json($validation);
    }

    protected function getFilters(Request $request): array
    {
        return [
            'period_id' => $request->filled('period_id') ? (int) $request->period_id : null,
            'start_date' => $request->filled('start_date') ? Carbon::parse($request->start_date) : null,
            'end_date' => $request->filled('end_date') ? Carbon::parse($request->end_date) : null,
            'shop_ids' => $request->filled('shop_ids') ? (array) $request->shop_ids : null,
        ];
    }
}
