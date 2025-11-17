<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();

            $table->decimal('base_salary', 15, 2)->default(0);
            $table->decimal('regular_hours', 8, 2)->default(0);
            $table->decimal('regular_pay', 15, 2)->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->decimal('overtime_pay', 15, 2)->default(0);
            $table->decimal('bonus', 15, 2)->default(0);
            $table->decimal('commission', 15, 2)->default(0);

            $table->decimal('gross_pay', 15, 2)->default(0);

            $table->decimal('income_tax', 15, 2)->default(0);
            $table->decimal('pension_employee', 15, 2)->default(0);
            $table->decimal('pension_employer', 15, 2)->default(0);
            $table->decimal('nhf', 15, 2)->default(0);
            $table->decimal('nhis', 15, 2)->default(0);
            $table->decimal('wage_advance_deduction', 15, 2)->default(0);
            $table->decimal('other_deductions', 15, 2)->default(0);

            $table->decimal('total_deductions', 15, 2)->default(0);
            $table->decimal('net_pay', 15, 2)->default(0);

            $table->json('earnings_breakdown')->nullable();
            $table->json('deductions_breakdown')->nullable();
            $table->json('tax_breakdown')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['payroll_period_id', 'user_id']);
            $table->index(['tenant_id', 'user_id']);
            $table->index('shop_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
