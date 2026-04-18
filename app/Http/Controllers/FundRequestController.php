<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApproveFundRequestRequest;
use App\Http\Requests\ApprovalQueueFundRequestRequest;
use App\Http\Requests\CancelFundRequestRequest;
use App\Http\Requests\DisburseFundRequestRequest;
use App\Http\Requests\IndexFundRequestRequest;
use App\Http\Requests\RejectFundRequestRequest;
use App\Http\Requests\StoreFundRequestRequest;
use App\Http\Requests\UpdateFundRequestRequest;
use App\Enums\FundRequestType;
use App\Enums\UserRole;
use App\Models\FundRequest;
use App\Models\Shop;
use App\Services\FundRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FundRequestController extends Controller
{
    public function __construct(
        private FundRequestService $fundRequestService
    ) {}

    public function index(IndexFundRequestRequest $request): Response
    {
        Gate::authorize('viewAny', FundRequest::class);

        $user = $request->user();
        $shop = $request->shopId() ? Shop::query()->findOrFail($request->shopId()) : null;
        $dateRange = $request->dateRange();

        return Inertia::render('FundRequests/Index', [
            'fundRequests' => $this->fundRequestService->getUserRequests(
                user: $user,
                status: $request->status(),
                shop: $shop,
                startDate: $dateRange->start,
                endDate: $dateRange->end,
                type: $request->type(),
            ),
            'statistics' => $this->fundRequestService->getStatistics(
                tenantId: $user->tenant_id,
                shop: $shop,
                startDate: $dateRange->start,
                endDate: $dateRange->end,
                shopIds: $shop === null && $user->role->level() < UserRole::GENERAL_MANAGER->level()
                    ? $user->shops->pluck('id')->toArray()
                    : null,
            ),
            'filters' => [
                'shop_id' => $request->shopId(),
                'status' => $request->validated('status'),
                'type' => $request->validated('type'),
                'start_date' => $dateRange->start->toDateString(),
                'end_date' => $dateRange->end->toDateString(),
            ],
            'shops' => $user->shops,
            'statusOptions' => collect(\App\Enums\FundRequestStatus::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
            'typeOptions' => collect(\App\Enums\FundRequestType::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    public function approvalQueue(ApprovalQueueFundRequestRequest $request): Response
    {
        Gate::authorize('viewAny', FundRequest::class);

        $user = $request->user();
        $shop = $request->shopId() ? Shop::query()->findOrFail($request->shopId()) : null;

        return Inertia::render('FundRequests/Approve', [
            'fundRequests' => $this->fundRequestService->getRequestsForApproval($user, $shop),
            'filters' => [
                'shop_id' => $request->shopId(),
            ],
            'shops' => $user->is_tenant_owner
                ? Shop::query()->where('is_active', true)->get(['id', 'name', 'slug'])
                : $user->shops,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', FundRequest::class);

        return Inertia::render('FundRequests/Create', [
            'shops' => $request->user()->shops,
            'requestTypes' => collect(FundRequestType::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
                'icon' => $case->icon(),
            ]),
        ]);
    }

    public function store(StoreFundRequestRequest $request): RedirectResponse
    {
        Gate::authorize('create', FundRequest::class);

        $shop = Shop::query()->findOrFail($request->validated('shop_id'));

        try {
            $fundRequest = $this->fundRequestService->create(
                $request->user(),
                $shop,
                $request->validated()
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

    public function update(UpdateFundRequestRequest $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('update', $fundRequest);

        $this->fundRequestService->updateDescription($fundRequest, $request->validated('description'));

        return redirect()
            ->route('fund-requests.show', $fundRequest)
            ->with('success', 'Fund request updated successfully');
    }

    public function approve(ApproveFundRequestRequest $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('approve', $fundRequest);

        try {
            $this->fundRequestService->approve(
                $fundRequest,
                $request->user(),
                $request->validated('notes')
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

    public function reject(RejectFundRequestRequest $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('reject', $fundRequest);

        try {
            $this->fundRequestService->reject(
                $fundRequest,
                $request->user(),
                $request->validated('rejection_reason')
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

    public function disburse(DisburseFundRequestRequest $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('disburse', $fundRequest);

        try {
            $this->fundRequestService->disburse(
                $fundRequest,
                $request->user(),
                $request->validated('notes')
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

    public function cancel(CancelFundRequestRequest $request, FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('cancel', $fundRequest);

        try {
            $this->fundRequestService->cancel(
                $fundRequest,
                $request->user(),
                $request->validated('reason')
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

    public function destroy(FundRequest $fundRequest): RedirectResponse
    {
        Gate::authorize('delete', $fundRequest);

        $fundRequest->delete();

        return redirect()
            ->route('fund-requests.index')
            ->with('success', 'Fund request deleted successfully');
    }
}
