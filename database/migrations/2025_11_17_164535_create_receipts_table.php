<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create receipts table for tracking generated receipts
     *
     * Tracks all generated receipts for orders and payments:
     * - Order receipts (full order details)
     * - Payment receipts (payment confirmation)
     * - Links to PDF files if stored
     * - Tracks generation and email sending
     */
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('order_payment_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();

            $table->string('receipt_number')->unique();
            $table->enum('type', ['order', 'payment'])->default('order');
            $table->decimal('amount', 15, 2);

            $table->string('pdf_path')->nullable();
            $table->timestamp('generated_at');
            $table->timestamp('emailed_at')->nullable();
            $table->string('emailed_to')->nullable();

            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['tenant_id', 'type']);
            $table->index(['order_id', 'type']);
            $table->index(['customer_id', 'created_at']);
            $table->index('receipt_number');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
