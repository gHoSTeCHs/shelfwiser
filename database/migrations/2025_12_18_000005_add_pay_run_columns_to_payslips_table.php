<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (!Schema::hasColumn('payslips', 'pay_run_id')) {
                $table->foreignId('pay_run_id')->nullable()->after('payroll_period_id')
                    ->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('payslips', 'tax_calculation')) {
                $table->json('tax_calculation')->nullable()->after('deductions_breakdown');
            }

            if (!Schema::hasColumn('payslips', 'employer_contributions')) {
                $table->json('employer_contributions')->nullable()->after('tax_calculation');
            }

            if (!Schema::hasColumn('payslips', 'basic_salary')) {
                $table->decimal('basic_salary', 15, 2)->default(0)->after('pay_run_id');
            }

            if (!Schema::hasColumn('payslips', 'gross_earnings')) {
                $table->decimal('gross_earnings', 15, 2)->default(0)->after('basic_salary');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (Schema::hasColumn('payslips', 'pay_run_id')) {
                $table->dropForeign(['pay_run_id']);
                $table->dropColumn('pay_run_id');
            }

            if (Schema::hasColumn('payslips', 'tax_calculation')) {
                $table->dropColumn('tax_calculation');
            }

            if (Schema::hasColumn('payslips', 'employer_contributions')) {
                $table->dropColumn('employer_contributions');
            }

            if (Schema::hasColumn('payslips', 'basic_salary')) {
                $table->dropColumn('basic_salary');
            }

            if (Schema::hasColumn('payslips', 'gross_earnings')) {
                $table->dropColumn('gross_earnings');
            }
        });
    }
};
