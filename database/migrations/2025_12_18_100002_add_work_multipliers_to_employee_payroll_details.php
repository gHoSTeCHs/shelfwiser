<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_payroll_details', function (Blueprint $table) {
            if (!Schema::hasColumn('employee_payroll_details', 'weekend_multiplier')) {
                $table->decimal('weekend_multiplier', 4, 2)->default(2.0)->after('overtime_multiplier');
            }
            if (!Schema::hasColumn('employee_payroll_details', 'holiday_multiplier')) {
                $table->decimal('holiday_multiplier', 4, 2)->default(2.5)->after('weekend_multiplier');
            }
            if (!Schema::hasColumn('employee_payroll_details', 'commission_basis')) {
                $table->string('commission_basis')->default('sales')->after('commission_rate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employee_payroll_details', function (Blueprint $table) {
            $columns = ['weekend_multiplier', 'holiday_multiplier', 'commission_basis'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('employee_payroll_details', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
