<?php

namespace App\Http\Controllers;

use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use App\Models\FundRequest;
use App\Models\Shop;
use App\Services\FundRequestService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FundRequestController extends Controller
{
    public function __construct(
        private FundRequestService $fundRequestService
    ) {}

    /**
     * Display a listing of fund requests
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', FundRequest::class);

        $user = $request->user();
        $shopId = $request->input('shop_id');
        $status = $request->input('status');
        $type = $request->input('type');
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : now()->endOfMonth();

        $shop = $shopId ? Shop::findOrFail($shopId) : null;
        $statusEnum = $status ? FundRequestStatus::from($status) : null;
        $typeEnum = $type ? FundRequestType::from($type) : null;

        $fundRequests = $this->fundRequestService->getUserRequests(
            $user,
            $statusEnum,
            $shop,
            $startDate,
            $endDate
        );

        if ($typeEnum) {
            $fundRequests = $fundRequests->where('request_type', $typeEnum);
        }

        $statistics = $this->fundRequestService->getStatistics(
            $user->tenant_id,
            $shop,
            $startDate,
            $endDate
        );

        return Inertia::render('FundRequests/Index', [
            'fundRequests' => $fundRequests,
            'statistics' => $statistics,
            'filters' => [
                'shop_id' => $shopId,
                'status' => $status,
                'type' => $type,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'shops' => $user->shops,
            'statusOptions' => collect(FundRequestStatus::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
            'typeOptions' => collect(FundRequestType::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    /**
     * Display pending requests awaiting approval
     */
    public function approvalQueue(Request $request): Response
    {
        $user = $request->user();
        $shopId = $request->input('shop_id');

        $shop = $shopId ? Shop::findOrFail($shopId) : null;

        $fundRequests = $this->fundRequestService->getRequestsForApproval($user, $shop);

        return Inertia::render('FundRequests/Approve', [
            'fundRequests' => $fundRequests,
            'filters' => [
                'shop_id' => $shopId,
            ],
            'shops' => $user->is_tenant_owner ? Shop::where('tenant_id', $user->tenant_id)->get() : $user->shops,
        ]);
    }

    /**
     * Show the form for creating a new fund request
     */
    public function create(): Response
    {
        Gate::authorize('create', FundRequest::class);

        return Inertia::render('FundRequests/Create', [
            'shops' => auth()->user()->shops,
            'requestTypes' => collect(FundRequestType::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
                'icon' => $case->icon(),
            ]),
        ]);
    }

    /**
     * Store a newly created fund request
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', FundRequest::class);

        $validated = $request->validate([
            'shop_id' => ['required', 'exists:shops,id'],
            'request_type' => ['required', Rule::enum(FundRequestType::class)],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:1000'],
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);

        try {
            $fundRequest = $this->fundRequestService->create(
                $request->user(),
                $shop,
                $validated
            );

            return redirect()
                ->route('fund-requests.show', $fundRequest)
                ->with('success', 'Fund request submitted successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified fund request
     */
    public function show(FundRequest $fundRequest): Response
    {
        Gate::authorize('view', $fundRequest);

        $fundRequest->load(['user', 'shop', 'approvedBy', 'disbursedBy']);

        return Inertia::render('FundRequests/Show', [
            'fundRequest' => $fundRequest,
            'canUpdate' => Gate::allows('update', $fundRequest),
            'canApprove' => Gate::allows('approve', $fundRequest),
            'canReject' => Gate::allows('reject', $fundRequest),
            'canDisburse' => Gate::allows('disburse', $fundRequest),
            'canCancel' => Gate::allows('cancel', $fundRequest),
            'canDelete' => Gate::allows('delete', $fundRequest),
        ]);
    }

    /**
     * Update fund request description
     */
    public function update(Request $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('update', $fundRequest);

        $validated = $request->validate([
            'description' => ['required', 'string', 'max:1000'],
        ]);

        $fundRequest->update($validated);

        return redirect()
            ->route('fund-requests.show', $fundRequest)
            ->with('success', 'Fund request updated successfully');
    }

    /**
     * Approve a fund request
     */
    public function approve(Request $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('approve', $fundRequest);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->fundRequestService->approve(
                $fundRequest,
                auth()->user(),
                $validated['notes'] ?? null
            );

            return redirect()
                ->route('fund-requests.approval-queue')
                ->with('success', 'Fund request approved successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Reject a fund request
     */
    public function reject(Request $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('reject', $fundRequest);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->fundRequestService->reject(
                $fundRequest,
                auth()->user(),
                $validated['rejection_reason']
            );

            return redirect()
                ->route('fund-requests.approval-queue')
                ->with('success', 'Fund request rejected');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Disburse approved funds
     */
    public function disburse(Request $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('disburse', $fundRequest);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->fundRequestService->disburse(
                $fundRequest,
                auth()->user(),
                $validated['notes'] ?? null
            );

            return redirect()
                ->route('fund-requests.show', $fundRequest)
                ->with('success', 'Funds disbursed successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel a fund request
     */
    public function cancel(Request $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('cancel', $fundRequest);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->fundRequestService->cancel(
                $fundRequest,
                auth()->user(),
                $validated['reason']
            );

            return redirect()
                ->route('fund-requests.show', $fundRequest)
                ->with('success', 'Fund request cancelled');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Delete a fund request
     */
    public function destroy(FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('delete', $fundRequest);

        $fundRequest->delete();

        return redirect()
            ->route('fund-requests.index')
            ->with('success', 'Fund request deleted successfully');
    }
}
