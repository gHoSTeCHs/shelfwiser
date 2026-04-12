<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('storefront_configs', function (Blueprint $table) {
            $table->boolean('dark_mode_enabled')->default(false)->after('is_published');
            $table->string('dark_mode_strategy')->default('system')->after('dark_mode_enabled');
            $table->string('color_preset_dark')->nullable()->after('color_preset');
            $table->json('color_overrides_dark')->nullable()->after('color_overrides');
        });
    }

    public function down(): void
    {
        Schema::table('storefront_configs', function (Blueprint $table) {
            $table->dropColumn(['dark_mode_enabled', 'dark_mode_strategy', 'color_preset_dark', 'color_overrides_dark']);
        });
    }
};
