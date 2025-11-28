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
        // For SQLite, we need to check if foreign keys exist before dropping
        // For MySQL/PostgreSQL, we can drop if exists
        $driver = DB::connection()->getDriverName();

        // Order Items -> Orders
        Schema::table('order_items', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['order_id']);
            }
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');
        });

        // Cart Items -> Carts
        Schema::table('cart_items', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['cart_id']);
            }
        });
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreign('cart_id')
                ->references('id')
                ->on('carts')
                ->onDelete('cascade');
        });

        // Purchase Order Items -> Purchase Orders
        Schema::table('purchase_order_items', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['purchase_order_id']);
            }
        });
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreign('purchase_order_id')
                ->references('id')
                ->on('purchase_orders')
                ->onDelete('cascade');
        });

        // Purchase Order Payments -> Purchase Orders
        Schema::table('purchase_order_payments', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['purchase_order_id']);
            }
        });
        Schema::table('purchase_order_payments', function (Blueprint $table) {
            $table->foreign('purchase_order_id')
                ->references('id')
                ->on('purchase_orders')
                ->onDelete('cascade');
        });

        // Order Payments -> Orders
        Schema::table('order_payments', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['order_id']);
            }
        });
        Schema::table('order_payments', function (Blueprint $table) {
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');
        });

        // Stock Movements -> Product Variants (set null instead of cascade to preserve audit trail)
        Schema::table('stock_movements', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['product_variant_id']);
            }
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants')
                ->onDelete('set null'); // Preserve stock movement history even if variant deleted
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse to no action (original state)
        $driver = DB::connection()->getDriverName();

        // Order Items
        Schema::table('order_items', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['order_id']);
            }
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders');
        });

        // Cart Items
        Schema::table('cart_items', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['cart_id']);
            }
        });
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreign('cart_id')->references('id')->on('carts');
        });

        // Purchase Order Items
        Schema::table('purchase_order_items', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['purchase_order_id']);
            }
        });
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders');
        });

        // Purchase Order Payments
        Schema::table('purchase_order_payments', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['purchase_order_id']);
            }
        });
        Schema::table('purchase_order_payments', function (Blueprint $table) {
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders');
        });

        // Order Payments
        Schema::table('order_payments', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['order_id']);
            }
        });
        Schema::table('order_payments', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders');
        });

        // Stock Movements
        Schema::table('stock_movements', function (Blueprint $table) use ($driver) {
            if ($driver !== 'sqlite') {
                $table->dropForeign(['product_variant_id']);
            }
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreign('product_variant_id')->references('id')->on('product_variants');
        });
    }
};
