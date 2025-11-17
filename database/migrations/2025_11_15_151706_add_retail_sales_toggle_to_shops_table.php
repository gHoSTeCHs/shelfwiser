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
            $table->boolean('allow_retail_sales')->default(false)
                ->after('storefront_enabled')
                ->comment('For wholesale_only shops: allow retail sales on storefront');

            $table->index('allow_retail_sales');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex(['allow_retail_sales']);
            $table->dropColumn('allow_retail_sales');
        });
    }
};
