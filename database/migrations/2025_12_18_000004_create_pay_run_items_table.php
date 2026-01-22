<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_run_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pay_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payslip_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default('pending');
            $table->decimal('basic_salary', 15, 2)->default(0);
            $table->decimal('gross_earnings', 15, 2)->default(0);
            $table->decimal('taxable_earnings', 15, 2)->default(0);
            $table->decimal('total_deductions', 15, 2)->default(0);
            $table->decimal('net_pay', 15, 2)->default(0);
            $table->decimal('employer_pension', 15, 2)->default(0);
            $table->decimal('employer_nhf', 15, 2)->default(0);
            $table->decimal('total_employer_cost', 15, 2)->default(0);
            $table->json('earnings_breakdown')->nullable();
            $table->json('deductions_breakdown')->nullable();
            $table->json('tax_calculation')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->unique(['pay_run_id', 'user_id']);
            $table->index(['pay_run_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_run_items');
    }
};
