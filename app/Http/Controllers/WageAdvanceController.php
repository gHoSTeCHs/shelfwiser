<?php

namespace App\Http\Controllers;

use App\Enums\WageAdvanceStatus;
use App\Models\Shop;
use App\Models\WageAdvance;
use App\Services\WageAdvanceService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WageAdvanceController extends Controller
{
    public function __construct(
        private WageAdvanceService $wageAdvanceService
    ) {}

    /**
     * Display a listing of wage advances
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', WageAdvance::class);

        $user = $request->user();
        $status = $request->input('status');
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : now()->endOfMonth();

        $statusEnum = $status ? WageAdvanceStatus::from($status) : null;

        $wageAdvances = $this->wageAdvanceService->getUserAdvances(
            $user,
            $statusEnum,
            $startDate,
            $endDate
        );

        $statistics = $this->wageAdvanceService->getStatistics(
            $user->tenant_id,
            null,
            $startDate,
            $endDate
        );

        $shop = $user->shops()->first();
        $eligibility = $shop ? $this->wageAdvanceService->calculateEligibility($user, $shop) : null;

        return Inertia::render('WageAdvances/Index', [
            'wageAdvances' => $wageAdvances,
            'statistics' => $statistics,
            'eligibility' => $eligibility,
            'filters' => [
                'status' => $status,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'statusOptions' => collect(WageAdvanceStatus::cases())->map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    /**
     * Display pending wage advances awaiting approval
     */
    public function approvalQueue(Request $request): Response
    {
        $user = $request->user();
        $shopId = $request->input('shop_id');

        $shop = $shopId ? Shop::findOrFail($shopId) : null;

        $wageAdvances = $this->wageAdvanceService->getAdvancesForApproval($user, $shop);

        return Inertia::render('WageAdvances/Approve', [
            'wageAdvances' => $wageAdvances,
            'filters' => [
                'shop_id' => $shopId,
            ],
            'shops' => $user->is_tenant_owner ? Shop::where('tenant_id', $user->tenant_id)->get() : $user->shops,
        ]);
    }

    /**
     * Show the form for creating a new wage advance
     */
    public function create(): Response
    {
        Gate::authorize('create', WageAdvance::class);

        $user = auth()->user();
        $shop = $user->shops()->first();

        if (!$shop) {
            abort(403, 'You must be assigned to a shop to request a wage advance');
        }

        $eligibility = $this->wageAdvanceService->calculateEligibility($user, $shop);

        return Inertia::render('WageAdvances/Create', [
            'eligibility' => $eligibility,
            'shop' => $shop,
        ]);
    }

    /**
     * Store a newly created wage advance
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', WageAdvance::class);

        $validated = $request->validate([
            'shop_id' => ['required', 'exists:shops,id'],
            'amount_requested' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:500'],
            'repayment_installments' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);

        try {
            $wageAdvance = $this->wageAdvanceService->create(
                $request->user(),
                $shop,
                $validated
            );

            return redirect()
                ->route('wage-advances.show', $wageAdvance)
                ->with('success', 'Wage advance request submitted successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified wage advance
     */
    public function show(WageAdvance $wageAdvance): Response
    {
        Gate::authorize('view', $wageAdvance);

        $wageAdvance->load(['user', 'shop', 'approvedBy', 'disbursedBy']);

        return Inertia::render('WageAdvances/Show', [
            'wageAdvance' => $wageAdvance,
            'remainingBalance' => $wageAdvance->getRemainingBalance(),
            'installmentAmount' => $wageAdvance->getInstallmentAmount(),
            'canUpdate' => Gate::allows('update', $wageAdvance),
            'canApprove' => Gate::allows('approve', $wageAdvance),
            'canReject' => Gate::allows('reject', $wageAdvance),
            'canDisburse' => Gate::allows('disburse', $wageAdvance),
            'canRecordRepayment' => Gate::allows('recordRepayment', $wageAdvance),
            'canCancel' => Gate::allows('cancel', $wageAdvance),
            'canDelete' => Gate::allows('delete', $wageAdvance),
        ]);
    }

    /**
     * Update wage advance reason
     */
    public function update(Request $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('update', $wageAdvance);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $wageAdvance->update($validated);

        return redirect()
            ->route('wage-advances.show', $wageAdvance)
            ->with('success', 'Wage advance updated successfully');
    }

    /**
     * Approve a wage advance
     */
    public function approve(Request $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('approve', $wageAdvance);

        $validated = $request->validate([
            'amount_approved' => ['nullable', 'numeric', 'min:0.01'],
            'repayment_installments' => ['nullable', 'integer', 'min:1', 'max:12'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->wageAdvanceService->approve(
                $wageAdvance,
                auth()->user(),
                $validated['amount_approved'] ?? null,
                $validated['repayment_installments'] ?? null,
                $validated['notes'] ?? null
            );

            return redirect()
                ->route('wage-advances.approval-queue')
                ->with('success', 'Wage advance approved successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Reject a wage advance
     */
    public function reject(Request $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('reject', $wageAdvance);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->wageAdvanceService->reject(
                $wageAdvance,
                auth()->user(),
                $validated['rejection_reason']
            );

            return redirect()
                ->route('wage-advances.approval-queue')
                ->with('success', 'Wage advance rejected');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Disburse approved wage advance
     */
    public function disburse(Request $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('disburse', $wageAdvance);

        $validated = $request->validate([
            'repayment_start_date' => ['nullable', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $repaymentDate = isset($validated['repayment_start_date'])
                ? Carbon::parse($validated['repayment_start_date'])
                : null;

            $this->wageAdvanceService->disburse(
                $wageAdvance,
                auth()->user(),
                $repaymentDate,
                $validated['notes'] ?? null
            );

            return redirect()
                ->route('wage-advances.show', $wageAdvance)
                ->with('success', 'Wage advance disbursed successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Record a repayment installment
     */
    public function recordRepayment(Request $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('recordRepayment', $wageAdvance);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        try {
            $this->wageAdvanceService->recordRepayment(
                $wageAdvance,
                $validated['amount']
            );

            return redirect()
                ->route('wage-advances.show', $wageAdvance)
                ->with('success', 'Repayment recorded successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel a wage advance
     */
    public function cancel(Request $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('cancel', $wageAdvance);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->wageAdvanceService->cancel(
                $wageAdvance,
                auth()->user(),
                $validated['reason']
            );

            return redirect()
                ->route('wage-advances.show', $wageAdvance)
                ->with('success', 'Wage advance cancelled');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Delete a wage advance
     */
    public function destroy(WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('delete', $wageAdvance);

        $wageAdvance->delete();

        return redirect()
            ->route('wage-advances.index')
            ->with('success', 'Wage advance deleted successfully');
    }
}
