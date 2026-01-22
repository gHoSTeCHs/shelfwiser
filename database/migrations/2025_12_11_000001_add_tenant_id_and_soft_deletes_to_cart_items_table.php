<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();

            $table->softDeletes();

            $table->index(['tenant_id', 'cart_id']);
        });

        DB::statement('
            UPDATE cart_items
            SET tenant_id = (
                SELECT carts.tenant_id
                FROM carts
                WHERE carts.id = cart_items.cart_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('cart_items', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id', 'cart_id']);
            $table->dropColumn('tenant_id');
            $table->dropSoftDeletes();
        });
    }
};
