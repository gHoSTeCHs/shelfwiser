<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelPayrollPeriodRequest;
use App\Http\Requests\StorePayrollPeriodRequest;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Services\PayrollService;
use App\Services\PayRunService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    /**
     * PayrollController supports both legacy PayrollPeriod workflow and modern PayRun workflow.
     * Methods check for associated PayRun and delegate to PayRunService if it exists,
     * otherwise fall back to PayrollService for backward compatibility.
     */
    public function __construct(
        private PayrollService $payrollService,
        private PayRunService $payRunService
    ) {}

    /**
     * Display a listing of payroll periods - redirects to Pay Runs
     *
     * @deprecated Use PayRunController::index instead
     */
    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('pay-runs.index');
    }

    /**
     * Show the form for creating a new payroll period - redirects to Pay Runs
     *
     * @deprecated Use PayRunController::create instead
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('pay-runs.create');
    }

    /**
     * Store a newly created payroll period and create a PayRun
     * Uses PayRunService for unified payroll processing
     */
    public function store(StorePayrollPeriodRequest $request): RedirectResponse
    {
        Gate::authorize('create', PayrollPeriod::class);

        $payRun = $this->payRunService->createPayrollPeriodWithPayRun(
            $request->user()->tenant_id,
            $request->validated(),
            $request->user()
        );

        return redirect()
            ->route('pay-runs.show', $payRun)
            ->with('success', 'Payroll period and pay run created successfully');
    }

    /**
     * Display the specified payroll period - redirects to PayRun if exists
     */
    public function show(PayrollPeriod $payrollPeriod): Response|RedirectResponse
    {
        Gate::authorize('view', $payrollPeriod);

        $payRun = $this->payRunService->findByPayrollPeriod($payrollPeriod);
        if ($payRun) {
            return redirect()->route('pay-runs.show', $payRun);
        }

        $this->payrollService->loadPayrollPeriodRelations($payrollPeriod);

        return Inertia::render('Payroll/Show', [
            'payrollPeriod' => $payrollPeriod,
            'canProcess' => Gate::allows('process', $payrollPeriod),
            'canApprove' => Gate::allows('approve', $payrollPeriod),
            'canMarkAsPaid' => Gate::allows('markAsPaid', $payrollPeriod),
            'canCancel' => Gate::allows('cancel', $payrollPeriod),
            'canDelete' => Gate::allows('delete', $payrollPeriod),
        ]);
    }

    /**
     * Process payroll for a period - creates PayRun if not exists and redirects
     */
    public function process(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('process', $payrollPeriod);

        try {
            $payRun = $this->payRunService->processForPayrollPeriod($payrollPeriod, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)->with('success', 'Payroll processed successfully');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Approve payroll - delegates to PayRun if exists
     */
    public function approve(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('approve', $payrollPeriod);

        try {
            $payRun = $this->payRunService->approveForPayrollPeriod($payrollPeriod, auth()->user());

            if ($payRun) {
                return redirect()->route('pay-runs.show', $payRun)->with('success', 'Payroll approved successfully');
            }

            $this->payrollService->approvePayroll($payrollPeriod, auth()->user());

            return redirect()->route('payroll.show', $payrollPeriod)->with('success', 'Payroll approved successfully');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Mark payroll as paid - delegates to PayRun complete if exists
     */
    public function markAsPaid(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('markAsPaid', $payrollPeriod);

        try {
            $payRun = $this->payRunService->completeForPayrollPeriod($payrollPeriod, auth()->user());

            if ($payRun) {
                return redirect()->route('pay-runs.show', $payRun)->with('success', 'Payroll marked as paid');
            }

            $this->payrollService->markAsPaid($payrollPeriod);

            return redirect()->route('payroll.show', $payrollPeriod)->with('success', 'Payroll marked as paid');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel payroll - delegates to PayRun if exists
     */
    public function cancel(CancelPayrollPeriodRequest $request, PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('cancel', $payrollPeriod);

        try {
            $reason = $request->validated('reason');
            $payRun = $this->payRunService->cancelForPayrollPeriod($payrollPeriod, $reason, $request->user());

            if (! $payRun) {
                $this->payrollService->cancelPayroll($payrollPeriod, $reason, $request->user()->id);
            }

            return redirect()
                ->route($payRun ? 'pay-runs.index' : 'payroll.index')
                ->with('success', 'Payroll cancelled');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Delete a payroll period
     */
    public function destroy(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('delete', $payrollPeriod);

        try {
            $this->payrollService->deletePayrollPeriod($payrollPeriod, auth()->user());

            return redirect()
                ->route('payroll.index')
                ->with('success', 'Payroll period deleted successfully');
        } catch (\RuntimeException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display employee's own payslips
     */
    public function myPayslips(Request $request): Response
    {
        Gate::authorize('viewOwn', Payslip::class);

        return Inertia::render('Payroll/MyPayslips', [
            'payslips' => $this->payrollService->getPayslipsForUser($request->user()),
        ]);
    }

    /**
     * Display a specific payslip
     */
    public function showPayslip(Payslip $payslip): Response
    {
        Gate::authorize('view', $payslip);

        $payslip->loadShowRelations();

        return Inertia::render('Payroll/Payslip', [
            'payslip' => $payslip,
        ]);
    }
}
