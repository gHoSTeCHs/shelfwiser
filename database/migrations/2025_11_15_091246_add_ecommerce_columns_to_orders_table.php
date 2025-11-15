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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tracking_number')->nullable()->after('order_number');
            $table->date('estimated_delivery_date')->nullable()->after('shipped_at');
            $table->date('actual_delivery_date')->nullable()->after('delivered_at');
            $table->foreignId('customer_shipping_address_id')->nullable()->constrained('customer_addresses')->onDelete('set null')->after('billing_address');
            $table->foreignId('customer_billing_address_id')->nullable()->constrained('customer_addresses')->onDelete('set null')->after('customer_shipping_address_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['customer_shipping_address_id']);
            $table->dropForeign(['customer_billing_address_id']);
            $table->dropColumn(['tracking_number', 'estimated_delivery_date', 'actual_delivery_date', 'customer_shipping_address_id', 'customer_billing_address_id']);
        });
    }
};
