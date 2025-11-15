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
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_packaging_type_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('quantity')->default(1);
            $table->decimal('price', 15, 2); // Snapshot price at time of adding to cart
            $table->timestamps();

            // Ensure one unique item per cart (variant + packaging combination)
            $table->unique(['cart_id', 'product_variant_id', 'product_packaging_type_id'], 'unique_cart_item');
            $table->index('cart_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
