<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tax_tables', function (Blueprint $table) {
            $table->date('effective_from')->nullable()->after('effective_year');
            $table->date('effective_to')->nullable()->after('effective_from');
            $table->string('tax_law_reference', 50)->nullable()->after('effective_to');
            $table->boolean('has_low_income_exemption')->default(false)->after('tax_law_reference');
            $table->decimal('low_income_threshold', 15, 2)->nullable()->after('has_low_income_exemption');
            $table->boolean('cra_applicable')->default(true)->after('low_income_threshold');
            $table->decimal('minimum_tax_rate', 5, 2)->nullable()->after('cra_applicable');
        });

        Schema::table('tax_reliefs', function (Blueprint $table) {
            $table->boolean('requires_proof')->default(false)->after('is_active');
            $table->string('proof_type')->nullable()->after('requires_proof');
            $table->json('eligibility_criteria')->nullable()->after('proof_type');
            $table->string('calculation_formula')->nullable()->after('eligibility_criteria');
        });

        Schema::table('employee_tax_settings', function (Blueprint $table) {
            $table->boolean('is_homeowner')->default(false)->after('active_reliefs');
            $table->decimal('annual_rent_paid', 15, 2)->nullable()->after('is_homeowner');
            $table->string('rent_proof_document')->nullable()->after('annual_rent_paid');
            $table->date('rent_proof_expiry')->nullable()->after('rent_proof_document');
            $table->json('relief_claims')->nullable()->after('rent_proof_expiry');
            $table->boolean('low_income_auto_exempt')->default(false)->after('relief_claims');
        });
    }

    public function down(): void
    {
        Schema::table('tax_tables', function (Blueprint $table) {
            $table->dropColumn([
                'effective_from',
                'effective_to',
                'tax_law_reference',
                'has_low_income_exemption',
                'low_income_threshold',
                'cra_applicable',
                'minimum_tax_rate',
            ]);
        });

        Schema::table('tax_reliefs', function (Blueprint $table) {
            $table->dropColumn([
                'requires_proof',
                'proof_type',
                'eligibility_criteria',
                'calculation_formula',
            ]);
        });

        Schema::table('employee_tax_settings', function (Blueprint $table) {
            $table->dropColumn([
                'is_homeowner',
                'annual_rent_paid',
                'rent_proof_document',
                'rent_proof_expiry',
                'relief_claims',
                'low_income_auto_exempt',
            ]);
        });
    }
};
