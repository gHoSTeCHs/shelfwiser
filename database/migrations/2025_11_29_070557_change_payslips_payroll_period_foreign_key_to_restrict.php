<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropForeign(['payroll_period_id']);

            $table->foreignId('payroll_period_id')
                ->change()
                ->constrained()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropForeign(['payroll_period_id']);

            $table->foreignId('payroll_period_id')
                ->change()
                ->constrained()
                ->cascadeOnDelete();
        });
    }
};
