<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique('unique_cart_item');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->unique(
                ['cart_id', 'sellable_type', 'sellable_id', 'product_packaging_type_id'],
                'unique_cart_item_sellable'
            );
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropUnique('unique_cart_item_sellable');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->unique(
                ['cart_id', 'product_variant_id', 'product_packaging_type_id'],
                'unique_cart_item'
            );
        });
    }
};
