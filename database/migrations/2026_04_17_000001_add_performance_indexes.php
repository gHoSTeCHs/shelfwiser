<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fund_requests', function (Blueprint $table) {
            $table->index(['tenant_id', 'requested_at'], 'fund_requests_tenant_requested_at_index');
        });

        Schema::table('pay_runs', function (Blueprint $table) {
            $table->index(['tenant_id', 'completed_at'], 'pay_runs_tenant_completed_at_index');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->index(['tenant_id', 'status'], 'payslips_tenant_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('fund_requests', function (Blueprint $table) {
            $table->dropIndex('fund_requests_tenant_requested_at_index');
        });

        Schema::table('pay_runs', function (Blueprint $table) {
            $table->dropIndex('pay_runs_tenant_completed_at_index');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropIndex('payslips_tenant_status_index');
        });
    }
};
