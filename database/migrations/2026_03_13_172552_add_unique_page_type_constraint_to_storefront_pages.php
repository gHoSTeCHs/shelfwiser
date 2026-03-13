<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            UPDATE storefront_pages
            SET slug = page_type
            WHERE slug IS NULL
        ");

        Schema::table('storefront_pages', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropUnique(['shop_id', 'page_type', 'slug']);
        });

        Schema::table('storefront_pages', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->default('')->change();
            $table->unique(['shop_id', 'page_type', 'slug']);
            $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('storefront_pages', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropUnique(['shop_id', 'page_type', 'slug']);
        });

        Schema::table('storefront_pages', function (Blueprint $table) {
            $table->string('slug')->nullable()->default(null)->change();
            $table->unique(['shop_id', 'page_type', 'slug']);
            $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();
        });

        DB::statement("
            UPDATE storefront_pages
            SET slug = NULL
            WHERE slug = page_type
        ");
    }
};
