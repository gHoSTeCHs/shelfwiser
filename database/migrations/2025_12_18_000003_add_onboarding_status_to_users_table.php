<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('onboarding_status', 50)
                ->default('pending')->after('is_active');
            $table->timestamp('onboarded_at')->nullable()->after('onboarding_status');
            $table->foreignId('onboarded_by')->nullable()->after('onboarded_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['onboarded_by']);
            $table->dropColumn(['onboarding_status', 'onboarded_at', 'onboarded_by']);
        });
    }
};
