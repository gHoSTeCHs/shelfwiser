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
            $table->foreignId('tenant_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->softDeletes();

            $table->index(['tenant_id', 'product_variant_id']);
        });

        DB::statement('
            UPDATE inventory_locations
            SET tenant_id = (
                SELECT products.tenant_id
                FROM product_variants
                JOIN products ON products.id = product_variants.product_id
                WHERE product_variants.id = inventory_locations.product_variant_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('inventory_locations', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_locations', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id', 'product_variant_id']);
            $table->dropColumn('tenant_id');
            $table->dropSoftDeletes();
        });
    }
};
