<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_locations', function (Blueprint $table) {
            $table->foreignId('shop_id')
                ->nullable()
                ->after('tenant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->index(['shop_id', 'product_variant_id']);
        });

        DB::statement('
            UPDATE inventory_locations il
            SET shop_id = (
                SELECT p.shop_id
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE pv.id = il.product_variant_id
            )
            WHERE shop_id IS NULL
        ');

        Schema::table('inventory_locations', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_locations', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropIndex(['shop_id', 'product_variant_id']);
            $table->dropColumn('shop_id');
        });
    }
};
