<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_payroll_details', function (Blueprint $table) {
            if (!Schema::hasColumn('employee_payroll_details', 'pay_calendar_id')) {
                $table->unsignedBigInteger('pay_calendar_id')->nullable()->after('pay_frequency');
            }

            if (!Schema::hasColumn('employee_payroll_details', 'standard_hours_per_week')) {
                $table->decimal('standard_hours_per_week', 5, 2)->default(40)->after('pay_calendar_id');
            }

            if (!Schema::hasColumn('employee_payroll_details', 'overtime_multiplier')) {
                $table->decimal('overtime_multiplier', 4, 2)->default(1.5)->after('standard_hours_per_week');
            }

            if (!Schema::hasColumn('employee_payroll_details', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->nullable()->after('pay_type');
            }

            if (!Schema::hasColumn('employee_payroll_details', 'commission_cap')) {
                $table->decimal('commission_cap', 15, 2)->nullable()->after('commission_rate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employee_payroll_details', function (Blueprint $table) {
            $columnsToRemove = [
                'pay_calendar_id',
                'standard_hours_per_week',
                'overtime_multiplier',
                'commission_rate',
                'commission_cap',
            ];

            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('employee_payroll_details', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
