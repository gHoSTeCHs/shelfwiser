<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('earning_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 50);
            $table->string('calculation_type', 50);
            $table->decimal('default_amount', 15, 2)->nullable();
            $table->decimal('default_rate', 8, 4)->nullable();
            $table->boolean('is_taxable')->default(true);
            $table->boolean('is_pensionable')->default(true);
            $table->boolean('is_recurring')->default(true);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'category']);
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('earning_types');
    }
};
