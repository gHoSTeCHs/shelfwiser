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
            $table->timestamp('refunded_at')->nullable()->after('delivered_at');
            $table->foreignId('refunded_by')->nullable()->constrained('users')->nullOnDelete()->after('refunded_at');
        });

        Schema::table('order_payments', function (Blueprint $table) {
            $table->decimal('refund_amount', 15, 2)->nullable()->after('amount');
            $table->string('refund_status')->nullable()->after('refund_amount');
            $table->string('refund_reference')->nullable()->after('refund_status');
            $table->text('refund_reason')->nullable()->after('refund_reference');
            $table->text('refund_notes')->nullable()->after('refund_reason');
            $table->timestamp('refunded_at')->nullable()->after('refund_notes');
            $table->foreignId('refunded_by')->nullable()->constrained('users')->nullOnDelete()->after('refunded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['refunded_by']);
            $table->dropColumn(['refunded_at', 'refunded_by']);
        });

        Schema::table('order_payments', function (Blueprint $table) {
            $table->dropForeign(['refunded_by']);
            $table->dropColumn([
                'refund_amount',
                'refund_status',
                'refund_reference',
                'refund_reason',
                'refund_notes',
                'refunded_at',
                'refunded_by',
            ]);
        });
    }
};
