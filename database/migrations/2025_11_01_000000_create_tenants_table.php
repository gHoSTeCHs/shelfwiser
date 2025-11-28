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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('owner_email');

            $table->string('business_type')->nullable();
            $table->string('phone')->nullable();
            $table->string('logo_path')->nullable();

            // Subscription/billing
            $table->string('subscription_plan')->default('trial'); // trial, basic, premium
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();

            $table->integer('max_shops')->default(10);
            $table->integer('max_users')->default(10);
            $table->integer('max_products')->default(100);

            $table->json('settings')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('owner_email');
            $table->index('slug');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
