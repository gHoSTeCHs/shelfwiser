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
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('tenant_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_type_id')->after('tenant_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->after('product_type_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->string('name')->after('shop_id');
            $table->string('slug')->after('name');
            $table->text('description')->nullable()->after('slug');
            $table->json('custom_attributes')->nullable()->after('description');
            $table->boolean('has_variants')->default(false)->after('custom_attributes');
            $table->boolean('is_active')->default(true)->after('has_variants');

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'product_type_id']);
            $table->index(['tenant_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'category_id']);
            $table->dropIndex(['tenant_id', 'product_type_id']);
            $table->dropUnique(['tenant_id', 'slug']);

            $table->dropForeign(['category_id']);
            $table->dropForeign(['product_type_id']);
            $table->dropForeign(['tenant_id']);

            $table->dropColumn([
                'tenant_id',
                'product_type_id',
                'category_id',
                'name',
                'slug',
                'description',
                'custom_attributes',
                'has_variants',
                'is_active',
            ]);
        });
    }
};
