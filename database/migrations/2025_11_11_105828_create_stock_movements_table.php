<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
            $table->foreignId('to_location_id')->nullable()->constrained('inventory_locations')->nullOnDelete();
            $table->string('type');
            $table->integer('quantity');
            $table->integer('quantity_before')->nullable();
            $table->integer('quantity_after')->nullable();
            $table->string('reference_number')->nullable()->unique();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'product_variant_id']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'created_at']);
            $table->index('reference_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
