<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add tenant_id to carts table for better multi-tenancy consistency.
     *
     * This brings the carts table in line with other multi-tenant tables.
     * tenant_id allows for easier tenant-scoped queries and reporting.
     */
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index(['tenant_id', 'customer_id']);
        });

        // Populate tenant_id for existing carts based on shop relationship
        DB::statement('
            UPDATE carts
            SET tenant_id = (
                SELECT tenant_id
                FROM shops
                WHERE shops.id = carts.shop_id
            )
            WHERE tenant_id IS NULL
        ');

        // Make tenant_id non-nullable after populating existing data
        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'customer_id']);
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
