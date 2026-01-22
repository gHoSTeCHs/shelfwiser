<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deduction_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 50);
            $table->string('calculation_type', 50);
            $table->string('calculation_base', 50)->default('gross');
            $table->decimal('default_amount', 15, 2)->nullable();
            $table->decimal('default_rate', 8, 4)->nullable();
            $table->decimal('max_amount', 15, 2)->nullable();
            $table->decimal('annual_cap', 15, 2)->nullable();
            $table->boolean('is_pre_tax')->default(false);
            $table->boolean('is_mandatory')->default(false);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('priority')->default(100);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'category', 'is_active']);
            $table->index(['tenant_id', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deduction_types');
    }
};
