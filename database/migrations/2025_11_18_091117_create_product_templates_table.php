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
        Schema::create('product_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('product_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->json('custom_attributes')->nullable();
            $table->json('template_structure');
            $table->json('images')->nullable();
            $table->json('seo_metadata')->nullable();

            $table->boolean('has_variants')->default(false);
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['tenant_id', 'slug']);
            $table->index(['is_system', 'is_active']);
            $table->index('product_type_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('template_id')->nullable()->after('shop_id')
                ->constrained('product_templates')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('template_id');
        });

        Schema::dropIfExists('product_templates');
    }
};
