<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix carts.customer_id foreign key to point to customers table instead of users table.
     *
     * CRITICAL BUG FIX:
     * The original migration incorrectly linked carts.customer_id to the users table (staff)
     * instead of the customers table (buyers). This caused data corruption where customer carts
     * could accidentally link to staff members with the same ID.
     *
     * This migration:
     * 1. Drops the incorrect foreign key constraint
     * 2. Creates a new foreign key pointing to the customers table
     */
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            // Drop the incorrect foreign key constraint
            $table->dropForeign('carts_customer_id_foreign');

            // Add the new foreign key constraint to the customers table
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            // Drop the new foreign key constraint
            $table->dropForeign(['customer_id']);

            // Add the old foreign key constraint back to the users table
            $table->foreign('customer_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }
};
