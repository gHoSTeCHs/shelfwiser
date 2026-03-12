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
        Schema::create('storefront_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('theme_id')->constrained('storefront_themes');
            $table->string('color_preset')->nullable();
            $table->json('color_overrides')->nullable();
            $table->string('typography_preset')->nullable();
            $table->json('typography_overrides')->nullable();
            $table->json('component_overrides')->nullable();
            $table->json('feel_overrides')->nullable();
            $table->json('animation_overrides')->nullable();
            $table->json('header_overrides')->nullable();
            $table->json('footer_overrides')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->json('social_links')->nullable();
            $table->json('global_announcement')->nullable();
            $table->text('custom_css')->nullable();
            $table->json('seo_defaults')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique('shop_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storefront_configs');
    }
};
