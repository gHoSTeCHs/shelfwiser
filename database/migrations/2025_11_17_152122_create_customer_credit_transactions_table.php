<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create customer_credit_transactions table for tracking customer account activity
     *
     * Records all changes to customer account balances:
     * - Charges when orders are placed on credit
     * - Payments received from customers
     * - Credit notes and adjustments
     * - Full audit trail with running balance
     */
    public function up(): void
    {
        Schema::create('customer_credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();

            $table->string('type');
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);

            $table->text('description');
            $table->text('notes')->nullable();
            $table->string('reference_number')->nullable();

            $table->foreignId('recorded_by')->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_id', 'created_at']);
            $table->index(['tenant_id', 'type']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_credit_transactions');
    }
};
