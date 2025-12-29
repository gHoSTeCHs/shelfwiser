<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            if (!Schema::hasColumn('payslips', 'ytd_gross')) {
                $table->decimal('ytd_gross', 15, 2)->nullable()->after('net_pay');
            }
            if (!Schema::hasColumn('payslips', 'ytd_tax')) {
                $table->decimal('ytd_tax', 15, 2)->nullable()->after('ytd_gross');
            }
            if (!Schema::hasColumn('payslips', 'ytd_pension')) {
                $table->decimal('ytd_pension', 15, 2)->nullable()->after('ytd_tax');
            }
            if (!Schema::hasColumn('payslips', 'ytd_net')) {
                $table->decimal('ytd_net', 15, 2)->nullable()->after('ytd_pension');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['ytd_gross', 'ytd_tax', 'ytd_pension', 'ytd_net']);
        });
    }
};
