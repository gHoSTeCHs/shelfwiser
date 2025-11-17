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
        Schema::create('service_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('customer_materials_price', 15, 2)->nullable()->comment('Price when customer provides materials');
            $table->decimal('shop_materials_price', 15, 2)->nullable()->comment('Price when shop provides materials');
            $table->decimal('base_price', 15, 2)->comment('Default price (if no material options)');
            $table->integer('estimated_duration_minutes')->nullable()->comment('Estimated duration for reference');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['service_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_variants');
    }
};
