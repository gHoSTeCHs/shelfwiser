<?php

namespace App\Http\Controllers;

use App\DTOs\DateRange;
use App\Enums\WageAdvanceStatus;
use App\Http\Requests\ApproveWageAdvanceRequest;
use App\Http\Requests\CancelWageAdvanceRequest;
use App\Http\Requests\DisburseWageAdvanceRequest;
use App\Http\Requests\RecordWageAdvanceRepaymentRequest;
use App\Http\Requests\RejectWageAdvanceRequest;
use App\Http\Requests\StoreWageAdvanceRequest;
use App\Http\Requests\UpdateWageAdvanceRequest;
use App\Models\WageAdvance;
use App\Models\WageAdvanceRepayment;
use App\Services\WageAdvanceRepaymentService;
use App\Services\WageAdvanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WageAdvanceController extends Controller
{
    public function __construct(
        private WageAdvanceService $wageAdvanceService,
        private WageAdvanceRepaymentService $repaymentService
    ) {}

    /**
     * Display a listing of wage advances
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', WageAdvance::class);

        $user = $request->user();
        $dateRange = DateRange::fromRequest($request->only(['start_date', 'end_date']), 'start_date', 'end_date');
        $status = $request->input('status');
        $statusEnum = $status ? WageAdvanceStatus::from($status) : null;

        $wageAdvances = $this->wageAdvanceService->getUserAdvances(
            $user,
            $statusEnum,
            $dateRange->start,
            $dateRange->end
        );

        $statistics = $this->wageAdvanceService->getStatistics(
            $user->tenant_id,
            null,
            $dateRange->start,
            $dateRange->end
        );

        $shop = $user->shops()->first();
        $eligibility = $shop ? $this->wageAdvanceService->calculateEligibility($user, $shop) : null;

        return Inertia::render('WageAdvances/Index', [
            'wageAdvances' => $wageAdvances,
            'statistics' => $statistics,
            'eligibility' => $eligibility,
            'filters' => [
                'status' => $status,
                'start_date' => $dateRange->start->toDateString(),
                'end_date' => $dateRange->end->toDateString(),
            ],
            'statusOptions' => collect(WageAdvanceStatus::cases())->map(fn ($case) => [
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
        Gate::authorize('viewAny', WageAdvance::class);

        $user = $request->user();
        $shopId = $request->input('shop_id');

        $wageAdvances = $this->wageAdvanceService->getAdvancesForApproval($user, $shopId ? (int) $shopId : null);

        return Inertia::render('WageAdvances/Approve', [
            'wageAdvances' => $wageAdvances,
            'filters' => [
                'shop_id' => $shopId,
            ],
            'shops' => $this->wageAdvanceService->getShopsForApprovalQueue($user),
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

        if (! $shop) {
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
    public function store(StoreWageAdvanceRequest $request): RedirectResponse
    {
        Gate::authorize('create', WageAdvance::class);

        try {
            $wageAdvance = $this->wageAdvanceService->create(
                $request->user(),
                $request->validated()['shop_id'],
                $request->validated()
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

        $repayments = $this->repaymentService->getRepayments($wageAdvance);
        $repaymentStatistics = $this->repaymentService->getRepaymentStatistics($wageAdvance);
        $repaymentSchedule = $this->repaymentService->calculateRepaymentSchedule($wageAdvance);

        return Inertia::render('WageAdvances/Show', [
            'wageAdvance' => $wageAdvance,
            'remainingBalance' => $wageAdvance->getRemainingBalance(),
            'installmentAmount' => $wageAdvance->getInstallmentAmount(),
            'repayments' => $repayments,
            'repaymentStatistics' => $repaymentStatistics,
            'repaymentSchedule' => $repaymentSchedule,
            'canUpdate' => Gate::allows('update', $wageAdvance),
            'canApprove' => Gate::allows('approve', $wageAdvance),
            'canReject' => Gate::allows('reject', $wageAdvance),
            'canDisburse' => Gate::allows('disburse', $wageAdvance),
            'canRecordRepayment' => Gate::allows('recordRepayment', $wageAdvance),
            'canDeleteRepayment' => Gate::allows('deleteRepayment', $wageAdvance),
            'canCancel' => Gate::allows('cancel', $wageAdvance),
            'canDelete' => Gate::allows('delete', $wageAdvance),
        ]);
    }

    /**
     * Update wage advance reason
     */
    public function update(UpdateWageAdvanceRequest $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('update', $wageAdvance);

        $this->wageAdvanceService->updateReason($wageAdvance, $request->validated()['reason'] ?? null);

        return redirect()
            ->route('wage-advances.show', $wageAdvance)
            ->with('success', 'Wage advance updated successfully');
    }

    /**
     * Approve a wage advance
     */
    public function approve(ApproveWageAdvanceRequest $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('approve', $wageAdvance);

        try {
            $validated = $request->validated();

            $this->wageAdvanceService->approve(
                $wageAdvance,
                $request->user(),
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
    public function reject(RejectWageAdvanceRequest $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('reject', $wageAdvance);

        try {
            $this->wageAdvanceService->reject(
                $wageAdvance,
                $request->user(),
                $request->validated()['rejection_reason']
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
    public function disburse(DisburseWageAdvanceRequest $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('disburse', $wageAdvance);

        try {
            $validated = $request->validated();

            $this->wageAdvanceService->disburse(
                $wageAdvance,
                $request->user(),
                $validated['repayment_start_date'] ?? null,
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
    public function recordRepayment(RecordWageAdvanceRepaymentRequest $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('recordRepayment', $wageAdvance);

        try {
            $this->repaymentService->recordRepayment(
                $wageAdvance,
                $request->user(),
                $request->validated()
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
     * Delete a repayment record
     */
    public function deleteRepayment(WageAdvance $wageAdvance, WageAdvanceRepayment $repayment): RedirectResponse
    {
        Gate::authorize('deleteRepayment', $wageAdvance);

        if ($repayment->wage_advance_id !== $wageAdvance->id) {
            abort(403, 'Repayment does not belong to this wage advance');
        }

        try {
            $this->repaymentService->deleteRepayment($repayment, auth()->user());

            return redirect()
                ->route('wage-advances.show', $wageAdvance)
                ->with('success', 'Repayment deleted successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel a wage advance
     */
    public function cancel(CancelWageAdvanceRequest $request, WageAdvance $wageAdvance): RedirectResponse
    {
        Gate::authorize('cancel', $wageAdvance);

        try {
            $this->wageAdvanceService->cancel(
                $wageAdvance,
                $request->user(),
                $request->validated()['reason']
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
