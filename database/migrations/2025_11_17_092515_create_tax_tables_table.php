<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tax_tables')) {
            Schema::create('tax_tables', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('jurisdiction', 10)->default('NG');
                $table->year('effective_year');
                $table->boolean('is_system')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->unique(['tenant_id', 'jurisdiction', 'effective_year']);
                $table->index(['jurisdiction', 'effective_year', 'is_active']);
            });
        }

        if (! Schema::hasTable('tax_bands')) {
            Schema::create('tax_bands', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tax_table_id')->constrained()->cascadeOnDelete();
                $table->decimal('min_amount', 15, 2);
                $table->decimal('max_amount', 15, 2)->nullable();
                $table->decimal('rate', 5, 2);
                $table->decimal('cumulative_tax', 15, 2)->default(0);
                $table->unsignedSmallInteger('band_order');
                $table->timestamps();

                $table->index(['tax_table_id', 'band_order']);
            });
        }

        if (Schema::hasTable('tax_reliefs')) {
            if (Schema::hasColumn('tax_reliefs', 'tax_jurisdiction_id')) {
                Schema::dropIfExists('tax_reliefs');
            }
        }

        if (! Schema::hasTable('tax_reliefs')) {
            Schema::create('tax_reliefs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tax_table_id')->constrained()->cascadeOnDelete();
                $table->string('code', 50);
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('relief_type', 30)->default('fixed');
                $table->decimal('amount', 15, 2)->nullable();
                $table->decimal('rate', 8, 4)->nullable();
                $table->decimal('cap', 15, 2)->nullable();
                $table->boolean('is_automatic')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['tax_table_id', 'code']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_reliefs');
        Schema::dropIfExists('tax_bands');
        Schema::dropIfExists('tax_tables');
    }
};
