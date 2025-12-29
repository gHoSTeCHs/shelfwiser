<?php

namespace Database\Seeders;

use App\Models\PayCalendar;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class PayCalendarSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Please seed tenants first.');
            return;
        }

        foreach ($tenants as $tenant) {
            PayCalendar::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => 'Monthly (End of Month)'],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Monthly (End of Month)',
                    'description' => 'Standard monthly pay calendar with payment on the last day of the month',
                    'frequency' => 'monthly',
                    'pay_day' => 28,
                    'cutoff_day' => 25,
                    'is_default' => true,
                    'is_active' => true,
                ]
            );

            PayCalendar::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => 'Bi-Weekly'],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Bi-Weekly',
                    'description' => 'Bi-weekly pay calendar for hourly workers',
                    'frequency' => 'bi_weekly',
                    'pay_day' => 5,
                    'is_default' => false,
                    'is_active' => true,
                ]
            );

            PayCalendar::updateOrCreate(
                ['tenant_id' => $tenant->id, 'name' => 'Weekly'],
                [
                    'tenant_id' => $tenant->id,
                    'name' => 'Weekly',
                    'description' => 'Weekly pay calendar for part-time workers',
                    'frequency' => 'weekly',
                    'pay_day' => 5,
                    'is_default' => false,
                    'is_active' => true,
                ]
            );

            $this->command->info("Created pay calendars for tenant: {$tenant->name}");
        }
    }
}
