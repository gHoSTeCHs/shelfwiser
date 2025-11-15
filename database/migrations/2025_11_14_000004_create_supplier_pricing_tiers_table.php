<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_pricing_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('catalog_item_id')->constrained('supplier_catalog_items')->cascadeOnDelete();
            $table->foreignId('connection_id')->nullable()->constrained('supplier_connections')->cascadeOnDelete();
            $table->integer('min_quantity');
            $table->integer('max_quantity')->nullable();
            $table->decimal('price', 15, 2);
            $table->timestamps();

            $table->index(['catalog_item_id', 'min_quantity']);
            $table->index('connection_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_pricing_tiers');
    }
};
