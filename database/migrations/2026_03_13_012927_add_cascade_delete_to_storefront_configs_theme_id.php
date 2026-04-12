<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('storefront_configs', function (Blueprint $table) {
            $table->dropForeign(['theme_id']);
            $table->foreign('theme_id')
                ->references('id')
                ->on('storefront_themes')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('storefront_configs', function (Blueprint $table) {
            $table->dropForeign(['theme_id']);
            $table->foreign('theme_id')
                ->references('id')
                ->on('storefront_themes');
        });
    }
};
