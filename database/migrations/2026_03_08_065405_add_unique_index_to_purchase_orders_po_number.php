<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $indexes = collect(DB::select("SHOW INDEX FROM purchase_orders WHERE Key_name = 'purchase_orders_po_number_unique'"));

        if ($indexes->isEmpty()) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->string('po_number')->unique()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $indexes = collect(DB::select("SHOW INDEX FROM purchase_orders WHERE Key_name = 'purchase_orders_po_number_unique'"));

        if ($indexes->isNotEmpty()) {
            Schema::table('purchase_orders', function (Blueprint $table) {
                $table->dropUnique(['po_number']);
            });
        }
    }
};
