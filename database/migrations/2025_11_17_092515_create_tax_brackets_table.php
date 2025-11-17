<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_brackets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tax_jurisdiction_id')->constrained()->cascadeOnDelete();
            $table->decimal('income_from', 15, 2);
            $table->decimal('income_to', 15, 2)->nullable();
            $table->decimal('tax_rate', 5, 2);
            $table->integer('bracket_order');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->timestamps();

            $table->index(['tax_jurisdiction_id', 'effective_from', 'effective_to']);
            $table->index('bracket_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_brackets');
    }
};
