<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Convert order_type from DB-level ENUM to string column.
 *
 * This allows adding new order types (like 'pos') without requiring
 * database migrations, following the CLAUDE.md pattern of using
 * PHP Enums with string columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_type_new')->default('customer')->after('order_number');
        });

        DB::statement('UPDATE orders SET order_type_new = order_type');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['shop_id', 'order_type']);
            $table->dropIndex(['tenant_id', 'order_type']);
            $table->dropColumn('order_type');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('order_type_new', 'order_type');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['shop_id', 'order_type']);
            $table->index(['tenant_id', 'order_type']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['shop_id', 'order_type']);
            $table->dropIndex(['tenant_id', 'order_type']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type_old', ['pos', 'customer', 'purchase_order', 'internal'])
                ->default('customer')
                ->after('order_number');
        });

        DB::statement("UPDATE orders SET order_type_old = CASE
            WHEN order_type IN ('pos', 'customer', 'purchase_order', 'internal') THEN order_type
            ELSE 'customer'
        END");

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('order_type');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('order_type_old', 'order_type');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['shop_id', 'order_type']);
            $table->index(['tenant_id', 'order_type']);
        });
    }
};
