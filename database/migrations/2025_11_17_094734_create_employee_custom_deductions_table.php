<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_custom_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('deduction_name');
            $table->string('deduction_type');
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('percentage', 5, 2)->nullable();

            $table->boolean('is_active')->default(true);
            $table->date('effective_from');
            $table->date('effective_to')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index(['tenant_id', 'is_active']);
            $table->index('effective_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_custom_deductions');
    }
};
