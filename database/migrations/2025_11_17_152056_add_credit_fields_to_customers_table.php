<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add credit/tab system fields to customers table
     *
     * Enables customer credit accounts for:
     * - Buying goods on credit (tab system)
     * - Tracking account balances
     * - Setting credit limits
     * - Recording purchase history
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('account_balance', 15, 2)->default(0)->after('is_active');
            $table->decimal('credit_limit', 15, 2)->nullable()->after('account_balance');
            $table->decimal('total_purchases', 15, 2)->default(0)->after('credit_limit');
            $table->timestamp('last_purchase_at')->nullable()->after('total_purchases');

            $table->index('account_balance');
        });
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['account_balance']);
            $table->dropColumn([
                'account_balance',
                'credit_limit',
                'total_purchases',
                'last_purchase_at',
            ]);
        });
    }
};
