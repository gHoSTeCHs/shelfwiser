<?php

namespace App\Services;

use App\Enums\TimesheetStatus;
use App\Models\Shop;
use App\Models\Timesheet;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TimesheetService
{
    /**
     * Clock in an employee for a shift
     */
    public function clockIn(User $employee, Shop $shop, ?Carbon $dateTime = null): Timesheet
    {
        $dateTime = $dateTime ?? now();
        $date = $dateTime->toDateString();

        return DB::transaction(function () use ($employee, $shop, $dateTime, $date) {
            $existingTimesheet = Timesheet::where('user_id', $employee->id)
                ->where('shop_id', $shop->id)
                ->where('date', $date)
                ->where('status', TimesheetStatus::DRAFT)
                ->first();

            if ($existingTimesheet && $existingTimesheet->isClockedIn()) {
                throw new \RuntimeException('Employee is already clocked in for this shift');
            }

            $timesheet = $existingTimesheet ?? Timesheet::create([
                'user_id' => $employee->id,
                'shop_id' => $shop->id,
                'tenant_id' => $employee->tenant_id,
                'date' => $date,
                'status' => TimesheetStatus::DRAFT,
            ]);

            $timesheet->update([
                'clock_in' => $dateTime,
                'clock_out' => null,
                'break_start' => null,
                'break_end' => null,
                'break_duration_minutes' => 0,
            ]);

            $this->clearTimesheetCache($employee->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * Clock out an employee and calculate hours
     */
    public function clockOut(Timesheet $timesheet, ?Carbon $dateTime = null): Timesheet
    {
        $dateTime = $dateTime ?? now();

        if (!$timesheet->isClockedIn()) {
            throw new \RuntimeException('Employee is not currently clocked in');
        }

        if ($timesheet->isOnBreak()) {
            throw new \RuntimeException('Employee is currently on break. End break before clocking out');
        }

        return DB::transaction(function () use ($timesheet, $dateTime) {
            $timesheet->update(['clock_out' => $dateTime]);

            $hours = $this->calculateHours($timesheet);

            $timesheet->update([
                'regular_hours' => $hours['regular'],
                'overtime_hours' => $hours['overtime'],
                'total_hours' => $hours['total'],
            ]);

            $this->clearTimesheetCache($timesheet->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * Start a break period
     */
    public function startBreak(Timesheet $timesheet, ?Carbon $dateTime = null): Timesheet
    {
        $dateTime = $dateTime ?? now();

        if (!$timesheet->isClockedIn()) {
            throw new \RuntimeException('Employee must be clocked in to start a break');
        }

        if ($timesheet->isOnBreak()) {
            throw new \RuntimeException('Employee is already on break');
        }

        return DB::transaction(function () use ($timesheet, $dateTime) {
            $timesheet->update([
                'break_start' => $dateTime,
                'break_end' => null,
            ]);

            $this->clearTimesheetCache($timesheet->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * End a break period and update break duration
     */
    public function endBreak(Timesheet $timesheet, ?Carbon $dateTime = null): Timesheet
    {
        $dateTime = $dateTime ?? now();

        if (!$timesheet->isOnBreak()) {
            throw new \RuntimeException('Employee is not currently on break');
        }

        return DB::transaction(function () use ($timesheet, $dateTime) {
            $breakMinutes = $timesheet->break_start->diffInMinutes($dateTime);

            $timesheet->update([
                'break_end' => $dateTime,
                'break_duration_minutes' => $timesheet->break_duration_minutes + $breakMinutes,
            ]);

            $this->clearTimesheetCache($timesheet->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * Calculate regular and overtime hours based on shop settings
     */
    public function calculateHours(Timesheet $timesheet): array
    {
        if (!$timesheet->clock_in || !$timesheet->clock_out) {
            return [
                'regular' => 0,
                'overtime' => 0,
                'total' => 0,
            ];
        }

        $totalMinutes = $timesheet->clock_out->diffInMinutes($timesheet->clock_in);
        $workMinutes = max(0, $totalMinutes - $timesheet->break_duration_minutes);
        $workHours = round($workMinutes / 60, 2);

        $shop = $timesheet->shop;
        $taxSettings = $shop->taxSettings;

        if (!$taxSettings) {
            return [
                'regular' => $workHours,
                'overtime' => 0,
                'total' => $workHours,
            ];
        }

        $overtimeThreshold = (float) $taxSettings->overtime_threshold_hours;

        if ($workHours <= $overtimeThreshold) {
            return [
                'regular' => $workHours,
                'overtime' => 0,
                'total' => $workHours,
            ];
        }

        $regularHours = $overtimeThreshold;
        $overtimeHours = round($workHours - $overtimeThreshold, 2);

        return [
            'regular' => $regularHours,
            'overtime' => $overtimeHours,
            'total' => $workHours,
        ];
    }

    /**
     * Submit a timesheet for approval
     */
    public function submitTimesheet(Timesheet $timesheet, ?string $notes = null): Timesheet
    {
        if (!$timesheet->status->canSubmit()) {
            throw new \RuntimeException('Timesheet cannot be submitted in current status');
        }

        if (!$timesheet->clock_in || !$timesheet->clock_out) {
            throw new \RuntimeException('Timesheet must have clock in and clock out times before submission');
        }

        return DB::transaction(function () use ($timesheet, $notes) {
            $timesheet->update([
                'status' => TimesheetStatus::SUBMITTED,
                'notes' => $notes ?? $timesheet->notes,
            ]);

            $this->clearTimesheetCache($timesheet->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * Approve a timesheet
     */
    public function approveTimesheet(Timesheet $timesheet, User $approver): Timesheet
    {
        if (!$timesheet->status->canApprove()) {
            throw new \RuntimeException('Timesheet cannot be approved in current status');
        }

        return DB::transaction(function () use ($timesheet, $approver) {
            $timesheet->update([
                'status' => TimesheetStatus::APPROVED,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]);

            $this->clearTimesheetCache($timesheet->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * Reject a timesheet with reason
     */
    public function rejectTimesheet(Timesheet $timesheet, User $approver, string $reason): Timesheet
    {
        if (!$timesheet->status->canApprove()) {
            throw new \RuntimeException('Timesheet cannot be rejected in current status');
        }

        return DB::transaction(function () use ($timesheet, $approver, $reason) {
            $timesheet->update([
                'status' => TimesheetStatus::REJECTED,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $this->clearTimesheetCache($timesheet->tenant_id);

            return $timesheet->fresh();
        });
    }

    /**
     * Get timesheets that require approval for a manager
     */
    public function getTimesheetsForApproval(User $manager, ?Shop $shop = null): Collection
    {
        $query = Timesheet::where('tenant_id', $manager->tenant_id)
            ->where('status', TimesheetStatus::SUBMITTED)
            ->with(['user', 'shop']);

        if ($shop) {
            $query->where('shop_id', $shop->id);
        } elseif (!$manager->is_tenant_owner) {
            $managerShopIds = $manager->shops()->pluck('shops.id');
            $query->whereIn('shop_id', $managerShopIds);
        }

        $timesheets = $query->get();

        return $timesheets->filter(function ($timesheet) use ($manager) {
            $employee = $timesheet->user;

            if ($manager->id === $employee->id) {
                return false;
            }

            if ($manager->is_tenant_owner) {
                return true;
            }

            return $manager->role->level() > $employee->role->level();
        });
    }

    /**
     * Get timesheets for an employee within a date range
     */
    public function getEmployeeTimesheets(
        User $employee,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        ?Shop $shop = null
    ): Collection {
        $query = Timesheet::where('user_id', $employee->id)
            ->where('tenant_id', $employee->tenant_id)
            ->with(['shop', 'approvedBy']);

        if ($startDate) {
            $query->where('date', '>=', $startDate->toDateString());
        }

        if ($endDate) {
            $query->where('date', '<=', $endDate->toDateString());
        }

        if ($shop) {
            $query->where('shop_id', $shop->id);
        }

        return $query->orderBy('date', 'desc')->get();
    }

    /**
     * Get timesheet summary statistics for an employee
     */
    public function getTimesheetSummary(User $employee, Carbon $startDate, Carbon $endDate): array
    {
        $timesheets = $this->getEmployeeTimesheets($employee, $startDate, $endDate);

        $approvedTimesheets = $timesheets->where('status', TimesheetStatus::APPROVED);

        $totalRegularHours = $approvedTimesheets->sum('regular_hours');
        $totalOvertimeHours = $approvedTimesheets->sum('overtime_hours');
        $totalHours = $approvedTimesheets->sum('total_hours');

        $shop = $employee->shops()->first();
        $overtimeMultiplier = $shop?->taxSettings?->overtime_multiplier ?? 1.5;

        return [
            'total_timesheets' => $timesheets->count(),
            'approved_timesheets' => $approvedTimesheets->count(),
            'pending_timesheets' => $timesheets->where('status', TimesheetStatus::SUBMITTED)->count(),
            'rejected_timesheets' => $timesheets->where('status', TimesheetStatus::REJECTED)->count(),
            'total_regular_hours' => round($totalRegularHours, 2),
            'total_overtime_hours' => round($totalOvertimeHours, 2),
            'total_hours' => round($totalHours, 2),
            'overtime_multiplier' => (float) $overtimeMultiplier,
            'period_start' => $startDate->toDateString(),
            'period_end' => $endDate->toDateString(),
        ];
    }

    /**
     * Get current active timesheet for employee
     */
    public function getActiveTimesheet(User $employee, Shop $shop): ?Timesheet
    {
        return Timesheet::where('user_id', $employee->id)
            ->where('shop_id', $shop->id)
            ->where('date', now()->toDateString())
            ->where('status', TimesheetStatus::DRAFT)
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->first();
    }

    /**
     * Clear tenant timesheet cache
     */
    protected function clearTimesheetCache(int $tenantId): void
    {
        Cache::tags([
            "tenant:{$tenantId}:timesheets",
            "tenant:{$tenantId}:payroll",
        ])->flush();
    }
}
