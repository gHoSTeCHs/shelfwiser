<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_reliefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tax_jurisdiction_id')->constrained()->cascadeOnDelete();
            $table->string('relief_type');
            $table->string('calculation_method');
            $table->decimal('amount', 15, 2)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->decimal('cap_amount', 15, 2)->nullable();
            $table->json('formula')->nullable();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->timestamps();

            $table->index(['tax_jurisdiction_id', 'relief_type', 'effective_from']);
            $table->index('relief_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_reliefs');
    }
};
