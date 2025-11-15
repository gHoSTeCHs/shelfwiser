<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->enum('shop_offering_type', ['products', 'services', 'both'])
                ->default('products')
                ->after('allow_retail_sales');

            $table->index('shop_offering_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex(['shop_offering_type']);
            $table->dropColumn('shop_offering_type');
        });
    }
};
