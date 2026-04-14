<?php

namespace App\Http\Controllers;

use App\DTOs\DateRange;
use App\Enums\TimesheetStatus;
use App\Http\Requests\ClockInRequest;
use App\Http\Requests\ClockOutRequest;
use App\Http\Requests\EndBreakRequest;
use App\Http\Requests\RejectTimesheetRequest;
use App\Http\Requests\StartBreakRequest;
use App\Http\Requests\SubmitTimesheetRequest;
use App\Http\Requests\TimesheetIndexRequest;
use App\Http\Requests\UpdateTimesheetRequest;
use App\Models\Shop;
use App\Models\Timesheet;
use App\Services\TimesheetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TimesheetController extends Controller
{
    public function __construct(
        private TimesheetService $timesheetService
    ) {}

    public function index(TimesheetIndexRequest $request): Response
    {
        Gate::authorize('timesheet.viewAny', Timesheet::class);

        $user = $request->user();
        $shopId = $request->input('shop_id');
        $status = $request->input('status');
        $dateRange = DateRange::fromRequest(
            $request->only(['start_date', 'end_date']),
            fromKey: 'start_date',
            toKey: 'end_date',
        );

        $shop = $shopId ? Shop::query()->findOrFail($shopId) : null;

        $timesheets = $this->timesheetService->getEmployeeTimesheets($user, $dateRange->start, $dateRange->end, $shop);
        $displayTimesheets = $status
            ? $timesheets->where('status', TimesheetStatus::from($status))
            : $timesheets;

        return Inertia::render('Timesheets/Index', [
            'timesheets' => $displayTimesheets,
            'summary' => $this->timesheetService->getTimesheetSummary($timesheets, $user, $dateRange->start, $dateRange->end),
            'activeTimesheet' => $this->timesheetService->getActiveTimesheet($user, $shop ?? $user->shops()->first()),
            'filters' => [
                'shop_id' => $shopId,
                'status' => $status,
                'start_date' => $dateRange->start->toDateString(),
                'end_date' => $dateRange->end->toDateString(),
            ],
            'shops' => $user->shops,
            'statusOptions' => collect(TimesheetStatus::cases())->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    public function approvalQueue(TimesheetIndexRequest $request): Response
    {
        Gate::authorize('timesheet.viewAny', Timesheet::class);

        $user = $request->user();
        $shopId = $request->input('shop_id');

        $shop = $shopId ? Shop::query()->findOrFail($shopId) : null;

        return Inertia::render('Timesheets/Approve', [
            'timesheets' => $this->timesheetService->getTimesheetsForApproval($user, $shop),
            'filters' => [
                'shop_id' => $shopId,
            ],
            'shops' => $user->is_tenant_owner ? Shop::query()->get() : $user->shops,
        ]);
    }

    public function show(Timesheet $timesheet): Response
    {
        Gate::authorize('view', $timesheet);

        $timesheet->load(['user', 'shop', 'approvedBy']);

        return Inertia::render('Timesheets/Show', [
            'timesheet' => $timesheet,
            'canEdit' => Gate::allows('update', $timesheet),
            'canSubmit' => Gate::allows('submit', $timesheet),
            'canApprove' => Gate::allows('approve', $timesheet),
            'canDelete' => Gate::allows('delete', $timesheet),
        ]);
    }

    public function clockIn(ClockInRequest $request): RedirectResponse
    {
        Gate::authorize('clockInOut', auth()->user());

        $validated = $request->validated();
        $shop = Shop::query()->findOrFail($validated['shop_id']);

        try {
            $timesheet = $this->timesheetService->clockIn(
                employee: $request->user(),
                shop: $shop,
                dateTime: $validated['clock_in'] ?? null,
            );

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Clocked in successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function clockOut(ClockOutRequest $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('update', $timesheet);

        $validated = $request->validated();

        try {
            $this->timesheetService->clockOut(
                timesheet: $timesheet,
                dateTime: $validated['clock_out'] ?? null,
            );

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Clocked out successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function startBreak(StartBreakRequest $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('manageBreaks', $timesheet);

        $validated = $request->validated();

        try {
            $this->timesheetService->startBreak(
                timesheet: $timesheet,
                dateTime: $validated['break_start'] ?? null,
            );

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Break started');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function endBreak(EndBreakRequest $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('manageBreaks', $timesheet);

        $validated = $request->validated();

        try {
            $this->timesheetService->endBreak(
                timesheet: $timesheet,
                dateTime: $validated['break_end'] ?? null,
            );

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Break ended');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function update(UpdateTimesheetRequest $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('update', $timesheet);

        $this->timesheetService->updateTimesheet($timesheet, $request->validated());

        return redirect()
            ->route('timesheets.show', $timesheet)
            ->with('success', 'Timesheet updated successfully');
    }

    public function submit(SubmitTimesheetRequest $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('submit', $timesheet);

        try {
            $this->timesheetService->submitTimesheet($timesheet, $request->validated('notes'));

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Timesheet submitted for approval');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function approve(Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('approve', $timesheet);

        try {
            $this->timesheetService->approveTimesheet($timesheet, auth()->user());

            return redirect()
                ->route('timesheets.approval-queue')
                ->with('success', 'Timesheet approved successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function reject(RejectTimesheetRequest $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('reject', $timesheet);

        try {
            $this->timesheetService->rejectTimesheet(
                timesheet: $timesheet,
                approver: auth()->user(),
                reason: $request->validated('rejection_reason'),
            );

            return redirect()
                ->route('timesheets.approval-queue')
                ->with('success', 'Timesheet rejected');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    public function destroy(Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('delete', $timesheet);

        $timesheet->delete();

        return redirect()
            ->route('timesheets.index')
            ->with('success', 'Timesheet deleted successfully');
    }
}
