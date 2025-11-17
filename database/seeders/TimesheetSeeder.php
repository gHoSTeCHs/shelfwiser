<?php

namespace Database\Seeders;

use App\Enums\TimesheetStatus;
use App\Models\Shop;
use App\Models\Timesheet;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TimesheetSeeder extends Seeder
{
    /**
     * Seed timesheets for employees with various statuses
     */
    public function run(): void
    {
        $users = User::where('is_customer', false)
            ->where('is_active', true)
            ->whereIn('role', ['sales_rep', 'cashier', 'inventory_clerk'])
            ->with('tenant')
            ->get();

        foreach ($users as $user) {
            $shop = Shop::where('tenant_id', $user->tenant_id)->first();

            if (!$shop) {
                continue;
            }

            $this->createTimesheetsForUser($user, $shop);
        }
    }

    /**
     * Create multiple timesheets for a user covering different periods and statuses
     */
    protected function createTimesheetsForUser(User $user, Shop $shop): void
    {
        $overtimeThreshold = 8.0;

        $timesheets = [
            [
                'date' => Carbon::now()->subDays(15)->toDateString(),
                'clock_in' => Carbon::now()->subDays(15)->setTime(8, 0),
                'clock_out' => Carbon::now()->subDays(15)->setTime(17, 0),
                'break_duration_minutes' => 60,
                'status' => TimesheetStatus::PAID,
            ],
            [
                'date' => Carbon::now()->subDays(14)->toDateString(),
                'clock_in' => Carbon::now()->subDays(14)->setTime(8, 0),
                'clock_out' => Carbon::now()->subDays(14)->setTime(18, 30),
                'break_duration_minutes' => 60,
                'status' => TimesheetStatus::PAID,
            ],
            [
                'date' => Carbon::now()->subDays(13)->toDateString(),
                'clock_in' => Carbon::now()->subDays(13)->setTime(9, 0),
                'clock_out' => Carbon::now()->subDays(13)->setTime(17, 0),
                'break_duration_minutes' => 30,
                'status' => TimesheetStatus::PAID,
            ],
            [
                'date' => Carbon::now()->subDays(5)->toDateString(),
                'clock_in' => Carbon::now()->subDays(5)->setTime(8, 0),
                'clock_out' => Carbon::now()->subDays(5)->setTime(17, 0),
                'break_duration_minutes' => 60,
                'status' => TimesheetStatus::APPROVED,
            ],
            [
                'date' => Carbon::now()->subDays(4)->toDateString(),
                'clock_in' => Carbon::now()->subDays(4)->setTime(8, 0),
                'clock_out' => Carbon::now()->subDays(4)->setTime(19, 0),
                'break_duration_minutes' => 60,
                'status' => TimesheetStatus::APPROVED,
            ],
            [
                'date' => Carbon::now()->subDays(2)->toDateString(),
                'clock_in' => Carbon::now()->subDays(2)->setTime(8, 30),
                'clock_out' => Carbon::now()->subDays(2)->setTime(17, 30),
                'break_duration_minutes' => 60,
                'status' => TimesheetStatus::SUBMITTED,
            ],
            [
                'date' => Carbon::now()->subDay()->toDateString(),
                'clock_in' => Carbon::now()->subDay()->setTime(8, 0),
                'clock_out' => Carbon::now()->subDay()->setTime(17, 0),
                'break_duration_minutes' => 60,
                'status' => TimesheetStatus::SUBMITTED,
            ],
            [
                'date' => Carbon::now()->toDateString(),
                'clock_in' => Carbon::now()->setTime(8, 0),
                'clock_out' => null,
                'break_duration_minutes' => 0,
                'status' => TimesheetStatus::DRAFT,
            ],
        ];

        foreach ($timesheets as $timesheetData) {
            $clockIn = $timesheetData['clock_in'];
            $clockOut = $timesheetData['clock_out'];
            $breakDurationMinutes = $timesheetData['break_duration_minutes'];

            $totalHours = 0;
            $regularHours = 0;
            $overtimeHours = 0;

            if ($clockOut) {
                $totalMinutes = $clockIn->diffInMinutes($clockOut) - $breakDurationMinutes;
                $totalHours = $totalMinutes / 60;

                if ($totalHours > $overtimeThreshold) {
                    $regularHours = $overtimeThreshold;
                    $overtimeHours = $totalHours - $overtimeThreshold;
                } else {
                    $regularHours = $totalHours;
                    $overtimeHours = 0;
                }
            }

            Timesheet::create([
                'user_id' => $user->id,
                'shop_id' => $shop->id,
                'tenant_id' => $user->tenant_id,
                'date' => $timesheetData['date'],
                'clock_in' => $clockIn,
                'clock_out' => $clockOut,
                'break_start' => $clockOut ? $clockIn->copy()->addHours(4) : null,
                'break_end' => $clockOut ? $clockIn->copy()->addHours(4)->addMinutes($breakDurationMinutes) : null,
                'break_duration_minutes' => $breakDurationMinutes,
                'total_hours' => $totalHours,
                'regular_hours' => $regularHours,
                'overtime_hours' => $overtimeHours,
                'status' => $timesheetData['status'],
                'notes' => $timesheetData['status'] === TimesheetStatus::APPROVED ? 'Approved by manager' : null,
            ]);
        }
    }
}
