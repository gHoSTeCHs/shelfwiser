<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('product_packaging_type_id')
                ->nullable()
                ->after('product_variant_id')
                ->constrained('product_packaging_types')
                ->nullOnDelete();
            $table->integer('package_quantity')->nullable()->after('quantity');
            $table->decimal('cost_per_package', 10, 2)->nullable()->after('package_quantity');
            $table->decimal('cost_per_base_unit', 10, 2)->nullable()->after('cost_per_package');

            $table->index('product_packaging_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['product_packaging_type_id']);
            $table->dropColumn([
                'product_packaging_type_id',
                'package_quantity',
                'cost_per_package',
                'cost_per_base_unit',
            ]);
        });
    }
};
