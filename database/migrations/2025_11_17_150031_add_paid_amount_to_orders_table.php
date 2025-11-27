<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add paid_amount field to orders table to track total payments received
     *
     * This enables support for:
     * - Multiple payments per order
     * - Partial payment tracking
     * - Split payment methods (cash + transfer on same order)
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('paid_amount', 15, 2)->default(0)->after('total_amount');
        });
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('paid_amount');
        });
    }
};
