<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (!Schema::hasColumn('payslips', 'status')) {
                $table->string('status')->default('generated')->after('notes');
            }
            if (!Schema::hasColumn('payslips', 'cancellation_reason')) {
                $table->string('cancellation_reason')->nullable()->after('status');
            }
            if (!Schema::hasColumn('payslips', 'cancelled_by')) {
                $table->unsignedBigInteger('cancelled_by')->nullable()->after('cancellation_reason');
                $table->foreign('cancelled_by')->references('id')->on('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('payslips', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('cancelled_by');
            }
            if (!Schema::hasColumn('payslips', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (Schema::hasColumn('payslips', 'cancelled_by')) {
                $table->dropForeign(['cancelled_by']);
            }

            $columnsToDrop = ['status', 'cancellation_reason', 'cancelled_by', 'cancelled_at'];
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('payslips', $column)) {
                    $table->dropColumn($column);
                }
            }

            if (Schema::hasColumn('payslips', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
