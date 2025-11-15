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
        // Drop existing placeholder customers table
        Schema::dropIfExists('customers');

        // Create proper customers table with authentication
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');

            // Preferred shop for personalization (hybrid approach)
            $table->foreignId('preferred_shop_id')
                ->nullable()
                ->constrained('shops')
                ->onDelete('set null');

            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone', 50)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->boolean('marketing_opt_in')->default(false);
            $table->rememberToken();
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'email']);
            $table->index('email');
            $table->index('preferred_shop_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
