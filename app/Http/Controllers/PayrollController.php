<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\Payslip;
use App\Services\PayrollAuditService;
use App\Services\PayrollService;
use App\Services\PayRunService;
use Carbon\Carbon;
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
        private PayRunService $payRunService,
        private PayrollAuditService $auditService
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
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', PayrollPeriod::class);

        $validated = $request->validate([
            'shop_id' => ['nullable', 'exists:shops,id'],
            'period_name' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'payment_date' => ['required', 'date', 'after_or_equal:end_date'],
        ]);

        $tenantId = $request->user()->tenant_id;

        $payrollPeriod = $this->payRunService->createPayrollPeriod(
            $tenantId,
            $validated['shop_id'] ?? null,
            Carbon::parse($validated['start_date']),
            Carbon::parse($validated['end_date']),
            Carbon::parse($validated['payment_date']),
            $validated['period_name'] ?? null
        );

        $payRun = $this->payRunService->createPayRun($tenantId, $payrollPeriod, [
            'name' => $validated['period_name'] ?? null,
        ]);

        $this->auditService->logPayRunCreated($payRun, auth()->user());

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

        $payRun = PayRun::where('payroll_period_id', $payrollPeriod->id)->first();
        if ($payRun) {
            return redirect()->route('pay-runs.show', $payRun);
        }

        $payrollPeriod->load(['payslips.user', 'shop', 'processedBy', 'approvedBy']);

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
            $payRun = PayRun::where('payroll_period_id', $payrollPeriod->id)->first();

            if (! $payRun) {
                $payRun = $this->payRunService->createPayRun(
                    $payrollPeriod->tenant_id,
                    $payrollPeriod,
                    ['name' => $payrollPeriod->period_name]
                );
                $this->auditService->logPayRunCreated($payRun, auth()->user());
            }

            $payRun = $this->payRunService->calculatePayRun($payRun);
            $this->auditService->logPayRunCalculated($payRun, auth()->user());

            return redirect()
                ->route('pay-runs.show', $payRun)
                ->with('success', 'Payroll processed successfully');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Approve payroll - delegates to PayRun if exists
     */
    public function approve(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('approve', $payrollPeriod);

        try {
            $payRun = PayRun::where('payroll_period_id', $payrollPeriod->id)->first();

            if ($payRun) {
                $payRun = $this->payRunService->approvePayRun($payRun);
                $this->auditService->logPayRunApproved($payRun, auth()->user());

                return redirect()
                    ->route('pay-runs.show', $payRun)
                    ->with('success', 'Payroll approved successfully');
            }

            $this->payrollService->approvePayroll($payrollPeriod, auth()->user());

            return redirect()
                ->route('payroll.show', $payrollPeriod)
                ->with('success', 'Payroll approved successfully');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Mark payroll as paid - delegates to PayRun complete if exists
     */
    public function markAsPaid(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('markAsPaid', $payrollPeriod);

        try {
            $payRun = PayRun::where('payroll_period_id', $payrollPeriod->id)->first();

            if ($payRun) {
                $payRun = $this->payRunService->completePayRun($payRun);
                $this->auditService->logPayRunCompleted($payRun, auth()->user());

                return redirect()
                    ->route('pay-runs.show', $payRun)
                    ->with('success', 'Payroll marked as paid');
            }

            $this->payrollService->markAsPaid($payrollPeriod);

            return redirect()
                ->route('payroll.show', $payrollPeriod)
                ->with('success', 'Payroll marked as paid');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel payroll - delegates to PayRun if exists
     */
    public function cancel(Request $request, PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('cancel', $payrollPeriod);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $payRun = PayRun::where('payroll_period_id', $payrollPeriod->id)->first();

            if ($payRun) {
                $payRun = $this->payRunService->cancelPayRun($payRun, $validated['reason']);
                $this->auditService->logPayRunCancelled($payRun, auth()->user(), $validated['reason']);

                return redirect()
                    ->route('pay-runs.index')
                    ->with('success', 'Payroll cancelled');
            }

            $this->payrollService->cancelPayroll($payrollPeriod, $validated['reason']);

            return redirect()
                ->route('payroll.index')
                ->with('success', 'Payroll cancelled');
        } catch (\RuntimeException|\Exception $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Delete a payroll period
     */
    public function destroy(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('delete', $payrollPeriod);

        $payrollPeriod->delete();

        return redirect()
            ->route('payroll.index')
            ->with('success', 'Payroll period deleted successfully');
    }

    /**
     * Display employee's own payslips
     * Query Payslip model directly instead of using deprecated PayrollService method
     */
    public function myPayslips(Request $request): Response
    {
        Gate::authorize('viewOwn', Payslip::class);

        $user = $request->user();

        $payslips = Payslip::forUser($user->id)
            ->with(['payrollPeriod', 'shop'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Payroll/MyPayslips', [
            'payslips' => $payslips,
        ]);
    }

    /**
     * Display a specific payslip
     */
    public function showPayslip(Payslip $payslip): Response
    {
        Gate::authorize('view', $payslip);

        $payslip->load(['user', 'shop', 'payrollPeriod']);

        return Inertia::render('Payroll/Payslip', [
            'payslip' => $payslip,
        ]);
    }
}
