<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employee_payroll_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('employment_type');
            $table->string('pay_type');
            $table->decimal('pay_amount', 15, 2);
            $table->string('pay_frequency');

            $table->string('tax_handling')->default('employee_calculates');
            $table->boolean('enable_tax_calculations')->default(false);
            $table->text('tax_id_number')->nullable();

            $table->boolean('pension_enabled')->default(false);
            $table->decimal('pension_employee_rate', 5, 2)->default(8.00);
            $table->decimal('pension_employer_rate', 5, 2)->default(10.00);

            $table->boolean('nhf_enabled')->default(false);
            $table->decimal('nhf_rate', 5, 2)->default(2.50);

            $table->boolean('nhis_enabled')->default(false);
            $table->decimal('nhis_amount', 10, 2)->nullable();

            $table->boolean('other_deductions_enabled')->default(false);

            $table->text('bank_account_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->text('routing_number')->nullable();

            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();

            $table->string('position_title')->nullable();
            $table->string('department')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamps();

            $table->unique('user_id');
            $table->index(['tenant_id', 'user_id']);
            $table->index('employment_type');
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_payroll_details');
    }
};
