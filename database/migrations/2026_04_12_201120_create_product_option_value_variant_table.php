<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_option_value_variant', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('product_option_value_id')->constrained('product_option_values')->cascadeOnDelete();

            $table->unique(
                ['product_variant_id', 'product_option_value_id'],
                'option_value_variant_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_value_variant');
    }
};
