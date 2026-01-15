<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Changes user foreign keys from cascadeOnDelete to nullOnDelete
 * to preserve audit trail when users are deleted.
 *
 * Affected columns:
 * - purchase_orders.created_by
 * - purchase_order_payments.recorded_by
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->unsignedBigInteger('created_by')->nullable()->change();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });

        Schema::table('purchase_order_payments', function (Blueprint $table) {
            $table->dropForeign(['recorded_by']);
            $table->unsignedBigInteger('recorded_by')->nullable()->change();
            $table->foreign('recorded_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->unsignedBigInteger('created_by')->nullable(false)->change();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });

        Schema::table('purchase_order_payments', function (Blueprint $table) {
            $table->dropForeign(['recorded_by']);
            $table->unsignedBigInteger('recorded_by')->nullable(false)->change();
            $table->foreign('recorded_by')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
        });
    }
};
