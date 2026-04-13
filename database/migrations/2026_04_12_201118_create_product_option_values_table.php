<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_option_id')->constrained('product_options')->cascadeOnDelete();
            $table->string('label');
            $table->string('value');
            $table->json('visual_data')->nullable();
            $table->unsignedInteger('position');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_option_id', 'value'], 'product_option_values_option_value_unique');
            $table->unique(['product_option_id', 'position'], 'product_option_values_option_position_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_values');
    }
};
