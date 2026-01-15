<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates EmployeeTaxSetting records for all users who don't have one.
     * This ensures NTA 2025 tax features are available for existing employees.
     */
    public function up(): void
    {
        $usersWithoutTaxSettings = DB::table('users')
            ->leftJoin('employee_tax_settings', 'users.id', '=', 'employee_tax_settings.user_id')
            ->whereNull('employee_tax_settings.id')
            ->whereNotNull('users.tenant_id')
            ->where('users.is_tenant_owner', false)
            ->select('users.id', 'users.tenant_id')
            ->get();

        if ($usersWithoutTaxSettings->isEmpty()) {
            return;
        }

        $now = now();

        $inserts = $usersWithoutTaxSettings->map(fn ($user) => [
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
            'is_tax_exempt' => false,
            'is_homeowner' => false,
            'active_reliefs' => json_encode([]),
            'low_income_auto_exempt' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        DB::table('employee_tax_settings')->insert($inserts);
    }

    /**
     * Reverse the migrations.
     * This migration only adds data, so we don't delete on rollback
     * to preserve any user-configured tax settings.
     */
    public function down(): void {}
};
