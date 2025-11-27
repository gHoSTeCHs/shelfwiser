<?php

namespace Database\Seeders;

use App\Enums\CompanySizeCategory;
use App\Models\CorporateTaxRate;
use App\Models\TaxJurisdiction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CorporateTaxRateSeeder extends Seeder
{
    public function run(): void
    {
        $nigeriaFederal = TaxJurisdiction::where('code', 'NG-FED')->first();

        if (! $nigeriaFederal) {
            return;
        }

        $rates2024 = [
            [
                'turnover_from' => 0,
                'turnover_to' => 25000000,
                'tax_rate' => 0.00,
                'company_size_category' => CompanySizeCategory::SMALL->value,
            ],
            [
                'turnover_from' => 25000000,
                'turnover_to' => 100000000,
                'tax_rate' => 20.00,
                'company_size_category' => CompanySizeCategory::MEDIUM->value,
            ],
            [
                'turnover_from' => 100000000,
                'turnover_to' => null,
                'tax_rate' => 30.00,
                'company_size_category' => CompanySizeCategory::LARGE->value,
            ],
        ];

        foreach ($rates2024 as $rate) {
            CorporateTaxRate::create([
                'tax_jurisdiction_id' => $nigeriaFederal->id,
                'turnover_from' => $rate['turnover_from'],
                'turnover_to' => $rate['turnover_to'],
                'tax_rate' => $rate['tax_rate'],
                'company_size_category' => $rate['company_size_category'],
                'effective_from' => Carbon::parse('2024-01-01'),
                'effective_to' => Carbon::parse('2024-12-31'),
            ]);
        }

        $rates2025 = [
            [
                'turnover_from' => 0,
                'turnover_to' => 25000000,
                'tax_rate' => 0.00,
                'company_size_category' => CompanySizeCategory::SMALL->value,
            ],
            [
                'turnover_from' => 25000000,
                'turnover_to' => 100000000,
                'tax_rate' => 20.00,
                'company_size_category' => CompanySizeCategory::MEDIUM->value,
            ],
            [
                'turnover_from' => 100000000,
                'turnover_to' => null,
                'tax_rate' => 27.50,
                'company_size_category' => CompanySizeCategory::LARGE->value,
            ],
        ];

        foreach ($rates2025 as $rate) {
            CorporateTaxRate::create([
                'tax_jurisdiction_id' => $nigeriaFederal->id,
                'turnover_from' => $rate['turnover_from'],
                'turnover_to' => $rate['turnover_to'],
                'tax_rate' => $rate['tax_rate'],
                'company_size_category' => $rate['company_size_category'],
                'effective_from' => Carbon::parse('2025-01-01'),
                'effective_to' => Carbon::parse('2025-12-31'),
            ]);
        }

        $rates2026 = [
            [
                'turnover_from' => 0,
                'turnover_to' => 25000000,
                'tax_rate' => 0.00,
                'company_size_category' => CompanySizeCategory::SMALL->value,
            ],
            [
                'turnover_from' => 25000000,
                'turnover_to' => 100000000,
                'tax_rate' => 20.00,
                'company_size_category' => CompanySizeCategory::MEDIUM->value,
            ],
            [
                'turnover_from' => 100000000,
                'turnover_to' => null,
                'tax_rate' => 25.00,
                'company_size_category' => CompanySizeCategory::LARGE->value,
            ],
        ];

        foreach ($rates2026 as $rate) {
            CorporateTaxRate::create([
                'tax_jurisdiction_id' => $nigeriaFederal->id,
                'turnover_from' => $rate['turnover_from'],
                'turnover_to' => $rate['turnover_to'],
                'tax_rate' => $rate['tax_rate'],
                'company_size_category' => $rate['company_size_category'],
                'effective_from' => Carbon::parse('2026-01-01'),
                'effective_to' => null,
            ]);
        }
    }
}
