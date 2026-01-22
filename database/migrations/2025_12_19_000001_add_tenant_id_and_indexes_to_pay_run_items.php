<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pay_run_items', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->softDeletes();

            $table->index('user_id');
            $table->index('payslip_id');
            $table->index('status');
            $table->index('tenant_id');
        });

        DB::statement('
            UPDATE pay_run_items
            SET tenant_id = (
                SELECT tenant_id FROM pay_runs WHERE pay_runs.id = pay_run_items.pay_run_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('pay_run_items', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('pay_run_items', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['payslip_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
            $table->dropSoftDeletes();
        });
    }
};
