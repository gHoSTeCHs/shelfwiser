<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make orders.created_by nullable to support e-commerce orders
     *
     * CRITICAL BUG FIX:
     * E-commerce orders are created by customers (customers table),
     * but created_by references users table (staff members).
     * This caused constraint violations when customers placed orders.
     *
     * This migration:
     * 1. Drops the existing foreign key constraint
     * 2. Makes created_by nullable
     * 3. Re-creates the foreign key with nullable constraint
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop existing foreign key
            $table->dropForeign(['created_by']);

            // Make created_by nullable
            $table->foreignId('created_by')
                ->nullable()
                ->change();

            // Re-create foreign key with nullable constraint
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop the nullable foreign key
            $table->dropForeign(['created_by']);

            // Make created_by non-nullable again
            $table->foreignId('created_by')
                ->nullable(false)
                ->change();

            // Re-create foreign key with restrictOnDelete
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });
    }
};
