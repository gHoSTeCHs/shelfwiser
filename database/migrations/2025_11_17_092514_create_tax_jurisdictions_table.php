<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_jurisdictions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('country_code', 2);
            $table->string('state_province')->nullable();
            $table->string('city')->nullable();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['country_code', 'is_active']);
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_jurisdictions');
    }
};
