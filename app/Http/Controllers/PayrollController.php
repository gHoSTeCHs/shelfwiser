<?php

namespace App\Http\Controllers;

use App\Enums\PayrollStatus;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\Shop;
use App\Services\PayrollService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    public function __construct(
        private PayrollService $payrollService
    ) {}

    /**
     * Display a listing of payroll periods
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PayrollPeriod::class);

        $user = $request->user();
        $shopId = $request->input('shop_id');
        $status = $request->input('status');

        $statusEnum = $status ? PayrollStatus::from($status) : null;

        $payrollPeriods = $this->payrollService->getPayrollPeriods(
            $user->tenant_id,
            $shopId ? (int) $shopId : null,
            $statusEnum
        );

        return Inertia::render('Payroll/Index', [
            'payrollPeriods' => $payrollPeriods,
            'filters' => [
                'shop_id' => $shopId,
                'status' => $status,
            ],
            'shops' => $user->is_tenant_owner
                ? Shop::where('tenant_id', $user->tenant_id)->get()
                : $user->shops,
            'statusOptions' => collect(PayrollStatus::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new payroll period
     */
    public function create(): Response
    {
        Gate::authorize('create', PayrollPeriod::class);

        $user = auth()->user();

        return Inertia::render('Payroll/Create', [
            'shops' => $user->is_tenant_owner
                ? Shop::where('tenant_id', $user->tenant_id)->get()
                : $user->shops,
        ]);
    }

    /**
     * Store a newly created payroll period
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

        $payrollPeriod = $this->payrollService->createPayrollPeriod(
            $request->user()->tenant_id,
            $validated['shop_id'] ?? null,
            Carbon::parse($validated['start_date']),
            Carbon::parse($validated['end_date']),
            Carbon::parse($validated['payment_date']),
            $validated['period_name'] ?? null
        );

        return redirect()
            ->route('payroll.show', $payrollPeriod)
            ->with('success', 'Payroll period created successfully');
    }

    /**
     * Display the specified payroll period
     */
    public function show(PayrollPeriod $payrollPeriod): Response
    {
        Gate::authorize('view', $payrollPeriod);

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
     * Process payroll for a period
     */
    public function process(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('process', $payrollPeriod);

        try {
            $this->payrollService->processPayroll($payrollPeriod, auth()->user());

            return redirect()
                ->route('payroll.show', $payrollPeriod)
                ->with('success', 'Payroll processed successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Approve payroll
     */
    public function approve(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('approve', $payrollPeriod);

        try {
            $this->payrollService->approvePayroll($payrollPeriod, auth()->user());

            return redirect()
                ->route('payroll.show', $payrollPeriod)
                ->with('success', 'Payroll approved successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Mark payroll as paid
     */
    public function markAsPaid(PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('markAsPaid', $payrollPeriod);

        try {
            $this->payrollService->markAsPaid($payrollPeriod);

            return redirect()
                ->route('payroll.show', $payrollPeriod)
                ->with('success', 'Payroll marked as paid');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel payroll
     */
    public function cancel(Request $request, PayrollPeriod $payrollPeriod): RedirectResponse
    {
        Gate::authorize('cancel', $payrollPeriod);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->payrollService->cancelPayroll($payrollPeriod, $validated['reason']);

            return redirect()
                ->route('payroll.index')
                ->with('success', 'Payroll cancelled');
        } catch (\RuntimeException $e) {
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
     */
    public function myPayslips(Request $request): Response
    {
        $user = $request->user();

        $payslips = $this->payrollService->getEmployeePayslips($user);

        return Inertia::render('Payroll/MyPayslips', [
            'payslips' => $payslips,
        ]);
    }

    /**
     * Display a specific payslip
     */
    public function showPayslip(Payslip $payslip): Response
    {
        $user = auth()->user();

        if ($payslip->user_id !== $user->id && ! Gate::allows('view', $payslip->payrollPeriod)) {
            abort(403);
        }

        $payslip->load(['user', 'shop', 'payrollPeriod']);

        return Inertia::render('Payroll/Payslip', [
            'payslip' => $payslip,
        ]);
    }
}
