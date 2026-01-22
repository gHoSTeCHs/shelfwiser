<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_packaging_types', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->nullable()
                ->after('id')
                ->constrained('tenants')
                ->cascadeOnDelete();
        });

        // Backfill tenant_id from product_variant -> product -> tenant
        DB::statement('
            UPDATE product_packaging_types
            SET tenant_id = (
                SELECT p.tenant_id
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE pv.id = product_packaging_types.product_variant_id
            )
            WHERE tenant_id IS NULL
        ');

        // Make tenant_id non-nullable after backfill
        Schema::table('product_packaging_types', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });

        // Add index for tenant-scoped queries
        Schema::table('product_packaging_types', function (Blueprint $table) {
            $table->index(['tenant_id', 'product_variant_id'], 'ppt_tenant_variant_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_packaging_types', function (Blueprint $table) {
            $table->dropIndex('ppt_tenant_variant_idx');
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
