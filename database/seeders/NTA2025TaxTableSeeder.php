<?php

namespace Database\Seeders;

use App\Enums\TaxLawVersion;
use App\Enums\TaxReliefType;
use App\Models\TaxBand;
use App\Models\TaxRelief;
use App\Models\TaxTable;
use Illuminate\Database\Seeder;

class NTA2025TaxTableSeeder extends Seeder
{
    /**
     * Seed NTA 2025 tax table (effective from January 1, 2026).
     *
     * MIGRATION PATH:
     * 1. Before 2026-01-01: System uses PITA 2011 (TaxTableSeeder)
     * 2. On/After 2026-01-01: System automatically switches to NTA 2025
     * 3. Selection is date-based via TaxTable::getActiveTableForDate()
     * 4. Both tables coexist in the database with different effective_from/effective_to dates
     *
     * KEY DIFFERENCES FROM PITA 2011:
     * - No CRA (Consolidated Relief Allowance) - uses Rent Relief instead
     * - Low Income Exemption: Full exemption for income ≤ ₦800,000
     * - New Rent Relief: min(₦500,000, 20% of annual rent) for non-homeowners
     * - Simplified tax bands with higher thresholds
     * - Different rate structure (0%, 15%, 18%, 21%, 23%, 25%)
     */
    public function run(): void
    {
        $taxTable = TaxTable::updateOrCreate(
            ['jurisdiction' => 'NG', 'effective_year' => 2026, 'is_system' => true],
            [
                'name' => 'Nigeria Tax Act 2025 PAYE Table',
                'description' => 'Nigerian Pay As You Earn (PAYE) progressive tax bands per NTA 2025, effective January 1, 2026',
                'effective_from' => '2026-01-01',
                'effective_to' => null,
                'tax_law_reference' => TaxLawVersion::NTA_2025->value,
                'has_low_income_exemption' => true,
                'low_income_threshold' => 800000,
                'cra_applicable' => false,
                'minimum_tax_rate' => null,
                'is_active' => true,
            ]
        );

        $bands = [
            ['min' => 0, 'max' => 800000, 'rate' => 0, 'order' => 1],
            ['min' => 800000, 'max' => 3000000, 'rate' => 15, 'order' => 2],
            ['min' => 3000000, 'max' => 12000000, 'rate' => 18, 'order' => 3],
            ['min' => 12000000, 'max' => 25000000, 'rate' => 21, 'order' => 4],
            ['min' => 25000000, 'max' => 50000000, 'rate' => 23, 'order' => 5],
            ['min' => 50000000, 'max' => null, 'rate' => 25, 'order' => 6],
        ];

        $cumulativeTax = 0;
        foreach ($bands as $band) {
            TaxBand::updateOrCreate(
                ['tax_table_id' => $taxTable->id, 'band_order' => $band['order']],
                [
                    'min_amount' => $band['min'],
                    'max_amount' => $band['max'],
                    'rate' => $band['rate'],
                    'cumulative_tax' => $cumulativeTax,
                ]
            );

            if ($band['max']) {
                $cumulativeTax += ($band['max'] - $band['min']) * ($band['rate'] / 100);
            }
        }

        $reliefs = [
            [
                'code' => 'RENT_RELIEF',
                'name' => 'Rent Relief',
                'description' => 'NTA 2025 rent relief for non-homeowners: min(₦500,000, 20% of annual rent)',
                'relief_type' => TaxReliefType::RENT_RELIEF->value,
                'rate' => 20,
                'cap' => 500000,
                'is_automatic' => false,
                'requires_proof' => true,
                'proof_type' => 'rent_receipt',
                'eligibility_criteria' => json_encode(['is_homeowner' => false]),
            ],
            [
                'code' => 'PENSION_RELIEF',
                'name' => 'Pension Contribution Relief',
                'description' => 'Employee pension contributions are tax-deductible',
                'relief_type' => TaxReliefType::PERCENTAGE->value,
                'rate' => 8,
                'is_automatic' => true,
                'requires_proof' => false,
            ],
            [
                'code' => 'NHF_RELIEF',
                'name' => 'NHF Contribution Relief',
                'description' => 'National Housing Fund contributions are tax-deductible',
                'relief_type' => TaxReliefType::PERCENTAGE->value,
                'rate' => 2.5,
                'is_automatic' => false,
                'requires_proof' => false,
            ],
            [
                'code' => 'NHIS_RELIEF',
                'name' => 'NHIS Contribution Relief',
                'description' => 'Health insurance contributions are tax-deductible',
                'relief_type' => TaxReliefType::PERCENTAGE->value,
                'rate' => 1.75,
                'is_automatic' => false,
                'requires_proof' => false,
            ],
            [
                'code' => 'LOW_INCOME_EXEMPTION',
                'name' => 'Low Income Exemption',
                'description' => 'Full tax exemption for annual income ≤₦800,000 under NTA 2025',
                'relief_type' => TaxReliefType::LOW_INCOME_EXEMPTION->value,
                'amount' => 800000,
                'is_automatic' => true,
                'requires_proof' => false,
                'calculation_formula' => 'if(annual_income <= 800000) { tax = 0 }',
            ],
        ];

        foreach ($reliefs as $relief) {
            TaxRelief::updateOrCreate(
                ['tax_table_id' => $taxTable->id, 'code' => $relief['code']],
                array_merge($relief, ['is_active' => true])
            );
        }

        $this->updatePita2011Table();

        $this->command->info('Created NTA 2025 tax table with '.count($bands).' bands and '.count($reliefs).' reliefs.');
    }

    /**
     * Update existing PITA 2011 table with proper versioning fields.
     *
     * This ensures a clean migration path by:
     * 1. Setting effective_to = 2025-12-31 on PITA 2011 table
     * 2. Setting effective_from = 2026-01-01 on NTA 2025 table
     * 3. Adding tax_law_reference to distinguish versions
     * 4. Configuring law-specific flags (CRA, low income exemption, etc.)
     *
     * This allows the system to automatically select the correct tax table
     * based on the payroll calculation date without manual intervention.
     */
    protected function updatePita2011Table(): void
    {
        $pita2011 = TaxTable::where('jurisdiction', 'NG')
            ->where('is_system', true)
            ->where('effective_year', '<=', 2025)
            ->orderByDesc('effective_year')
            ->first();

        if ($pita2011) {
            $pita2011->update([
                'effective_from' => '2011-01-01',
                'effective_to' => '2025-12-31',
                'tax_law_reference' => TaxLawVersion::PITA_2011->value,
                'has_low_income_exemption' => false,
                'low_income_threshold' => null,
                'cra_applicable' => true,
                'minimum_tax_rate' => 1,
            ]);

            $this->command->info('Updated existing PITA 2011 tax table with effective dates and law reference.');
            $this->command->info('PITA 2011 will be active until 2025-12-31, then NTA 2025 takes over on 2026-01-01.');
        } else {
            $this->command->warn('No PITA 2011 table found to update. Run TaxTableSeeder first.');
        }
    }
}
