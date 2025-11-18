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
        Schema::table('order_payments', function (Blueprint $table) {
            $table->string('gateway')->nullable()->after('payment_method');
            $table->string('gateway_reference')->nullable()->after('gateway');
            $table->string('gateway_status')->nullable()->after('gateway_reference');
            $table->json('gateway_response')->nullable()->after('gateway_status');
            $table->string('currency', 10)->default('NGN')->after('amount');
            $table->decimal('gateway_fee', 10, 2)->default(0)->after('currency');
            $table->timestamp('verified_at')->nullable()->after('gateway_fee');

            $table->index(['gateway', 'gateway_reference']);
            $table->index('gateway_status');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_gateway')->nullable()->after('payment_method');
            $table->string('payment_reference')->nullable()->after('payment_gateway');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_gateway', 'payment_reference']);
        });

        Schema::table('order_payments', function (Blueprint $table) {
            $table->dropIndex(['gateway', 'gateway_reference']);
            $table->dropIndex(['gateway_status']);
            $table->dropColumn([
                'gateway',
                'gateway_reference',
                'gateway_status',
                'gateway_response',
                'currency',
                'gateway_fee',
                'verified_at',
            ]);
        });
    }
};
