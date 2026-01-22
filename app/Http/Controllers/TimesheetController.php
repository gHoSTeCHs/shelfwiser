<?php

namespace App\Http\Controllers;

use App\Enums\TimesheetStatus;
use App\Models\Shop;
use App\Models\Timesheet;
use App\Services\TimesheetService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TimesheetController extends Controller
{
    public function __construct(
        private TimesheetService $timesheetService
    )
    {
    }

    /**
     * Display a listing of timesheets
     */
    public function index(Request $request): Response
    {
        Gate::authorize('timesheet.viewAny', Timesheet::class);

        $user = $request->user();
        $shopId = $request->input('shop_id');
        $status = $request->input('status');
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : now()->endOfMonth();

        $shop = $shopId ? Shop::findOrFail($shopId) : null;

        $timesheets = $this->timesheetService->getEmployeeTimesheets($user, $startDate, $endDate, $shop);

        if ($status) {
            $timesheets = $timesheets->where('status', TimesheetStatus::from($status));
        }

        $summary = $this->timesheetService->getTimesheetSummary($user, $startDate, $endDate);

        $activeTimesheet = $this->timesheetService->getActiveTimesheet($user, $shop ?? $user->shops()->first());

        return Inertia::render('Timesheets/Index', [
            'timesheets' => $timesheets,
            'summary' => $summary,
            'activeTimesheet' => $activeTimesheet,
            'filters' => [
                'shop_id' => $shopId,
                'status' => $status,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'shops' => $user->shops,
            'statusOptions' => collect(TimesheetStatus::cases())->map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ]),
        ]);
    }

    /**
     * Display timesheets awaiting approval
     */
    public function approvalQueue(Request $request): Response
    {
        $user = $request->user();
        $shopId = $request->input('shop_id');

        $shop = $shopId ? Shop::findOrFail($shopId) : null;

        $timesheets = $this->timesheetService->getTimesheetsForApproval($user, $shop);

        return Inertia::render('Timesheets/Approve', [
            'timesheets' => $timesheets,
            'filters' => [
                'shop_id' => $shopId,
            ],
            'shops' => $user->is_tenant_owner ? Shop::where('tenant_id', $user->tenant_id)->get() : $user->shops,
        ]);
    }

    /**
     * Display the specified timesheet
     */
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

    /**
     * Clock in an employee
     */
    public function clockIn(Request $request): RedirectResponse
    {
        Gate::authorize('clockInOut', auth()->user());

        $validated = $request->validate([
            'shop_id' => ['required', 'exists:shops,id'],
            'clock_in' => ['nullable', 'date'],
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);
        $clockInTime = isset($validated['clock_in']) ? Carbon::parse($validated['clock_in']) : null;

        try {
            $timesheet = $this->timesheetService->clockIn(
                $request->user(),
                $shop,
                $clockInTime
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

    /**
     * Clock out an employee
     */
    public function clockOut(Request $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('update', $timesheet);

        $validated = $request->validate([
            'clock_out' => ['nullable', 'date'],
        ]);

        $clockOutTime = isset($validated['clock_out']) ? Carbon::parse($validated['clock_out']) : null;

        try {
            $this->timesheetService->clockOut($timesheet, $clockOutTime);

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Clocked out successfully');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Start a break
     */
    public function startBreak(Request $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('manageBreaks', $timesheet);

        $validated = $request->validate([
            'break_start' => ['nullable', 'date'],
        ]);

        $breakStartTime = isset($validated['break_start']) ? Carbon::parse($validated['break_start']) : null;

        try {
            $this->timesheetService->startBreak($timesheet, $breakStartTime);

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Break started');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * End a break
     */
    public function endBreak(Request $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('manageBreaks', $timesheet);

        $validated = $request->validate([
            'break_end' => ['nullable', 'date'],
        ]);

        $breakEndTime = isset($validated['break_end']) ? Carbon::parse($validated['break_end']) : null;

        try {
            $this->timesheetService->endBreak($timesheet, $breakEndTime);

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Break ended');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Update timesheet notes
     */
    public function update(Request $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('update', $timesheet);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $timesheet->update($validated);

        return redirect()
            ->route('timesheets.show', $timesheet)
            ->with('success', 'Timesheet updated successfully');
    }

    /**
     * Submit timesheet for approval
     */
    public function submit(Request $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('submit', $timesheet);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->timesheetService->submitTimesheet($timesheet, $validated['notes'] ?? null);

            return redirect()
                ->route('timesheets.show', $timesheet)
                ->with('success', 'Timesheet submitted for approval');
        } catch (\RuntimeException $e) {
            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Approve a timesheet
     */
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

    /**
     * Reject a timesheet
     */
    public function reject(Request $request, Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('reject', $timesheet);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $this->timesheetService->rejectTimesheet(
                $timesheet,
                auth()->user(),
                $validated['rejection_reason']
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

    /**
     * Delete a timesheet
     */
    public function destroy(Timesheet $timesheet): RedirectResponse
    {
        Gate::authorize('delete', $timesheet);

        $timesheet->delete();

        return redirect()
            ->route('timesheets.index')
            ->with('success', 'Timesheet deleted successfully');
    }
}
