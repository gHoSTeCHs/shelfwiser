<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Fix FK constraint and remove redundant base_salary column
     */
    public function up(): void
    {
        DB::table('payslips')
            ->whereNull('basic_salary')
            ->whereNotNull('base_salary')
            ->update(['basic_salary' => DB::raw('base_salary')]);

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropForeign(['payroll_period_id']);

            $table->foreign('payroll_period_id')
                ->references('id')
                ->on('payroll_periods')
                ->nullOnDelete();

            $table->dropColumn('base_salary');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('base_salary', 15, 2)->nullable()->after('shop_id');

            $table->dropForeign(['payroll_period_id']);

            $table->foreign('payroll_period_id')
                ->references('id')
                ->on('payroll_periods')
                ->restrictOnDelete();
        });

        DB::table('payslips')
            ->whereNull('base_salary')
            ->whereNotNull('basic_salary')
            ->update(['base_salary' => DB::raw('basic_salary')]);
    }
};
