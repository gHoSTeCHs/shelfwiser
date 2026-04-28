<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelPayRunRequest;
use App\Http\Requests\ExcludeEmployeeRequest;
use App\Http\Requests\PayRunIndexRequest;
use App\Http\Requests\RejectPayRunRequest;
use App\Http\Requests\StorePayRunRequest;
use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\User;
use App\Services\PayrollAuditService;
use App\Services\PayRunService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $filters = $request->validated();

        return Inertia::render('PayRuns/Index', [
            'payRuns' => $this->payRunService->getFilteredPayRuns($filters)->withQueryString(),
            'summary' => $this->payRunService->getPayRunStats($request->user()->tenant_id),
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

        $payRun = $this->payRunService->createPayRun($request->user()->tenant_id, $validated['payroll_period_id'], [
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

        $payRun->loadShowRelations();

        return Inertia::render('PayRuns/Show', [
            'payRun' => $payRun,
            'summary' => $this->payRunService->getPayRunSummary($payRun),
        ]);
    }

    public function calculate(Request $request, PayRun $payRun): RedirectResponse
    {
        Gate::authorize('calculate', $payRun);

        try {
            $payRun = $this->payRunService->calculatePayRun($payRun, $request->user());
            $this->auditService->logPayRunCalculated($payRun, $request->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run calculated successfully.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to calculate: '.$e->getMessage());
        }
    }

    public function recalculateItem(Request $request, PayRun $payRun, PayRunItem $item): RedirectResponse
    {
        Gate::authorize('calculate', $payRun);
        abort_unless($item->pay_run_id === $payRun->id, 404);

        try {
            $item = $this->payRunService->recalculateItem($item);
            $this->auditService->logItemRecalculated($item, $request->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Item recalculated successfully.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to recalculate: '.$e->getMessage());
        }
    }

    public function submitForApproval(Request $request, PayRun $payRun): RedirectResponse
    {
        Gate::authorize('submit', $payRun);

        try {
            $payRun = $this->payRunService->submitForApproval($payRun);
            $this->auditService->logPayRunSubmitted($payRun, $request->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run submitted for approval.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to submit: '.$e->getMessage());
        }
    }

    public function approve(Request $request, PayRun $payRun): RedirectResponse
    {
        Gate::authorize('approve', $payRun);

        try {
            $payRun = $this->payRunService->approvePayRun($payRun, $request->user());
            $this->auditService->logPayRunApproved($payRun, $request->user());

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
            $this->auditService->logPayRunRejected($payRun, $request->user(), $validated['reason']);

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run rejected and returned for review.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to reject: '.$e->getMessage());
        }
    }

    public function complete(Request $request, PayRun $payRun): RedirectResponse
    {
        Gate::authorize('complete', $payRun);

        try {
            $payRun = $this->payRunService->completePayRun($payRun, $request->user());
            $this->auditService->logPayRunCompleted($payRun, $request->user());

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
            $this->auditService->logPayRunCancelled($payRun, $request->user(), $validated['reason'] ?? null);

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

        abort_unless($payRun->items()->where('user_id', $user->id)->exists(), 404);

        try {
            $validated = $request->validated();
            $this->payRunService->excludeEmployee($payRun, $user->id, $validated['reason'] ?? null);
            $this->auditService->logEmployeeExcluded($payRun, $user, $request->user(), $validated['reason'] ?? null);

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Employee excluded from pay run.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to exclude: '.$e->getMessage());
        }
    }

    public function includeEmployee(Request $request, PayRun $payRun, User $user): RedirectResponse
    {
        Gate::authorize('includeEmployee', $payRun);

        abort_unless($payRun->items()->where('user_id', $user->id)->exists(), 404);

        try {
            $this->payRunService->includeEmployee($payRun, $user->id);
            $this->auditService->logEmployeeIncluded($payRun, $user, $request->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Employee re-included in pay run.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to include: '.$e->getMessage());
        }
    }
}
