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
        Schema::table('cart_items', function (Blueprint $table) {
            $table->string('sellable_type')->nullable()->after('cart_id');
            $table->unsignedBigInteger('sellable_id')->nullable()->after('sellable_type');
            $table->enum('material_option', ['customer_materials', 'shop_materials', 'none'])->nullable()->after('price');
            $table->json('selected_addons')->nullable()->after('material_option')->comment('Service add-ons data');
            $table->decimal('base_price', 15, 2)->nullable()->after('selected_addons')->comment('Base price before add-ons');

            $table->index(['sellable_type', 'sellable_id']);
        });

        // Migrate existing data to use polymorphic relationship
        DB::statement("UPDATE cart_items SET sellable_type = 'App\\\\Models\\\\ProductVariant', sellable_id = product_variant_id WHERE product_variant_id IS NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex(['sellable_type', 'sellable_id']);
            $table->dropColumn(['sellable_type', 'sellable_id', 'material_option', 'selected_addons', 'base_price']);
        });
    }
};
