<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('product_packaging_type_id')
                ->nullable()
                ->after('product_variant_id')
                ->constrained('product_packaging_types')
                ->nullOnDelete();
            $table->string('packaging_description')->nullable()->after('product_packaging_type_id');

            $table->index('product_packaging_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['product_packaging_type_id']);
            $table->dropColumn([
                'product_packaging_type_id',
                'packaging_description',
            ]);
        });
    }
};
