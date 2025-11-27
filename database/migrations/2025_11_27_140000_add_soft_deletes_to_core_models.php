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
        // Add soft deletes to Products
        Schema::table('products', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Product Variants
        Schema::table('product_variants', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Orders
        Schema::table('orders', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Customers
        Schema::table('customers', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Services
        Schema::table('services', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Service Variants
        Schema::table('service_variants', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Shops
        Schema::table('shops', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Users (Staff)
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Product Categories
        Schema::table('product_categories', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Add soft deletes to Tenants
        Schema::table('tenants', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('service_variants', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
