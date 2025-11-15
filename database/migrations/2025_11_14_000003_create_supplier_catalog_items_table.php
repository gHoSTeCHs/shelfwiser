<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_catalog_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_available')->default(true);
            $table->decimal('base_wholesale_price', 15, 2);
            $table->integer('min_order_quantity')->default(1);
            $table->enum('visibility', ['public', 'private', 'connections_only'])->default('connections_only');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['supplier_tenant_id', 'product_id']);
            $table->index(['supplier_tenant_id', 'is_available']);
            $table->index('visibility');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_catalog_items');
    }
};
