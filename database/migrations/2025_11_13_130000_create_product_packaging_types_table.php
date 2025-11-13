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
        Schema::create('product_packaging_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')
                ->constrained('product_variants')
                ->cascadeOnDelete();
            $table->string('name'); // e.g., 'Full Pack', 'Half Pack', 'Loose', 'Carton'
            $table->string('display_name')->nullable(); // e.g., 'Pack of 12', '6-Pack'
            $table->integer('units_per_package')->default(1); // How many base units in this package
            $table->boolean('is_sealed_package')->default(false); // Can't be broken once created
            $table->decimal('price', 10, 2); // Fixed price for this packaging type
            $table->decimal('cost_price', 10, 2)->nullable(); // Cost price if different from base
            $table->boolean('is_base_unit')->default(false); // Marks the base unit (usually loose/individual)
            $table->boolean('can_break_down')->default(false); // Can this package be opened/broken
            $table->foreignId('breaks_into_packaging_type_id')
                ->nullable()
                ->constrained('product_packaging_types')
                ->nullOnDelete(); // What packaging type it breaks into
            $table->integer('min_order_quantity')->default(1); // Minimum order quantity (for wholesale)
            $table->integer('display_order')->default(0); // Order to display in lists
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Indexes for common queries
            $table->index('product_variant_id');
            $table->index(['product_variant_id', 'is_base_unit']);
            $table->index(['product_variant_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_packaging_types');
    }
};
