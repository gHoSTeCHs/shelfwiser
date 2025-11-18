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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('is_tenant_owner');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropUnique(['tenant_id', 'email']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->change();
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->nullOnDelete();
            $table->unique(['email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->dropForeign(['tenant_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->unique(['tenant_id', 'email']);
            $table->dropColumn('is_super_admin');
        });
    }
};
