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
            $table->timestamp('packed_at')->nullable()->after('confirmed_at');
            $table->foreignId('packed_by')->nullable()->constrained('users')->nullOnDelete()->after('packed_at');
            $table->foreignId('shipped_by')->nullable()->constrained('users')->nullOnDelete()->after('shipped_at');
            $table->foreignId('delivered_by')->nullable()->constrained('users')->nullOnDelete()->after('delivered_at');

            $table->string('tracking_number')->nullable()->after('delivered_by');
            $table->string('shipping_carrier')->nullable()->after('tracking_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['packed_by']);
            $table->dropForeign(['shipped_by']);
            $table->dropForeign(['delivered_by']);

            $table->dropColumn([
                'packed_at',
                'packed_by',
                'shipped_by',
                'delivered_by',
                'tracking_number',
                'shipping_carrier',
            ]);
        });
    }
};
