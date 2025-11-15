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
            $table->string('currency', 3)->default('NGN')->after('inventory_model');
            $table->string('currency_symbol', 10)->default('₦')->after('currency');
            $table->tinyInteger('currency_decimals')->default(2)->after('currency_symbol');

            $table->index('currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex(['currency']);
            $table->dropColumn(['currency', 'currency_symbol', 'currency_decimals']);
        });
    }
};
