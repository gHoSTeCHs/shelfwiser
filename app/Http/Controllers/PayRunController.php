<?php

namespace App\Http\Controllers;

use App\Models\PayRun;
use App\Models\PayRunItem;
use App\Models\PayrollPeriod;
use App\Models\PayCalendar;
use App\Models\User;
use App\Services\PayRunService;
use App\Services\PayrollAuditService;
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

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PayRun::class);

        $tenantId = auth()->user()->tenant_id;

        $query = PayRun::forTenant($tenantId)
            ->with(['payrollPeriod:id,period_name,start_date,end_date', 'payCalendar:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->withStatus($request->status);
        }

        if ($request->filled('pay_calendar_id')) {
            $query->where('pay_calendar_id', $request->pay_calendar_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $payRuns = $query->paginate(15)->withQueryString();

        $summary = [
            'total' => PayRun::forTenant($tenantId)->count(),
            'pending_approval' => PayRun::forTenant($tenantId)->pendingApproval()->count(),
            'completed_this_month' => PayRun::forTenant($tenantId)
                ->completed()
                ->whereMonth('completed_at', now()->month)
                ->count(),
        ];

        $payCalendars = PayCalendar::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('PayRuns/Index', [
            'payRuns' => $payRuns,
            'summary' => $summary,
            'payCalendars' => $payCalendars,
            'filters' => $request->only(['status', 'pay_calendar_id', 'search']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', PayRun::class);

        $tenantId = auth()->user()->tenant_id;

        $periods = PayrollPeriod::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->orderByDesc('start_date')
            ->get(['id', 'period_name', 'start_date', 'end_date']);

        $payCalendars = PayCalendar::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'name', 'frequency']);

        $eligibleEmployeesCount = User::where('tenant_id', $tenantId)
            ->whereHas('employeePayrollDetail', function ($q) {
                $q->where('is_active', true);
            })
            ->count();

        return Inertia::render('PayRuns/Create', [
            'periods' => $periods,
            'payCalendars' => $payCalendars,
            'eligibleEmployeesCount' => $eligibleEmployeesCount,
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('create', PayRun::class);

        $validated = $request->validate([
            'payroll_period_id' => 'required|exists:payroll_periods,id',
            'pay_calendar_id' => 'nullable|exists:pay_calendars,id',
            'name' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $period = PayrollPeriod::findOrFail($validated['payroll_period_id']);

        $payRun = $this->payRunService->createPayRun($tenantId, $period, [
            'pay_calendar_id' => $validated['pay_calendar_id'] ?? null,
            'name' => $validated['name'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->auditService->logPayRunCreated($payRun, auth()->user());

        return redirect()->route('pay-runs.show', $payRun)
            ->with('success', 'Pay run created successfully.');
    }

    public function show(PayRun $payRun): Response
    {
        Gate::authorize('view', $payRun);

        $this->authorizePayRun($payRun);

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

        $summary = $this->payRunService->getPayRunSummary($payRun);

        return Inertia::render('PayRuns/Show', [
            'payRun' => $payRun,
            'summary' => $summary,
        ]);
    }

    public function calculate(PayRun $payRun)
    {
        Gate::authorize('calculate', $payRun);

        $this->authorizePayRun($payRun);

        try {
            $payRun = $this->payRunService->calculatePayRun($payRun);
            $this->auditService->logPayRunCalculated($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run calculated successfully.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to calculate: ' . $e->getMessage());
        }
    }

    public function recalculateItem(PayRun $payRun, PayRunItem $item)
    {
        Gate::authorize('calculate', $payRun);

        $this->authorizePayRun($payRun);

        if ($item->pay_run_id !== $payRun->id) {
            abort(404);
        }

        try {
            $item = $this->payRunService->recalculateItem($item);
            $this->auditService->logItemRecalculated($item, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Item recalculated successfully.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to recalculate: ' . $e->getMessage());
        }
    }

    public function submitForApproval(PayRun $payRun)
    {
        Gate::authorize('submit', $payRun);

        $this->authorizePayRun($payRun);

        try {
            $payRun = $this->payRunService->submitForApproval($payRun);
            $this->auditService->logPayRunSubmitted($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run submitted for approval.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to submit: ' . $e->getMessage());
        }
    }

    public function approve(PayRun $payRun)
    {
        Gate::authorize('approve', $payRun);

        $this->authorizePayRun($payRun);

        try {
            $payRun = $this->payRunService->approvePayRun($payRun);
            $this->auditService->logPayRunApproved($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run approved.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to approve: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, PayRun $payRun)
    {
        Gate::authorize('approve', $payRun);

        $this->authorizePayRun($payRun);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ], [
            'reason.required' => 'Please provide a reason for rejecting this pay run.',
            'reason.max' => 'The reason must not exceed 500 characters.',
        ]);

        try {
            $payRun = $this->payRunService->rejectPayRun($payRun, $validated['reason']);
            $this->auditService->logPayRunRejected($payRun, auth()->user(), $validated['reason']);

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run rejected and returned for review.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to reject: ' . $e->getMessage());
        }
    }

    public function complete(PayRun $payRun)
    {
        Gate::authorize('complete', $payRun);

        $this->authorizePayRun($payRun);

        try {
            $payRun = $this->payRunService->completePayRun($payRun);
            $this->auditService->logPayRunCompleted($payRun, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Pay run completed and payslips generated.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to complete: ' . $e->getMessage());
        }
    }

    public function cancel(Request $request, PayRun $payRun)
    {
        Gate::authorize('cancel', $payRun);

        $this->authorizePayRun($payRun);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $payRun = $this->payRunService->cancelPayRun($payRun, $validated['reason'] ?? null);
            $this->auditService->logPayRunCancelled($payRun, auth()->user(), $validated['reason'] ?? null);

            return redirect()->route('pay-runs.index')
                ->with('success', 'Pay run cancelled.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to cancel: ' . $e->getMessage());
        }
    }

    public function excludeEmployee(Request $request, PayRun $payRun, User $user)
    {
        Gate::authorize('update', $payRun);

        $this->authorizePayRun($payRun);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ], [
            'reason.max' => 'The reason must not exceed 500 characters.',
        ]);

        try {
            $this->payRunService->excludeEmployee($payRun, $user->id, $validated['reason'] ?? null);
            $this->auditService->logEmployeeExcluded($payRun, $user, auth()->user(), $validated['reason'] ?? null);

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Employee excluded from pay run.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to exclude: ' . $e->getMessage());
        }
    }

    public function includeEmployee(PayRun $payRun, User $user)
    {
        Gate::authorize('update', $payRun);

        $this->authorizePayRun($payRun);

        try {
            $this->payRunService->includeEmployee($payRun, $user->id);
            $this->auditService->logEmployeeIncluded($payRun, $user, auth()->user());

            return redirect()->route('pay-runs.show', $payRun)
                ->with('success', 'Employee re-included in pay run.');
        } catch (\Exception $e) {
            return redirect()->route('pay-runs.show', $payRun)
                ->with('error', 'Failed to include: ' . $e->getMessage());
        }
    }

    protected function authorizePayRun(PayRun $payRun): void
    {
        if ($payRun->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }
    }
}
