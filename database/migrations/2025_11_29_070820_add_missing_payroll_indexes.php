<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_payroll_details', function (Blueprint $table) {
            $table->index('pay_type');
            $table->index('pay_frequency');
            $table->index(['tenant_id', 'pay_type']);
            $table->index(['tenant_id', 'employment_type']);
        });

        Schema::table('employee_custom_deductions', function (Blueprint $table) {
            $table->index('deduction_type');
            $table->index(['user_id', 'is_active']);
            $table->index(['tenant_id', 'is_active']);
        });

        Schema::table('wage_advances', function (Blueprint $table) {
            $table->index('disbursed_by_user_id');
            $table->index(['user_id', 'status']);
            $table->index(['tenant_id', 'status']);
            $table->index(['shop_id', 'status']);
        });

        Schema::table('payroll_periods', function (Blueprint $table) {
            $table->index('payment_date');
            $table->index(['processed_by_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('employee_payroll_details', function (Blueprint $table) {
            $table->dropIndex(['pay_type']);
            $table->dropIndex(['pay_frequency']);
            $table->dropIndex(['tenant_id', 'pay_type']);
            $table->dropIndex(['tenant_id', 'employment_type']);
        });

        Schema::table('employee_custom_deductions', function (Blueprint $table) {
            $table->dropIndex(['deduction_type']);
            $table->dropIndex(['user_id', 'is_active']);
            $table->dropIndex(['tenant_id', 'is_active']);
        });

        Schema::table('wage_advances', function (Blueprint $table) {
            $table->dropIndex(['disbursed_by_user_id']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['shop_id', 'status']);
        });

        Schema::table('payroll_periods', function (Blueprint $table) {
            $table->dropIndex(['payment_date']);
            $table->dropIndex(['processed_by_user_id', 'status']);
        });
    }
};
