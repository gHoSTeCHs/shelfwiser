<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_enabled')->default(false);
            $table->string('business_registration')->nullable();
            $table->string('tax_id')->nullable();
            $table->string('payment_terms')->default('Net 30');
            $table->integer('lead_time_days')->default(7);
            $table->decimal('minimum_order_value', 15, 2)->default(0);
            $table->enum('connection_approval_mode', ['auto', 'owner', 'general_manager', 'assistant_manager'])
                ->default('owner');
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique('tenant_id');
            $table->index('is_enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_profiles');
    }
};
