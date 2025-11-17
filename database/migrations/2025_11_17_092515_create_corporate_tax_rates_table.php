<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('corporate_tax_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tax_jurisdiction_id')->constrained()->cascadeOnDelete();
            $table->decimal('turnover_from', 15, 2);
            $table->decimal('turnover_to', 15, 2)->nullable();
            $table->decimal('tax_rate', 5, 2);
            $table->string('company_size_category');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->timestamps();

            $table->index(['tax_jurisdiction_id', 'effective_from', 'effective_to']);
            $table->index('company_size_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('corporate_tax_rates');
    }
};
