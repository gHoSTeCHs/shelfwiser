<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_tax_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('tax_id_number')->nullable();
            $table->string('tax_state', 50)->nullable();
            $table->boolean('is_tax_exempt')->default(false);
            $table->string('exemption_reason')->nullable();
            $table->date('exemption_expires_at')->nullable();
            $table->json('active_reliefs')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id']);
            $table->index(['user_id', 'is_tax_exempt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_tax_settings');
    }
};
