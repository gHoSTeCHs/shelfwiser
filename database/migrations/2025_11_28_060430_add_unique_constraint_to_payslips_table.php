<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->unique(['payroll_period_id', 'user_id'], 'payslips_period_user_unique');
            $table->index(['tenant_id', 'user_id']);
            $table->index('created_at');

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropUnique('payslips_period_user_unique');

            $table->dropIndex(['tenant_id', 'user_id']);
            $table->dropIndex(['created_at']);

            $table->dropSoftDeletes();
        });
    }
};
