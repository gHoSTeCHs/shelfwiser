<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->softDeletes();

            $table->index(['tenant_id', 'order_id']);
        });

        DB::statement('
            UPDATE order_items
            SET tenant_id = (
                SELECT orders.tenant_id
                FROM orders
                WHERE orders.id = order_items.order_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id', 'order_id']);
            $table->dropColumn('tenant_id');
            $table->dropSoftDeletes();
        });
    }
};
