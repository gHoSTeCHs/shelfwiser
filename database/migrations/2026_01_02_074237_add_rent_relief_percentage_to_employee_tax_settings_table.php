<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_tax_settings', function (Blueprint $table) {
            $table->decimal('rent_relief_percentage', 5, 2)
                ->default(20.00)
                ->after('active_reliefs')
                ->comment('Percentage of basic salary for rent relief (PITA 2011 only)');
        });
    }

    public function down(): void
    {
        Schema::table('employee_tax_settings', function (Blueprint $table) {
            $table->dropColumn('rent_relief_percentage');
        });
    }
};
