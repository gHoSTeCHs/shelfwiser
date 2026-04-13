<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants');
            $table->string('name');
            $table->string('display_name')->nullable();
            $table->unsignedInteger('position');
            $table->string('visual_type');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'position'], 'product_options_product_position_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_options');
    }
};
