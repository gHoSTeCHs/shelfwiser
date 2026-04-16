<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelPayRunRequest;
use App\Http\Requests\ExcludeEmployeeRequest;
use App\Http\Requests\PayRunIndexRequest;
use App\Http\Requests\RejectPayRunRequest;
use App\Http\Requests\StorePayRunRequest;
use App\Models\PayrollPeriod;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\User;
use App\Services\PayrollAuditService;
use App\Services\PayRunService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayRunController extends Controller
{
    public function __construct(
        protected PayRunService $payRunService,
        protected PayrollAuditService $auditService
    ) {}

    public function index(PayRunIndexRequest $request): Response
    {
        Gate::authorize('viewAny', PayRun::class);

        $filters = $request->only(['status', 'pay_calendar_id', 'search']);

        return Inertia::render('PayRuns/Index', [
            'payRuns' => $this->payRunService->getFilteredPayRuns($filters)->withQueryString(),
            'summary' => $this->payRunService->getPayRunStats(),
            'payCalendars' => $this->payRunService->getActivePayCalendars(),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', PayRun::class);

        return Inertia::render('PayRuns/Create', [
            'periods' => $this->payRunService->getOpenPeriods(),
            'payCalendars' => $this->payRunService->getActivePayCalendars(),
            'eligibleEmployeesCount' => $this->payRunService->getEligibleEmployeesCount(),
        ]);
    }

    public function store(StorePayRunRequest $request): RedirectResponse
    {
        Gate::authorize('create', PayRun::class);

        $validated = $request->validated();
        $period = PayrollPeriod::query()->findOrFail($validated['payroll_period_id']);

        $payRun = $this->payRunService->createPayRun($request->user()->tenant_id, $period, [
            'pay_calendar_id' => $validated['pay_calendar_id'] ?? null,
            'name' => $validated['name'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->auditService->logPayRunCreated($payRun, $request->user());

        return redirect()->route('pay-runs.show', $payRun)
            ->with('success', 'Pay run created successfully.');
    }

    public function show(PayRun $payRun): Response
    {
        Gate::authorize('view', $payRun);

        $payRun->load([
            'payrollPeriod:id,period_name,start_date,end_date',
            'payCalendar:id,name',
            'items' => function ($q) {
                $q->with(['user:id,name,email', 'user.employeePayrollDetail:id,user_id,position_title,department']);
            },
            'calculatedBy:id,name',
            'approvedBy:id,name',
            'completedBy:id,name',
        ]);

        return Inertia::render('PayRuns/Show', [
            'payRun' => $payRun,
            'summary' => $this->payRunService->getPayRunSummary($payRun),
        ]);
    }

    public function calculate(PayRun $payRun): RedirectResponse
    {
        Gate::authorize('calculate', $payRun);

        try {
            $payRun = $this->payRunService->calculatePayRun($payRun, auth()->user());
            $this->auditService->logPayRunCalculated($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run calculated successfully.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to calculate: '.$e->getMessage());
        }
    }

    public function recalculateItem(PayRun $payRun, PayRunItem $item): RedirectResponse
    {
        Gate::authorize('calculate', $payRun);

        try {
            $item = $this->payRunService->recalculateItem($item);
            $this->auditService->logItemRecalculated($item, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Item recalculated successfully.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to recalculate: '.$e->getMessage());
        }
    }

    public function submitForApproval(PayRun $payRun): RedirectResponse
    {
        Gate::authorize('submit', $payRun);

        try {
            $payRun = $this->payRunService->submitForApproval($payRun);
            $this->auditService->logPayRunSubmitted($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run submitted for approval.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to submit: '.$e->getMessage());
        }
    }

    public function approve(PayRun $payRun): RedirectResponse
    {
        Gate::authorize('approve', $payRun);

        try {
            $payRun = $this->payRunService->approvePayRun($payRun, auth()->user());
            $this->auditService->logPayRunApproved($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run approved.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to approve: '.$e->getMessage());
        }
    }

    public function reject(RejectPayRunRequest $request, PayRun $payRun): RedirectResponse
    {
        Gate::authorize('approve', $payRun);

        try {
            $validated = $request->validated();
            $payRun = $this->payRunService->rejectPayRun($payRun, $validated['reason']);
            $this->auditService->logPayRunRejected($payRun, auth()->user(), $validated['reason']);

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run rejected and returned for review.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to reject: '.$e->getMessage());
        }
    }

    public function complete(PayRun $payRun): RedirectResponse
    {
        Gate::authorize('complete', $payRun);

        try {
            $payRun = $this->payRunService->completePayRun($payRun, auth()->user());
            $this->auditService->logPayRunCompleted($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run completed and payslips generated.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to complete: '.$e->getMessage());
        }
    }

    public function cancel(CancelPayRunRequest $request, PayRun $payRun): RedirectResponse
    {
        Gate::authorize('cancel', $payRun);

        try {
            $validated = $request->validated();
            $payRun = $this->payRunService->cancelPayRun($payRun, $validated['reason'] ?? null);
            $this->auditService->logPayRunCancelled($payRun, auth()->user(), $validated['reason'] ?? null);

            return redirect()->route('pay-runs.index')
                ->with('success', 'Pay run cancelled.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to cancel: '.$e->getMessage());
        }
    }

    public function excludeEmployee(ExcludeEmployeeRequest $request, PayRun $payRun, User $user): RedirectResponse
    {
        Gate::authorize('excludeEmployee', $payRun);

        try {
            $validated = $request->validated();
            $this->payRunService->excludeEmployee($payRun, $user->id, $validated['reason'] ?? null);
            $this->auditService->logEmployeeExcluded($payRun, $user, auth()->user(), $validated['reason'] ?? null);

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Employee excluded from pay run.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to exclude: '.$e->getMessage());
        }
    }

    public function includeEmployee(PayRun $payRun, User $user): RedirectResponse
    {
        Gate::authorize('includeEmployee', $payRun);

        try {
            $this->payRunService->includeEmployee($payRun, $user->id);
            $this->auditService->logEmployeeIncluded($payRun, $user, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Employee re-included in pay run.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to include: '.$e->getMessage());
        }
    }
}
