<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('held_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->string('hold_reference');
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->json('items');
            $table->text('notes')->nullable();
            $table->foreignId('held_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('retrieved_at')->nullable();
            $table->foreignId('retrieved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['shop_id', 'hold_reference']);
            $table->index(['tenant_id', 'shop_id']);
            $table->index(['shop_id', 'retrieved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('held_sales');
    }
};
