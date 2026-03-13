<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('storefront_pages')
            ->whereNull('sections')
            ->update(['sections' => '[]']);

        Schema::table('storefront_pages', function (Blueprint $table) {
            $table->json('sections')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('storefront_pages', function (Blueprint $table) {
            $table->json('sections')->nullable()->change();
        });
    }
};
