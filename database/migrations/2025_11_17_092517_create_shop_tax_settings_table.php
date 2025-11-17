<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_tax_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tax_jurisdiction_id')->nullable()->constrained()->nullOnDelete();

            $table->boolean('enable_tax_calculations')->default(false);
            $table->string('default_tax_handling')->default('employee_calculates');

            $table->decimal('overtime_threshold_hours', 5, 2)->default(40.00);
            $table->decimal('overtime_multiplier', 3, 2)->default(1.50);

            $table->string('default_payroll_frequency')->default('monthly');
            $table->decimal('wage_advance_max_percentage', 5, 2)->default(30.00);

            $table->boolean('default_pension_enabled')->default(false);
            $table->boolean('default_nhf_enabled')->default(false);
            $table->boolean('default_nhis_enabled')->default(false);

            $table->timestamps();

            $table->unique('shop_id');
            $table->index(['tenant_id', 'shop_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_tax_settings');
    }
};
