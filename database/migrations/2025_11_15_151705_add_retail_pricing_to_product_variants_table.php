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
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('retail_price', 15, 2)->nullable()->after('price')
                ->comment('Retail price for wholesale shops selling to end customers');

            $table->boolean('allow_retail_sales')->default(false)->after('is_available_online')
                ->comment('Allow this variant to be sold at retail price on storefront');

            $table->index('allow_retail_sales');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex(['allow_retail_sales']);
            $table->dropColumn(['retail_price', 'allow_retail_sales']);
        });
    }
};
