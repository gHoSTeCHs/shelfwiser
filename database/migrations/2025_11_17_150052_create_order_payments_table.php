<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create order_payments table to track individual payment transactions for orders
     *
     * Enables multiple payment methods per order and full payment audit trail
     * Example: Order total ₦10,000 paid via ₦6,000 bank transfer + ₦4,000 cash
     */
    public function up(): void
    {
        Schema::create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();

            $table->decimal('amount', 15, 2);
            $table->string('payment_method');
            $table->date('payment_date');
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['order_id', 'payment_date']);
            $table->index(['tenant_id', 'payment_method']);
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::dropIfExists('order_payments');
    }
};
