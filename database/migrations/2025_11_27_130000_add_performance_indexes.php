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
        // Orders table indexes
        Schema::table('orders', function (Blueprint $table) {
            $table->index('created_at', 'orders_created_at_index');

            $table->index(['tenant_id', 'created_at'], 'orders_tenant_created_index');
            $table->index(['tenant_id', 'status'], 'orders_tenant_status_index');
            $table->index(['tenant_id', 'payment_status'], 'orders_tenant_payment_status_index');
            $table->index(['shop_id', 'created_at'], 'orders_shop_created_index');
        });

        // Stock movements table indexes
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index('type', 'stock_movements_type_index');
            $table->index('created_at', 'stock_movements_created_at_index');
            $table->index(['tenant_id', 'created_at'], 'stock_movements_tenant_created_index');
            $table->index(['shop_id', 'created_at'], 'stock_movements_shop_created_index');
            $table->index(['product_variant_id', 'created_at'], 'stock_movements_variant_created_index');
        });

        // Products table indexes
        Schema::table('products', function (Blueprint $table) {
            $table->index('is_active', 'products_is_active_index');
            $table->index(['tenant_id', 'is_active'], 'products_tenant_active_index');
            $table->index(['shop_id', 'is_active'], 'products_shop_active_index');
            $table->index('created_at', 'products_created_at_index');
        });

        // Product variants table indexes
        Schema::table('product_variants', function (Blueprint $table) {
            $table->index('sku', 'product_variants_sku_index');
            $table->index('barcode', 'product_variants_barcode_index');
            $table->index('is_active', 'product_variants_is_active_index');
            $table->index(['product_id', 'is_active'], 'product_variants_product_active_index');
        });

        // Customers table indexes
        Schema::table('customers', function (Blueprint $table) {

            $table->index('phone', 'customers_phone_index');
            $table->index(['tenant_id', 'is_active'], 'customers_tenant_active_index');
            $table->index('created_at', 'customers_created_at_index');
        });

        // Order items table indexes
        Schema::table('order_items', function (Blueprint $table) {
            $table->index(['sellable_type', 'sellable_id'], 'order_items_sellable_index');
        });

        // Services table indexes
        Schema::table('services', function (Blueprint $table) {
            $table->index('is_active', 'services_is_active_index');
            $table->index(['tenant_id', 'is_active'], 'services_tenant_active_index');
            $table->index(['shop_id', 'is_active'], 'services_shop_active_index');
        });

        // Purchase orders table indexes
        Schema::table('purchase_orders', function (Blueprint $table) {

            $table->index('status', 'purchase_orders_status_index');
            $table->index(['buyer_tenant_id', 'created_at'], 'po_buyer_created_index');
            $table->index(['supplier_tenant_id', 'created_at'], 'po_supplier_created_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_created_at_index');
            $table->dropIndex('orders_order_number_index');
            $table->dropIndex('orders_tenant_created_index');
            $table->dropIndex('orders_tenant_status_index');
            $table->dropIndex('orders_tenant_payment_status_index');
            $table->dropIndex('orders_shop_created_index');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_type_index');
            $table->dropIndex('stock_movements_created_at_index');
            $table->dropIndex('stock_movements_tenant_created_index');
            $table->dropIndex('stock_movements_shop_created_index');
            $table->dropIndex('stock_movements_variant_created_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_is_active_index');
            $table->dropIndex('products_tenant_active_index');
            $table->dropIndex('products_shop_active_index');
            $table->dropIndex('products_created_at_index');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex('product_variants_sku_index');
            $table->dropIndex('product_variants_barcode_index');
            $table->dropIndex('product_variants_is_active_index');
            $table->dropIndex('product_variants_product_active_index');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('customers_email_index');
            $table->dropIndex('customers_phone_index');
            $table->dropIndex('customers_tenant_active_index');
            $table->dropIndex('customers_created_at_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_sellable_index');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropIndex('services_is_active_index');
            $table->dropIndex('services_tenant_active_index');
            $table->dropIndex('services_shop_active_index');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropIndex('purchase_orders_created_at_index');
            $table->dropIndex('purchase_orders_status_index');
            $table->dropIndex('po_buyer_created_index');
            $table->dropIndex('po_supplier_created_index');
        });
    }
};
