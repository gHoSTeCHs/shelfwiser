<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);

            $table->string('role');
            $table->string('employment_type');
            $table->string('position_title');
            $table->string('department')->nullable();

            $table->string('pay_type');
            $table->decimal('pay_amount', 15, 2);
            $table->string('pay_frequency');
            $table->decimal('standard_hours_per_week', 5, 2)->default(40);
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->decimal('commission_cap', 15, 2)->nullable();

            $table->string('tax_handling')->nullable();
            $table->boolean('pension_enabled')->default(false);
            $table->decimal('pension_employee_rate', 5, 2)->default(8.00);
            $table->boolean('nhf_enabled')->default(false);
            $table->boolean('nhis_enabled')->default(false);

            $table->integer('usage_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'is_system']);
            $table->index('is_system');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_templates');
    }
};
