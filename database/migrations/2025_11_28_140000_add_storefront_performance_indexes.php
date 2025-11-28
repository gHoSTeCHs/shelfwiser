<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add performance indexes for storefront queries.
     *
     * These indexes improve query performance for frequently executed
     * storefront operations, especially customer lookups and filtering.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Composite index for tenant + active customer queries
            $table->index(['tenant_id', 'is_active']);

            // Index for email lookups during login
            $table->index(['email', 'is_active']);
        });

        Schema::table('carts', function (Blueprint $table) {
            // Index for session-based cart lookups
            $table->index(['session_id', 'shop_id']);

            // Index for expired cart cleanup queries
            $table->index('expires_at');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            // Composite index for finding existing cart items
            $table->index(['cart_id', 'product_variant_id', 'product_packaging_type_id'], 'cart_items_lookup_index');
        });
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_active']);
            $table->dropIndex(['email', 'is_active']);
        });

        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['session_id', 'shop_id']);
            $table->dropIndex(['expires_at']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex('cart_items_lookup_index');
        });
    }
};
