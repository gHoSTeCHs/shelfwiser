<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('tenant_id')->constrained()->cascadeOnDelete();
            $table->index(['tenant_id', 'shop_id']);
        });

        if (Schema::hasTable('stock_movements') && DB::table('stock_movements')->count() > 0) {
            DB::statement('
                UPDATE stock_movements sm
                INNER JOIN product_variants pv ON sm.product_variant_id = pv.id
                INNER JOIN products p ON pv.product_id = p.id
                SET sm.shop_id = p.shop_id
                WHERE sm.shop_id IS NULL
            ');
        }
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'shop_id']);
            $table->dropConstrainedForeignId('shop_id');
        });
    }
};
