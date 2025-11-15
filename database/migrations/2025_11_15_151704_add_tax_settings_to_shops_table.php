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
        Schema::table('shops', function (Blueprint $table) {
            $table->boolean('vat_enabled')->default(false)->after('currency_decimals');
            $table->decimal('vat_rate', 5, 2)->default(0)->after('vat_enabled')
                ->comment('VAT rate as percentage (e.g., 7.5 for 7.5%)');
            $table->boolean('vat_inclusive')->default(false)->after('vat_rate')
                ->comment('Are product prices VAT-inclusive?');

            $table->index('vat_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex(['vat_enabled']);
            $table->dropColumn(['vat_enabled', 'vat_rate', 'vat_inclusive']);
        });
    }
};
