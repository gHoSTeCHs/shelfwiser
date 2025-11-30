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
        Schema::create('approval_chains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g., "Purchase Order Approval - Over $1000"
            $table->string('entity_type'); // PurchaseOrder, WageAdvance, etc.
            $table->decimal('minimum_amount', 15, 2)->nullable(); // Threshold to trigger this chain
            $table->decimal('maximum_amount', 15, 2)->nullable();
            $table->json('approval_steps'); // Array of {role_level: 60, required: true}
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0); // Higher priority chains are checked first
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'entity_type', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_chains');
    }
};
