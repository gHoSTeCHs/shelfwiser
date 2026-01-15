<?php

namespace Database\Seeders;

use App\Enums\TaxLawVersion;
use App\Enums\TaxReliefType;
use App\Models\TaxBand;
use App\Models\TaxRelief;
use App\Models\TaxTable;
use Illuminate\Database\Seeder;

class TaxTableSeeder extends Seeder
{
    /**
     * Seed PITA 2011 tax table (effective until December 31, 2025).
     * This represents the legacy Nigerian tax law before NTA 2025 takes effect.
     */
    public function run(): void
    {
        $taxTable = TaxTable::updateOrCreate(
            ['jurisdiction' => 'NG', 'effective_year' => 2024, 'is_system' => true],
            [
                'name' => 'Nigeria PAYE Tax Table (PITA 2011)',
                'description' => 'Nigerian Pay As You Earn (PAYE) progressive tax bands per Personal Income Tax Act 2011. Valid until December 31, 2025.',
                'effective_from' => '2011-01-01',
                'effective_to' => '2025-12-31',
                'tax_law_reference' => TaxLawVersion::PITA_2011->value,
                'has_low_income_exemption' => false,
                'low_income_threshold' => null,
                'cra_applicable' => true,
                'minimum_tax_rate' => 1,
                'is_active' => true,
            ]
        );

        $bands = [
            ['min' => 0, 'max' => 300000, 'rate' => 7, 'order' => 1],
            ['min' => 300000, 'max' => 600000, 'rate' => 11, 'order' => 2],
            ['min' => 600000, 'max' => 1100000, 'rate' => 15, 'order' => 3],
            ['min' => 1100000, 'max' => 1600000, 'rate' => 19, 'order' => 4],
            ['min' => 1600000, 'max' => 3200000, 'rate' => 21, 'order' => 5],
            ['min' => 3200000, 'max' => null, 'rate' => 24, 'order' => 6],
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
                'code' => 'CRA',
                'name' => 'Consolidated Relief Allowance',
                'description' => 'Higher of ₦200,000 or 1% of gross income, plus 20% of gross income',
                'relief_type' => TaxReliefType::CAPPED_PERCENTAGE->value,
                'rate' => 20,
                'amount' => 200000,
                'is_automatic' => true,
            ],
            [
                'code' => 'PENSION_RELIEF',
                'name' => 'Pension Contribution Relief',
                'description' => 'Employee pension contributions are tax-deductible',
                'relief_type' => TaxReliefType::PERCENTAGE->value,
                'rate' => 8,
                'is_automatic' => true,
            ],
            [
                'code' => 'NHF_RELIEF',
                'name' => 'NHF Contribution Relief',
                'description' => 'National Housing Fund contributions are tax-deductible',
                'relief_type' => TaxReliefType::PERCENTAGE->value,
                'rate' => 2.5,
                'is_automatic' => false,
            ],
            [
                'code' => 'NHIS_RELIEF',
                'name' => 'NHIS Contribution Relief',
                'description' => 'Health insurance contributions are tax-deductible',
                'relief_type' => TaxReliefType::PERCENTAGE->value,
                'rate' => 1.75,
                'is_automatic' => false,
            ],
            [
                'code' => 'LIFE_INSURANCE',
                'name' => 'Life Insurance Premium Relief',
                'description' => 'Life assurance premiums for self or dependents',
                'relief_type' => TaxReliefType::FIXED->value,
                'amount' => 0,
                'is_automatic' => false,
            ],
        ];

        foreach ($reliefs as $relief) {
            TaxRelief::updateOrCreate(
                ['tax_table_id' => $taxTable->id, 'code' => $relief['code']],
                array_merge($relief, ['is_active' => true])
            );
        }

        $this->command->info('Created PITA 2011 tax table with '.count($bands).' bands and '.count($reliefs).' reliefs.');
        $this->command->info('PITA 2011 table is effective from 2011-01-01 to 2025-12-31');
        $this->command->info('After Dec 31, 2025, the system will automatically switch to NTA 2025 based on effective_from dates.');
    }
}
