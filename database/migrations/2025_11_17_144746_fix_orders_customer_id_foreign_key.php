<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix orders.customer_id foreign key to point to customers table instead of users table
     *
     * CRITICAL BUG FIX:
     * The original migration incorrectly linked orders.customer_id to the users table (staff)
     * instead of the customers table (buyers). This caused data corruption where customer orders
     * could accidentally link to staff members with the same ID.
     *
     * This migration:
     * 1. Drops the incorrect foreign key constraint
     * 2. Creates a new foreign key pointing to the customers table
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign('orders_customer_id_foreign');

            $table->foreign('customer_id')
                  ->references('id')
                  ->on('customers')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign('orders_customer_id_foreign');

            $table->foreign('customer_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');
        });
    }
};
